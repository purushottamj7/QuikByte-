import os
from flask import Flask, render_template, redirect, url_for, request, session, send_from_directory
import sqlite3

app = Flask(__name__)
app.secret_key = os.environ.get(
    "SECRET_KEY",
    "development-secret-key"
)


# ---------------- MENU ----------------

MENU = {
    "Pizza": 80,
    "Burger": 60,
    "Sandwich": 50,
    "Cold Drink": 30,
    "Tea": 15
}


# ---------------- DATABASE CONNECTION ----------------

def get_db():

    conn = sqlite3.connect("campusflow.db")

    conn.row_factory = sqlite3.Row

    return conn


# ---------------- CREATE DATABASE ----------------

def init_db():

    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT DEFAULT 'Guest',
            roll_number TEXT DEFAULT 'N/A',
            consumer_id TEXT,
            status TEXT NOT NULL,
            total_price INTEGER NOT NULL
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            item TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT UNIQUE NOT NULL,
            price INTEGER NOT NULL,
            available INTEGER NOT NULL DEFAULT 1
        )
    """)

    for item, price in MENU.items():

        conn.execute(
            """
            INSERT OR IGNORE INTO menu_items
            (item, price, available)
            VALUES (?, ?, 1)
            """,
            (item, price)
        )

    columns = conn.execute(
        "PRAGMA table_info(orders)"
    ).fetchall()

    column_names = [
        column["name"]
        for column in columns
    ]

    if "customer_name" not in column_names:

        conn.execute(
            """
            ALTER TABLE orders
            ADD COLUMN customer_name TEXT DEFAULT 'Guest'
            """
        )

    if "roll_number" not in column_names:

        conn.execute(
            """
            ALTER TABLE orders
            ADD COLUMN roll_number TEXT DEFAULT 'N/A'
            """
        )

    if "consumer_id" not in column_names:

        conn.execute(
            """
            ALTER TABLE orders
            ADD COLUMN consumer_id TEXT
            """
        )

    conn.commit()

    conn.close()


# ---------------- GET MENU ITEMS ----------------

def get_menu_items():

    conn = get_db()

    items = conn.execute(
        """
        SELECT *
        FROM menu_items
        ORDER BY id
        """
    ).fetchall()

    conn.close()

    return items


# ---------------- HOME PAGE ----------------

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ---------------- ROBOTS.TXT ----------------

@app.route("/robots.txt")
def robots():

    return send_from_directory(
        ".",
        "robots.txt"
    )


# ---------------- SITEMAP.XML ----------------

@app.route("/sitemap.xml")
def sitemap():

    return send_from_directory(
        ".",
        "sitemap.xml"
    )


# ---------------- MENU PAGE ----------------

@app.route("/menu")
def menu():

    menu_items = get_menu_items()

    cart = session.get(
        "cart",
        {}
    )

    cart_count = sum(
        cart.values()
    )

    return render_template(
        "menu.html",
        menu_items=menu_items,
        cart_count=cart_count
    )


# ---------------- ADD TO CART ----------------

@app.route("/add-to-cart/<item>")
def add_to_cart(item):

    if item not in MENU:

        return "Item not found"

    cart = session.get(
        "cart",
        {}
    )

    cart[item] = cart.get(
        item,
        0
    ) + 1

    session["cart"] = cart

    return redirect(
        url_for("menu")
    )


# ---------------- DECREASE ITEM ----------------

@app.route("/decrease/<item>")
def decrease(item):

    cart = session.get(
        "cart",
        {}
    )

    if item in cart:

        cart[item] -= 1

        if cart[item] <= 0:

            del cart[item]

    session["cart"] = cart

    return redirect(
        url_for("menu")
    )


# ---------------- REMOVE ITEM ----------------

@app.route("/remove/<item>")
def remove(item):

    cart = session.get(
        "cart",
        {}
    )

    if item in cart:

        del cart[item]

    session["cart"] = cart

    return redirect(
        url_for("cart")
    )


# ---------------- CART PAGE ----------------

@app.route("/cart")
def cart():

    cart = session.get(
        "cart",
        {}
    )

    cart_items = []

    total = 0

    for item, quantity in cart.items():

        price = MENU[item]

        item_total = price * quantity

        total += item_total

        cart_items.append({
            "item": item,
            "quantity": quantity,
            "price": price,
            "item_total": item_total
        })

    return render_template(
        "cart.html",
        cart_items=cart_items,
        total=total
    )


# ---------------- CUSTOMER DETAILS / PLACE ORDER ----------------

@app.route(
    "/place-order",
    methods=["GET", "POST"]
)
def place_order():

    cart = session.get(
        "cart",
        {}
    )

    if not cart:

        return redirect(
            url_for("cart")
        )

    if request.method == "POST":

        customer_name = request.form[
            "customer_name"
        ]

        total = 0

        for item, quantity in cart.items():

            total += MENU[item] * quantity

        conn = get_db()

        cursor = conn.execute(
            """
            INSERT INTO orders
            (customer_name, roll_number, consumer_id, status, total_price)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                customer_name,
                "N/A",
                "TEMP",
                "Placed",
                total
            )
        )

        order_id = cursor.lastrowid

        consumer_id = (
            "CF" +
            str(1000 + order_id)
        )

        conn.execute(
            """
            UPDATE orders
            SET consumer_id = ?
            WHERE id = ?
            """,
            (
                consumer_id,
                order_id
            )
        )

        for item, quantity in cart.items():

            conn.execute(
                """
                INSERT INTO order_items
                (order_id, item, quantity, price)
                VALUES (?, ?, ?, ?)
                """,
                (
                    order_id,
                    item,
                    quantity,
                    MENU[item]
                )
            )

        conn.commit()

        conn.close()

        session["cart"] = {}

        return redirect(
            url_for(
                "order_confirmation",
                order_id=order_id
            )
        )

    return render_template(
        "customer_details.html"
    )


