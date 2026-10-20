// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzV1FQZ2zWcLBTquasr4rX8S4JtEbzIO0RbO3bKiJngpuskD431bMdNTBAnkicQRAx4/exec";

// URL for Fitness Assessments & Workouts Sheet (Your new dashboard connection)
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbwbrNybFqkzn2pataodVL7dHUjS4FH6OGusx1ciHm_Zl6y0OT5bmUv2JGoHRJq1tP4H/exec"; 

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in locally on this device
  checkLocalProfile();

  const activateBtn = document.getElementById("activate-profile-btn");

  if (activateBtn) {
    activateBtn.addEventListener("click", async () => {
      const name = document.getElementById("user-name").value.trim();
      const email = document.getElementById("user-email").value.trim();

      if (!name || !email) {
        alert("Please fill in both fields to activate your profile.");
        return;
      }

      // Generate or retrieve booking ID
      let memberId = localStorage.getItem("iron_pulse_id");
      if (!memberId) {
        memberId = "MBR-" + Date.now();
      }

      // 1. Core Profile Local Storage Sync (Maintains Booking Engines)
      localStorage.setItem("iron_pulse_id", memberId);
      localStorage.setItem("iron_pulse_name", name);
      localStorage.setItem("iron_pulse_email", email);

      // 2. Instantly launch user interface layout view
      setupDashboardView(memberId, name, email);

      // 3. Fetch Workout & Assessment sheets updates in the background
      await fetchFitnessData(email);
    });
  }
});

// Asynchronous background engine to fetch workout and assessment sheets data
async function fetchFitnessData(email) {
    const workoutDisplay = document.getElementById('workout-display');
    const assessmentDisplay = document.getElementById('assessment-display');

    if (workoutDisplay) workoutDisplay.innerText = "Loading your customized routine...";
    if (assessmentDisplay) assessmentDisplay.innerText = "Loading your metrics...";

    try {
        const response = await fetch(`${GOOGLE_API_URL}?email=${encodeURIComponent(email)}`);
        const result = await response.json();
        
        if (result.success) {
            // NOTE: Replace 'WorkoutColumn' and 'AssessmentColumn' with your exact column header titles from row 1 of your sheet
            if (workoutDisplay) workoutDisplay.innerText = result.user.WorkoutColumn || "No workout assigned.";
            if (assessmentDisplay) assessmentDisplay.innerText = result.user.AssessmentColumn || "No recent metrics.";
        } else {
            if (workoutDisplay) workoutDisplay.innerText = "Account activated! Contact coach to assign custom workouts.";
            if (assessmentDisplay) assessmentDisplay.innerText = "No recent fitness assessments found.";
        }
    } catch (error) {
        console.error("Dashboard Sheet Data Sync failed:", error);
        if (workoutDisplay) workoutDisplay.innerText = "Offline mode: Could not fetch daily workout rules right now.";
        if (assessmentDisplay) assessmentDisplay.innerText = "Offline mode: Could not verify body composition metrics.";
    }
}

// Class Booking Transmission using a highly stable Image ping script structure
function handleBooking(className) {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentName = localStorage.getItem("iron_pulse_name"); 
  const currentEmail = localStorage.getItem("iron_pulse_email");

  if (!currentId) {
    alert("Please set up a profile before booking gym classes.");
    return;
  }

  const btn = document.activeElement;
  
  if (btn && btn.classList.contains("book-btn")) {
    btn.disabled = true;
    btn.innerText = "Booking...";
  }

  // Construct parameter query string (Adding name data packet)
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
    // Automatically retrieve sheet items if profile is cached
    fetchFitnessData(email);
  }
}

function clearProfile() {
  localStorage.clear();
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("auth-card").style.display = "block";
  document.getElementById("user-name").value = "";
  document.getElementById("user-email").value = "";
}
