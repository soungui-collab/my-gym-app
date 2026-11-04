// This runs cleanly on page load alongside whatever is in app.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("New code initiated safely without changing app.js!");
    // Call any new functions here
});

// Attach a new feature to an existing button without breaking its current behavior
const bookingButton = document.getElementById("activate-profile-btn");
if (bookingButton) {
    bookingButton.addEventListener("click", () => {
        // Your brand new extra functionality goes here
        console.log("This executes smoothly alongside the old booking code!");
    });
}