# ---------------- ORDER CONFIRMATION ----------------

@app.route("/order/<int:order_id>")
def order_confirmation(order_id):

    conn = get_db()

    order = conn.execute(
        """
        SELECT *
        FROM orders
        WHERE id = ?
        """,
        (order_id,)
    ).fetchone()

    items = conn.execute(
        """
        SELECT *
        FROM order_items
        WHERE order_id = ?
        """,
        (order_id,)
    ).fetchall()

    conn.close()

    if order is None:

        return "Order not found"

    if order["status"] == "Placed":

        wait_time = 15

    elif order["status"] == "Preparing":

        wait_time = 10

    else:

        wait_time = 0

    return render_template(
        "order.html",
        order=order,
        items=items,
        order_id=order["id"],
        customer_name=order["customer_name"],
        consumer_id=order["consumer_id"],
        total_price=order["total_price"],
        wait_time=wait_time
    )


# ---------------- TRACK ORDER ----------------

@app.route("/track/<int:order_id>")
def track(order_id):

    conn = get_db()

    order = conn.execute(
        """
        SELECT *
        FROM orders
        WHERE id = ?
        """,
        (order_id,)
    ).fetchone()

    items = conn.execute(
        """
        SELECT *
        FROM order_items
        WHERE order_id = ?
        """,
        (order_id,)
    ).fetchall()

    conn.close()

    if order is None:

        return "Order not found"

    if order["status"] == "Placed":

        wait_time = 15

    elif order["status"] == "Preparing":

        wait_time = 10

    else:

        wait_time = 0

    return render_template(
        "track.html",
        order=order,
        items=items,
        wait_time=wait_time
    )


# ---------------- SEARCH ORDER ----------------

@app.route(
    "/search-order",
    methods=["GET", "POST"]
)
def search_order():

    if request.method == "POST":

        order_id = request.form[
            "order_id"
        ]

        try:

            order_id = int(order_id)

        except ValueError:

            return render_template(
                "search_order.html",
                error="Please enter a valid Order ID"
            )

        return redirect(
            url_for(
                "track",
                order_id=order_id
            )
        )

    return render_template(
        "search_order.html"
    )


# ---------------- ORDER HISTORY ----------------

@app.route("/order-history")
def order_history():

    conn = get_db()

    orders = conn.execute(
        """
        SELECT *
        FROM orders
        ORDER BY id DESC
        """
    ).fetchall()

    conn.close()

    return render_template(
        "order_history.html",
        orders=orders
    )


