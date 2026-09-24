import sqlite3

# Connect to database
conn = sqlite3.connect("restaurant.db")

# Create cursor
cursor = conn.cursor()

# Create Menu table
cursor.execute("""
CREATE TABLE IF NOT EXISTS menu (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    available INTEGER DEFAULT 1
)
""")

# Create Orders table
cursor.execute("""
CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL DEFAULT 0
)
""")

# Create Order_Items table
cursor.execute("""
CREATE TABLE IF NOT EXISTS order_items (
    order_id TEXT,
    item_id INTEGER,
    quantity INTEGER NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES menu(item_id)
)
""")

# Save changes
conn.commit()

# Close database
conn.close()

print("Database and tables created successfully!")
import sqlite3

conn = sqlite3.connect("restaurant.db")
cursor = conn.cursor()

menu_items = [
    ("Margherita Pizza", "Pizza", 250, 1),
    ("Farmhouse Pizza", "Pizza", 350, 1),
    ("Veg Burger", "Burger", 150, 1),
    ("Chicken Burger", "Burger", 200, 1),
    ("French Fries", "Sides", 100, 1),
    ("Garlic Bread", "Sides", 120, 1),
    ("Coke", "Drinks", 50, 1),
    ("Cold Coffee", "Drinks", 100, 1),
    ("Veg Sandwich", "Sandwich", 130, 1),
    ("Chocolate Brownie", "Dessert", 120, 1)
]

cursor.executemany("""
INSERT INTO menu (name, category, price, available)
VALUES (?, ?, ?, ?)
""", menu_items)

conn.commit()
conn.close()

print("10 menu items inserted successfully!")
import sqlite3

conn = sqlite3.connect("restaurant.db")
cursor = conn.cursor()

cursor.execute("SELECT * FROM menu")

items = cursor.fetchall()

print("MENU")
print("-" * 50)

for item in items:
    print(
        "ID:", item[0],
        "| Name:", item[1],
        "| Category:", item[2],
        "| Price:", item[3],
        "| Available:", item[4]
    )

conn.close()