// 1. Your Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8pKhE5iHG2lglKOpJOCTBCY2xpRW0TaICPpVcD8Gy1xLgrSh92bN_mR5-8877qZJI/exec";

// 2. Fixed Service Worker Registration (Fixed path for GitHub Pages)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using a relative path 'sw.js' allows it to load correctly inside your GitHub subfolder
    navigator.serviceWorker.register('sw.js')
      .then((registration) => {
        console.log('PWA Service Worker registered successfully!', registration.scope);
      })
      .catch((error) => {
        console.error('PWA Service Worker registration failed:', error);
      });
  });
}

// 3. Form Submission Handling
document.addEventListener("DOMContentLoaded", () => {
  const regForm = document.getElementById("reg-form");
  
  if (regForm) {
    regForm.addEventListener("submit", (event) => {
      event.preventDefault(); // Stop page from reloading

      const name = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
      const memberId = "MBR-" + Date.now(); // Unique ID

      const submitBtn = regForm.querySelector(".submit-btn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Generating Pass...";

      const payload = {
        memberId: memberId,
        name: name,
        email: email
      };

      // Send data to Google Sheets
      fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors", 
        headers: {
          "Content-Type": "text/plain;charset=utf-8" 
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Google server responded with status: " + response.status);
        }
        return response.json();
      })
      .then(data => {
        if (data.status === "success") {
          // Success! Show keytag
          document.getElementById("registration-card").style.display = "none";
          document.getElementById("checkin-card").style.display = "block";
          generateBarcode(memberId);
        } else {
          alert("Google Database Error: " + data.message);
          submitBtn.disabled = false;
          submitBtn.innerText = "Register & Get Digital Pass";
        }
      })
      .catch(error => {
        console.error("Connection Error:", error);
        // This will pop up the EXACT internal reason your phone browser is failing
        alert("Connection Failed.\n\nReason: " + error.toString() + "\n\nPlease verify that your Google Web App configuration is deployed as a New Version accessible to 'Anyone'.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Register & Get Digital Pass";
      });
    });
  }
});

// 4. Function to generate Barcode via JsBarcode library
function generateBarcode(id) {
  document.getElementById("member-id-display").innerText = "ID: " + id;
  
  JsBarcode("#barcode", id, {
    format: "CODE128", 
    lineColor: "#121212",
    width: 2,
    height: 70,
    displayValue: false 
  });
}

// 5. Class Booking Logic
function handleBooking(className) {
  const memberIdText = document.getElementById("member-id-display").innerText;
  
  if (memberIdText.includes("MBR-XXXXX")) {
    alert("Please register a member profile before booking classes.");
    return;
  }
  
  const memberId = memberIdText.replace("ID: ", "");
  alert(`Booking request sent for "${className}" using Member ID: ${memberId}`);
}
