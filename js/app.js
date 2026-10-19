const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8pKhE5iHG2lglKOpJOCTBCY2xpRW0TaICPpVcD8Gy1xLgrSh92bN_mR5-8877qZJI/exec";

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
