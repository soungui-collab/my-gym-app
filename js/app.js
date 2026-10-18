// Function to send a new member registration to your Google Sheet
function registerMember(id, name, email) {
  const url = "https://script.google.com/macros/s/AKfycbz8pKhE5iHG2lglKOpJOCTBCY2xpRW0TaICPpVcD8Gy1xLgrSh92bN_mR5-8877qZJI/exec";

  const payload = {
    memberId: id,
    name: name,
    email: email
  };

  fetch(url, {
    method: "POST",
    mode: "cors", // Crucial for cross-domain requests
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    if(data.status === "success") {
      alert("Welcome to the gym! Account created.");
      // Code to display their check-in barcode goes here
    }
  })
  .catch(error => console.error("Error connecting to database:", error));
}

// Check if the user's browser supports Progressive Web Apps
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA Service Worker registered successfully!', registration.scope);
      })
      .catch((error) => {
        console.log('PWA Service Worker registration failed:', error);
      });
  });
}

// 1. Paste your exact Google Apps Script URL here between the quotes
const GOOGLE_APPS_SCRIPT_URL = "YOUR_DEPLOYED_WEB_APP_URL_HERE";

document.addEventListener("DOMContentLoaded", () => {
  const regForm = document.getElementById("reg-form");
  
  if (regForm) {
    regForm.addEventListener("submit", (event) => {
      // Prevent the web page from reloading automatically
      event.preventDefault();

      // Collect values from the HTML inputs
      const name = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
      
      // Create a unique Member ID using the current timestamp
      const memberId = "MBR-" + Date.now();

      // Disable the submit button to prevent double-clicking
      const submitBtn = regForm.querySelector(".submit-btn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Generating Pass...";

      // Package data nicely into a JSON object
      const payload = {
        memberId: memberId,
        name: name,
        email: email
      };

       // Send the payload to your Google Sheet database via Apps Script
      fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors", 
        headers: {
          // Changing this to text/plain bypasses complex browser pre-flight checks
          "Content-Type": "text/plain;charset=utf-8" 
        },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success") {
          // Success! Hide the registration form and show the digital barcode pass
          document.getElementById("registration-card").style.display = "none";
          document.getElementById("checkin-card").style.display = "block";
          
          // Call the function to draw the high-contrast barcode on screen
          generateBarcode(memberId);
        } else {
          alert("Error: " + data.message);
          submitBtn.disabled = false;
          submitBtn.innerText = "Register & Get Digital Pass";
        }
      })
      .catch(error => {
        console.error("Connection Error:", error);
        alert("Could not connect to the database. Check your network or Apps Script URL.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Register & Get Digital Pass";
      });
    });
  }
});

// 2. Function to turn Member ID into a scannable graphic using JsBarcode
function generateBarcode(id) {
  document.getElementById("member-id-display").innerText = "ID: " + id;
  
  // Call the imported CDN library to draw the graphic into our HTML SVG element
  JsBarcode("#barcode", id, {
    format: "CODE128", // Standard format compatible with 99% of laser desk scanners
    lineColor: "#121212",
    width: 2,
    height: 70,
    displayValue: false // Hides the tiny text below the barcode lines for cleaner design
  });
}

// 3. Function to handle class booking button clicks
function handleBooking(className) {
  // Pull the current member ID from the UI display text
  const memberIdText = document.getElementById("member-id-display").innerText;
  
  if (memberIdText.includes("MBR-XXXXX")) {
    alert("Please register a member profile before booking classes.");
    return;
  }
  
  const memberId = memberIdText.replace("ID: ", "");
  alert(`Booking request sent for "${className}" using Member ID: ${memberId}`);
  
  // Tip: You can expand this block later to issue another fetch() request 
  // to your Apps Script to log this booking in your "Bookings" sheet tab!
}
