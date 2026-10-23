console.log("QuikByte website loaded!");


let cart = JSON.parse(localStorage.getItem("cart")) || [];



function addToCart(name, price) {

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({

            name: name,
            price: price,
            quantity: 1

        });

    }

    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartCount();

    alert(name + " added to cart!");

}



function updateCartCount() {

    const cartCount = document.getElementById("cart-count");

    if (!cartCount) {
        return;
    }

    let totalItems = 0;

    cart.forEach(item => {

        totalItems += item.quantity;

    });

    cartCount.textContent = totalItems;

}



const searchInput = document.getElementById("search-input");

if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchValue =
            searchInput.value.toLowerCase();

        const foodCards =
            document.querySelectorAll(".food-card");

        let visibleCards = 0;

        foodCards.forEach(card => {

            const foodName =
                card.dataset.name.toLowerCase();

            if (foodName.includes(searchValue)) {

                card.style.display = "block";

                visibleCards++;

            } else {

                card.style.display = "none";

            }

        });

        showNoResults(visibleCards);

    });

}



const categoryButtons =
    document.querySelectorAll(".category-btn");

categoryButtons.forEach(button => {

    button.addEventListener("click", function () {

        categoryButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        this.classList.add("active");

        const selectedCategory =
            this.dataset.category;

        const foodCards =
            document.querySelectorAll(".food-card");

        let visibleCards = 0;

        foodCards.forEach(card => {

            const cardCategory =
                card.dataset.category;

            if (
                selectedCategory === "all" ||
                cardCategory === selectedCategory
            ) {

                card.style.display = "block";

                visibleCards++;

            } else {

                card.style.display = "none";

            }

        });

        showNoResults(visibleCards);

    });

});



function showNoResults(numberOfCards) {

    const noResults =
        document.getElementById("no-results");

    if (!noResults) {
        return;
    }

    if (numberOfCards === 0) {

        noResults.style.display = "block";

    } else {

        noResults.style.display = "none";

    }

}


updateCartCount();


function displayCart() {

    const cartItemsContainer =
        document.getElementById("cart-items");

    const emptyCart =
        document.getElementById("empty-cart");

    const subtotalElement =
        document.getElementById("subtotal");

    const gstElement =
        document.getElementById("gst");

    const totalElement =
        document.getElementById("total");

    const placeOrderButton =
        document.getElementById("place-order-btn");


    if (!cartItemsContainer) {
        return;
    }


    if (cart.length === 0) {

        cartItemsContainer.innerHTML = "";

        emptyCart.style.display = "block";

        subtotalElement.textContent = "₹0";
        gstElement.textContent = "₹0";
        totalElement.textContent = "₹0";

        placeOrderButton.disabled = true;

        return;
    }



    emptyCart.style.display = "none";

    placeOrderButton.disabled = false;


    let subtotal = 0;


    cartItemsContainer.innerHTML = "";


    cart.forEach((item, index) => {

        const itemTotal =
            item.price * item.quantity;

        subtotal += itemTotal;


        const cartItem =
            document.createElement("div");

        cartItem.classList.add("cart-item");


        cartItem.innerHTML = `

            <div class="cart-item-image">
                🍔
            </div>


            <div class="cart-item-info">

                <h3>
                    ${item.name}
                </h3>

                <p>
                    ₹${item.price} per item
                </p>

            </div>


            <div class="quantity-controls">

                <button
                    class="quantity-btn"
                    onclick="decreaseQuantity(${index})"
                >
                    −
                </button>


                <span class="quantity">
                    ${item.quantity}
                </span>


                <button
                    class="quantity-btn"
                    onclick="increaseQuantity(${index})"
                >
                    +
                </button>

            </div>


            <div class="cart-item-price">

                ₹${itemTotal}

            </div>


            <button
                class="remove-btn"
                onclick="removeItem(${index})"
                title="Remove item"
            >
                ✕
            </button>

        `;


        cartItemsContainer.appendChild(cartItem);

    });


    // GST

    const gst = subtotal * 0.05;

    const total = subtotal + gst;


    subtotalElement.textContent =
        "₹" + subtotal.toFixed(2);

    gstElement.textContent =
        "₹" + gst.toFixed(2);

    totalElement.textContent =
        "₹" + total.toFixed(2);

}



function increaseQuantity(index) {

    cart[index].quantity += 1;

    saveCart();

}


function decreaseQuantity(index) {

    if (cart[index].quantity > 1) {

        cart[index].quantity -= 1;

    } else {

        cart.splice(index, 1);

    }

    saveCart();

}



function removeItem(index) {

    cart.splice(index, 1);

    saveCart();

}



function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCartCount();

    displayCart();

}



function placeOrder() {

    if (cart.length === 0) {

        alert("Your cart is empty!");

        return;

    }


    alert(
        "Order placed successfully! 🎉"
    );



    cart = [];

    localStorage.removeItem("cart");

    updateCartCount();

    displayCart();

}



displayCart();
