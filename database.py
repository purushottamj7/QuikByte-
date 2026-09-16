import sqlite3

connection = sqlite3.connect("quikbyte.db")

print("Database connected!")

cursor = connection.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price INTEGER
)
""")

cursor.execute("""
INSERT OR IGNORE INTO menu (id, name, price)
VALUES (1, 'Pizza', 120)
""")

cursor.execute("SELECT * FROM menu")
print(cursor.fetchall())

connection.commit()
connection.close()

