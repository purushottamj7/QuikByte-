const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors()); // Development only; restrict origins before deployment.
app.use(express.json({ limit: "20kb" }));

// Check that the API is running.
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Encave API is running",
  });
});

// Return the available menu.
app.get("/api/menu", (req, res) => {
  const menu = db.prepare(`
    SELECT id, name, description, category,
           price_paise, available
    FROM menu_items
    WHERE available = 1
    ORDER BY category, name
  `).all();

  res.json({
    success: true,
    menu: menu.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price_paise / 100,
      available: Boolean(item.available),
    })),
  });
});

// Create an order using prices stored in the database.
app.post("/api/orders", (req, res) => {
  const { customerName, pickupSlot, items } = req.body;

  if (
    typeof pickupSlot !== "string" ||
    !pickupSlot.trim() ||
    pickupSlot.length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid pickup slot is required.",
    });
  }

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50
  ) {
    return res.status(400).json({
      success: false,
      message: "Add at least one item to your order.",
    });
  }

  if (
    customerName !== undefined &&
    (typeof customerName !== "string" || customerName.trim().length > 100)
  ) {
    return res.status(400).json({
      success: false,
      message: "Customer name must be 100 characters or fewer.",
    });
  }

  const normalizedItems = [];

  for (const item of items) {
    const menuItemId = Number(item.menuItemId);
    const quantity = Number(item.quantity);

    if (
      !Number.isSafeInteger(menuItemId) ||
      menuItemId <= 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    ) {
      return res.status(400).json({
        success: false,
        message: "Each item needs a valid ID and quantity from 1 to 20.",
      });
    }

    normalizedItems.push({ menuItemId, quantity });
  }

  // Combine repeated IDs so a duplicated cart entry cannot cause confusion.
  const quantities = new Map();

  for (const item of normalizedItems) {
    const combined = (quantities.get(item.menuItemId) || 0) + item.quantity;

    if (combined > 20) {
      return res.status(400).json({
        success: false,
        message: "The maximum quantity per menu item is 20.",
      });
    }

    quantities.set(item.menuItemId, combined);
  }

  const getMenuItem = db.prepare(`
    SELECT id, name, price_paise
    FROM menu_items
    WHERE id = ? AND available = 1
  `);

  const orderId = randomUUID();
  const orderItems = [];
  let totalPaise = 0;

  for (const [menuItemId, quantity] of quantities) {
    const menuItem = getMenuItem.get(menuItemId);

    if (!menuItem) {
      return res.status(400).json({
        success: false,
        message: `Menu item ${menuItemId} is unavailable or does not exist.`,
      });
    }

    totalPaise += menuItem.price_paise * quantity;

    orderItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity,
      unitPricePaise: menuItem.price_paise,
    });
  }

  // Save the order and its items together.
  // If either insert fails, the transaction rolls back.
  const saveOrder = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders
        (id, customer_name, pickup_slot, total_paise)
      VALUES (?, ?, ?, ?)
    `).run(
      orderId,
      customerName?.trim() || "Guest",
      pickupSlot.trim(),
      totalPaise
    );

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items
        (order_id, menu_item_id, item_name, quantity, unit_price_paise)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of orderItems) {
      insertOrderItem.run(
        orderId,
        item.menuItemId,
        item.name,
        item.quantity,
        item.unitPricePaise
      );
    }
  });

  try {
    saveOrder();

    return res.status(201).json({
      success: true,
      order: {
        id: orderId,
        customerName: customerName?.trim() || "Guest",
        pickupSlot: pickupSlot.trim(),
        status: "pending",
        total: totalPaise / 100,
        items: orderItems.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPricePaise / 100,
        })),
      },
    });
  } catch (error) {
    console.error("Could not save order:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not save your order.",
    });
  }
});

// Retrieve an order after it has been saved.
app.get("/api/orders/:id", (req, res) => {
  const order = db.prepare(`
    SELECT id, customer_name, pickup_slot, status,
           total_paise, created_at
    FROM orders
    WHERE id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found.",
    });
  }

  const items = db.prepare(`
    SELECT menu_item_id, item_name, quantity, unit_price_paise
    FROM order_items
    WHERE order_id = ?
  `).all(order.id);

  res.json({
    success: true,
    order: {
      id: order.id,
      customerName: order.customer_name,
      pickupSlot: order.pickup_slot,
      status: order.status,
      total: order.total_paise / 100,
      createdAt: order.created_at,
      items: items.map((item) => ({
        menuItemId: item.menu_item_id,
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: item.unit_price_paise / 100,
      })),
    },
  });
});

// Report unexpected errors without exposing internal details.
app.use((error, req, res, next) => {
  console.error(error.message);

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`Encave API running at http://localhost:${PORT}`);
});