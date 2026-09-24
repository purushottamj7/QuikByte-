import sqlite3
from datetime import datetime


def create_order(order_id, items):
    """
    items format:
    [(item_id, quantity), (item_id, quantity)]
    """

    conn = sqlite3.connect("restaurant.db")
    cursor = conn.cursor()

    total = 0

    # Calculate total
    for item_id, quantity in items:

        cursor.execute(
            "SELECT price FROM menu WHERE item_id = ?",
            (item_id,)
        )

        result = cursor.fetchone()

        if result is None:
            print("Item", item_id, "does not exist.")
            conn.close()
            return

        price = result[0]
        total += price * quantity

    # Insert order
    cursor.execute("""
        INSERT INTO orders (order_id, status, timestamp, total)
        VALUES (?, ?, ?, ?)
    """, (
        order_id,
        "waiting",
        datetime.now(),
        total
    ))

    # Insert order items
    for item_id, quantity in items:

        cursor.execute("""
            INSERT INTO order_items (order_id, item_id, quantity)
            VALUES (?, ?, ?)
        """, (
            order_id,
            item_id,
            quantity
        ))

    conn.commit()
    conn.close()

    print("Order created successfully!")
    print("Order ID:", order_id)
    print("Total:", total)






































































































import sqlite3
from datetime import datetime


def create_order(order_id, items):

    conn = sqlite3.connect("restaurant.db")
    cursor = conn.cursor()

    total = 0

    for item_id, quantity in items:

        cursor.execute(
            "SELECT price FROM menu WHERE item_id = ?",
            (item_id,)
        )

        result = cursor.fetchone()

        if result is None:
            print("Item does not exist:", item_id)
            conn.close()
            return

        price = result[0]

        total = total + (price * quantity)

    cursor.execute("""
        INSERT INTO orders
        (order_id, status, timestamp, total)
        VALUES (?, ?, ?, ?)
    """, (
        order_id,
        "waiting",
        datetime.now(),
        total
    ))

    for item_id, quantity in items:

        cursor.execute("""
            INSERT INTO order_items
            (order_id, item_id, quantity)
            VALUES (?, ?, ?)
        """, (
            order_id,
            item_id,
            quantity
        ))

    conn.commit()
    conn.close()

    print("Order created successfully!")
    print("Order ID:", order_id)
    print("Total:", total)