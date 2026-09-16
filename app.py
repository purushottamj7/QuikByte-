from flask import Flask 
import sqlite3
app = Flask(__name__)

@app.route("/")
def home():
    return ("Welcome to QuikByte")

@app.route("/menu")
def menu():
    connection = sqlite3.connect("quikbyte.db")
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM menu")
    items = cursor.fetchall()

    menu_items = []

    for item in items:
        menu_items.append({
            "id": item[0],
            "name": item[1],
            "price": item[2]
        })

    connection.close()

    return {"items": menu_items}
    

app.run(debug=True)