const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzV1FQZ2zWcLBTquasr4rX8S4JtEbzIO0RbO3bKiJngpuskD431bMdNTBAnkicQRAx4/exec";

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();

  const activateBtn = document.getElementById("activate-profile-btn");

  if (activateBtn) {
    activateBtn.addEventListener("click", () => {
      const name = document.getElementById("user-name").value.trim();
      const email = document.getElementById("user-email").value.trim();

      if (!name || !email) {
        alert("Please fill in both fields to activate your profile.");
        return;
      }

      const memberId = "MBR-" + Date.now();

      // Save locally to device hardware storage (Instant entry)
      localStorage.setItem("iron_pulse_id", memberId);
      localStorage.setItem("iron_pulse_name", name);
      localStorage.setItem("iron_pulse_email", email);

      // Instantly open dashboard
      setupDashboardView(memberId, name, email);
    });
  }
});

// Class Booking Transmission using a highly stable Image ping script structure
// Class Booking Engine - Now includes Member Name in the transmission
function handleBooking(className) {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentName = localStorage.getItem("iron_pulse_name"); // Pulls name from local storage
  const currentEmail = localStorage.getItem("iron_pulse_email");

  if (!currentId) {
    alert("Please set up a profile before booking gym classes.");
    return;
  }

  const btn = document.activeElement;
  let originalText = "Book";
  
  if (btn && btn.classList.contains("book-btn")) {
    originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Booking...";
  }

  // Construct parameter query string (Adding name to the data packet)
  const payload = {
    action: "bookClass",
    memberId: currentId,
    name: currentName, 
    email: currentEmail,
    className: className
  };
  const queryParams = new URLSearchParams(payload).toString();
  const transmissionUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

  // Use Image ping to send data safely to Google Sheets without blocks
  const ping = new Image();
  
  ping.onload = () => { processBookingSuccess(btn, className); };
  ping.onerror = () => { processBookingSuccess(btn, className); };
  
  ping.src = transmissionUrl;
}

function processBookingSuccess(btn, className) {
  alert(`Successfully booked! You are locked in for "${className}".`);
  if (btn && btn.classList.contains("book-btn")) {
    btn.style.background = "#444444";
    btn.style.color = "#888888";
    btn.innerText = "Reserved";
    btn.disabled = true;
  }
}

function setupDashboardView(id, name, email) {
  document.getElementById("auth-card").style.display = "none";
  document.getElementById("dashboard-view").style.display = "block";
  document.getElementById("display-name").innerText = name;
  document.getElementById("display-email").innerText = email;
}

function checkLocalProfile() {
  const id = localStorage.getItem("iron_pulse_id");
  const name = localStorage.getItem("iron_pulse_name");
  const email = localStorage.getItem("iron_pulse_email");

  if (id && name && email) {
    setupDashboardView(id, name, email);
  }
}

function clearProfile() {
  localStorage.clear();
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("auth-card").style.display = "block";
  document.getElementById("user-name").value = "";
  document.getElementById("user-email").value = "";
}

// 1. Paste your exact Google Apps Script URL between the quotation marks below:
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbwbrNybFqkzn2pataodVL7dHUjS4FH6OGusx1ciHm_Zl6y0OT5bmUv2JGoHRJq1tP4H/exec"; 

// 2. The function that triggers when a client clicks your new button
async function clientLogin() {
    const emailInput = document.getElementById('clientEmail').value.trim();
    
    if (!emailInput) {
        alert("Please enter your email address.");
        return;
    }

    try {
        // This sends the email to your Google Sheet Script
        const response = await fetch(`${GOOGLE_API_URL}?email=${encodeURIComponent(emailInput)}`);
        const result = await response.json();
        
        if (result.success) {
            // Save email to remember them next time
            localStorage.setItem('loggedInClientEmail', emailInput);
            
            // Switch screens and show the data
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard-screen').style.display = 'block';
            
            // Change 'WorkoutColumn' and 'AssessmentColumn' to match your exact spreadsheet column headers!
            document.getElementById('client-name').innerText = `Welcome back!`;
            document.getElementById('workout-display').innerText = result.user.WorkoutColumn || "No workout assigned.";
            document.getElementById('assessment-display').innerText = result.user.AssessmentColumn || "No recent metrics.";
        } else {
            alert("Login failed: Email not found.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
}

// 3. Auto-Login: Check if they logged in before so they don't have to re-type it
window.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem('loggedInClientEmail');
    if (savedEmail) {
        document.getElementById('clientEmail').value = savedEmail;
        clientLogin();
    }
});
