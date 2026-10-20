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
            if (workoutDisplay) workoutDisplay.innerText = result.user.Workout || "No workout assigned.";
            if (assessmentDisplay) assessmentDisplay.innerText = result.user.Assessment || "No recent metrics.";
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
  
 // URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

// URL for Fitness Assessments & Workouts Sheet (Your new dashboard connection)
const GOOGLE_API_URL = "https://google.com"; 

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in locally on this device
  checkLocalProfile();

  const activateBtn = document.getElementById("activate-profile-btn");

  if (activateBtn) {
    activateBtn.addEventListener("click", async () => {
      const name = document.getElementById("user-name").value.trim();
      const email = document.getElementById("user-email").value.trim();

      if (!email) {
        alert("Please enter your email address to access your portal.");
        return;
      }

      // Visual feedback so the user knows the app is searching the database
      activateBtn.innerText = "Verifying Account...";
      activateBtn.disabled = true;

      try {
        // 1. Check your Google Sheet backend first to see if this profile exists
        const response = await fetch(`${GOOGLE_API_URL}?email=${encodeURIComponent(email)}`);
        const result = await response.json();

        let memberId;
        let displayName = name || "Guest Member";

        if (result.success) {
            // A. EXISTING PROFILE FOUND: Pull their saved data from Google Sheets!
            // Look for a Member ID column in your sheet, fallback to email if missing
            memberId = result.user.MemberID || result.user.memberId || "MBR-" + Date.now();
            if (result.user.Name || result.user.Full_Name) {
                displayName = result.user.Name || result.user.Full_Name;
            }
            
            // Save their true sheet details locally to device hardware storage
            localStorage.setItem("iron_pulse_id", memberId);
            localStorage.setItem("iron_pulse_name", displayName);
            localStorage.setItem("iron_pulse_email", email);

            // Open dashboard view with their database records
            setupDashboardView(memberId, displayName, email);
            
            // Populate the workout and assessment sections with their sheet data
            // NOTE: Replace 'WorkoutColumn' and 'AssessmentColumn' with your exact column header names!
            document.getElementById('workout-display').innerText = result.user.WorkoutColumn || "No workout assigned.";
            document.getElementById('assessment-display').innerText = result.user.AssessmentColumn || "No recent metrics.";

        } else {
            // B. NEW CLIENT REGISTERING: Create a brand new profile
            if (!name) {
                alert("We couldn't find an existing account with that email. If you are new, please fill in your Full Name to register!");
                activateBtn.innerText = "Activate Account";
                activateBtn.disabled = false;
                return;
            }

            memberId = "MBR-" + Date.now();
            localStorage.setItem("iron_pulse_id", memberId);
            localStorage.setItem("iron_pulse_name", displayName);
            localStorage.setItem("iron_pulse_email", email);

            setupDashboardView(memberId, displayName, email);
            document.getElementById('workout-display').innerText = "Welcome! Your customized workout plan will appear here soon.";
            document.getElementById('assessment-display').innerText = "No recent fitness assessments found.";
        }

      } catch (error) {
          console.error("Database connection error during login:", error);
          alert("Could not connect to the Soungui Fitness servers. Please check your internet connection.");
          
          // Fallback basic registration mode if your sheet server goes down entirely
          if (name) {
              memberId = "MBR-" + Date.now();
              localStorage.setItem("iron_pulse_id", memberId);
              localStorage.setItem("iron_pulse_name", name);
              localStorage.setItem("iron_pulse_email", email);
              setupDashboardView(memberId, name, email);
          }
      } finally {
          // Reset button text
          activateBtn.innerText = "Activate Account";
          activateBtn.disabled = false;
      }
    });
  }
});

// =========================================================================
// REMAINING BOOKING AND VIEW FUNCTIONS STAY EXACTLY THE SAME BELOW THIS LINE
// =========================================================================


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
