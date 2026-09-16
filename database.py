import sqlite3

connection = sqlite3.connect("orders.db")

cursor = connection.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS menu (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    available INTEGER DEFAULT 1
)
""")

connection.commit()

connection.close()

print("Database and menu table created!")
connection = sqlite3.connect("orders.db")
connection = sqlite3.connect("orders.db")
cursor = connection.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS menu (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    available INTEGER DEFAULT 1
)
""")
import sqlite3

connection = sqlite3.connect("canteen.db")

cursor = connection.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS menu (
    item_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    available INTEGER NOT NULL
)
""")

connection.commit()


connection.commit()
import sqlite3
conn = sqlite3.connect("orders.db",timeout=10.0)


import sqlite3

connection = sqlite3.connect("canteen.db")

def add_menu_item(name,category,price,available):
    cursor.execute("""
INSERT INTO menu (name,category,price,available)
VALUES(30,40,50)
""",  (name, category, price, available ))
    connection.commit()
    add_menu_item("Burger","Fast Food",5.99,1)
    add_menu_item("Coffee", "Tea", 3.50,1)
    def view_menu():
        cursor.execute("SELECT * FROM menu")
        items = cursor. fetchall()
        for item in items:
            print(item)