# ---------------- STAFF LOGIN ----------------

@app.route(
    "/staff-login",
    methods=["GET", "POST"]
)
def staff_login():

    if request.method == "POST":

        username = request.form[
            "username"
        ]

        password = request.form[
            "password"
        ]

        if (
    username == os.environ.get("STAFF_USERNAME")
    and password == os.environ.get("STAFF_PASSWORD")
):

            session[
                "staff_logged_in"
            ] = True

            return redirect(
                url_for("staff")
            )

        return render_template(
            "staff_login.html",
            error="Invalid username or password"
        )

    return render_template(
        "staff_login.html"
    )


# ---------------- STAFF LOGOUT ----------------

@app.route("/staff-logout")
def staff_logout():

    session.pop(
        "staff_logged_in",
        None
    )

    return redirect(
        url_for("staff_login")
    )


# ---------------- STAFF DASHBOARD ----------------

@app.route("/staff")
def staff():

    if session.get(
        "staff_logged_in"
    ) != True:

        return redirect(
            url_for("staff_login")
        )

    conn = get_db()

    orders = conn.execute(
        """
        SELECT *
        FROM orders
        ORDER BY id DESC
        """
    ).fetchall()

    order_data = []

    for order in orders:

        items = conn.execute(
            """
            SELECT *
            FROM order_items
            WHERE order_id = ?
            """,
            (order["id"],)
        ).fetchall()

        order_data.append({
            "order": order,
            "items": items
        })

    total_orders = conn.execute(
        """
        SELECT COUNT(*)
        FROM orders
        """
    ).fetchone()[0]

    placed_orders = conn.execute(
        """
        SELECT COUNT(*)
        FROM orders
        WHERE status = 'Placed'
        """
    ).fetchone()[0]

    preparing_orders = conn.execute(
        """
        SELECT COUNT(*)
        FROM orders
        WHERE status = 'Preparing'
        """
    ).fetchone()[0]

    ready_orders = conn.execute(
        """
        SELECT COUNT(*)
        FROM orders
        WHERE status = 'Ready'
        """
    ).fetchone()[0]

    collected_orders = conn.execute(
        """
        SELECT COUNT(*)
        FROM orders
        WHERE status = 'Collected'
        """
    ).fetchone()[0]

    conn.close()

    menu_items = get_menu_items()

    return render_template(
        "staff.html",
        orders=order_data,
        menu_items=menu_items,
        total_orders=total_orders,
        placed_orders=placed_orders,
        preparing_orders=preparing_orders,
        ready_orders=ready_orders,
        collected_orders=collected_orders
    )


# ---------------- UPDATE ORDER STATUS ----------------

@app.route(
    "/update/<int:order_id>/<status>"
)
def update_order(order_id, status):

    if session.get(
        "staff_logged_in"
    ) != True:

        return redirect(
            url_for("staff_login")
        )

    allowed_statuses = [
        "Preparing",
        "Ready",
        "Collected"
    ]

    if status not in allowed_statuses:

        return "Invalid status"

    conn = get_db()

    conn.execute(
        """
        UPDATE orders
        SET status = ?
        WHERE id = ?
        """,
        (
            status,
            order_id
        )
    )

    conn.commit()

    conn.close()

    return redirect(
        url_for("staff")
    )


# ---------------- MENU AVAILABILITY ----------------

@app.route(
    "/toggle-availability/<int:item_id>"
)
def toggle_availability(item_id):

    if session.get(
        "staff_logged_in"
    ) != True:

        return redirect(
            url_for("staff_login")
        )

    conn = get_db()

    item = conn.execute(
        """
        SELECT *
        FROM menu_items
        WHERE id = ?
        """,
        (item_id,)
    ).fetchone()

    if item is None:

        conn.close()

        return "Menu item not found"

    new_status = 0 if item["available"] else 1

    conn.execute(
        """
        UPDATE menu_items
        SET available = ?
        WHERE id = ?
        """,
        (
            new_status,
            item_id
        )
    )

    conn.commit()

    conn.close()

    return redirect(
        url_for("staff")
    )


# ---------------- START APPLICATION ----------------

# Initialize database when the application starts
init_db()


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )

