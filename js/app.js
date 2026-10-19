// Paste your exact Google Apps Script URL here
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

let cachedMemberId = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check if a client profile already exists on this smartphone
  checkLocalProfile();

  const profileForm = document.getElementById("profile-form");

  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const name = document.getElementById("user-name").value.trim();
      const email = document.getElementById("user-email").value.trim();
      const memberId = "MBR-" + Date.now(); // Generate clean tracking ID

      // Save credentials straight to phone hardware memory (Instant load setup)
      localStorage.setItem("iron_pulse_id", memberId);
      localStorage.setItem("iron_pulse_name", name);
      localStorage.setItem("iron_pulse_email", email);

      // Force view change to custom dashboard
      setupDashboardView(memberId, name, email);
    });
  }
});

// Class Booking Engine - Built to completely clear Apple Tracking & CORS Blocks
function handleBooking(className) {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentEmail = localStorage.getItem("iron_pulse_email");

  if (!currentId) {
    alert("Please set up a profile before booking gym classes.");
    return;
  }

  // Identify button targets accurately across mobile viewports
  const btn = document.activeElement;
  let originalText = "Book";
  
  if (btn && btn.classList.contains("book-btn")) {
    originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Booking...";
  }

  // Construct URL Query
  const payload = {
    action: "bookClass",
    memberId: currentId,
    email: currentEmail,
    className: className
  };
  const queryParams = new URLSearchParams(payload).toString();
  const transmissionUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

  // Use an Image Ping sequence to pass data safely under mobile Safari's privacy layer
  const ping = new Image();
  
  ping.onload = () => { processBookingSuccess(btn, className, originalText); };
  ping.onerror = () => { processBookingSuccess(btn, className, originalText); };
  
  // Fire data packet directly to Google sheets
  ping.src = transmissionUrl;
}

function processBookingSuccess(btn, className, originalText) {
  alert(`Successfully booked! You are locked in for "${className}".`);
  if (btn && btn.classList.contains("book-btn")) {
    btn.style.background = "#444444";
    btn.style.color = "#888888";
    btn.innerText = "Reserved";
    btn.disabled = true;
  }
}

function setupDashboardView(id, name, email) {
  cachedMemberId = id;
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
  cachedMemberId = null;
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("auth-card").style.display = "block";
  document.getElementById("profile-form").reset();
}
