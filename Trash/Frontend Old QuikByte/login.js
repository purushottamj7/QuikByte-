

const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");
const forgotPassword = document.getElementById("forgotPassword");



togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";
    }

});


loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value.trim();


    if (email === "" || password === "") {

        message.textContent = "Please fill in all fields.";
        message.style.color = "red";

        return;
    }



    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        message.textContent = "Please enter a valid email address.";
        message.style.color = "red";

        return;
    }



    message.textContent = "Login successful!";
    message.style.color = "green";



    setTimeout(function () {

        window.location.href = "index.html";

    }, 1000);

});



forgotPassword.addEventListener("click", function (event) {

    event.preventDefault();

    alert(
        "Password reset functionality will be connected to the backend."
    );

});
