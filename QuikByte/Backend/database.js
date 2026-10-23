const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "encave.db"));

// Improve SQLite reliability for local development.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
    available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL DEFAULT 'Guest',
    pickup_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN (
        'pending', 'preparing', 'ready', 'completed', 'cancelled'
      )),
    total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    menu_item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
`);

// Sample data for development only.
// Replace these with Encave's actual menu and prices.
const menuCount = db
  .prepare("SELECT COUNT(*) AS count FROM menu_items")
  .get().count;

if (menuCount === 0) {
  const insertItem = db.prepare(`
    INSERT INTO menu_items
      (name, description, category, price_paise)
    VALUES (?, ?, ?, ?)
  `);

  const seedMenu = db.transaction(() => {
    insertItem.run("Masala Dosa", "Crispy dosa with potato masala", "South Indian", 6000);
    insertItem.run("Veg Sandwich", "Toasted vegetable sandwich", "Snacks", 5000);
    insertItem.run("Paneer Roll", "Paneer wrapped in a soft roll", "Snacks", 7000);
    insertItem.run("Cold Coffee", "Chilled coffee drink", "Drinks", 4500);
    insertItem.run("Tea", "Hot cup of tea", "Drinks", 1500);
  });

  seedMenu();
}

module.exports = db;