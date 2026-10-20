// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwbrNybFqkzn2pataodVL7dHUjS4FH6OGusx1ciHm_Zl6y0OT5bmUv2JGoHRJq1tP4H/exec";

// URL for Fitness Assessments & Workouts Sheet (Your new dashboard connection)
const GOOGLE_API_URL = "https://google.com"; 

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in locally on this device
  checkLocalProfile();

  const activateBtn = document.getElementById("activate-profile-btn");

  if (activateBtn) {
    activateBtn.addEventListener("click", async () => {
      const name = document.getElementById("user-name").value.trim();
      const email = document.getElementById("user-email").value.trim().toLowerCase();
      const password = document.getElementById("user-password").value.trim();

      if (!email || !password) {
        alert("Please enter both your email and password to log in.");
        return;
      }

      // Visual feedback so the user knows the app is reading the spreadsheet
      activateBtn.innerText = "Verifying Credentials...";
      activateBtn.disabled = true;

      try {
        // 1. Fetch your Google Sheet user entry matching this email
        const response = await fetch(`${GOOGLE_API_URL}?email=${encodeURIComponent(email)}`);
        const result = await response.json();

        let memberId;
        let displayName = name || "Guest Member";

        if (result.success) {
            // 2. PASSWORD VERIFICATION LAYER
            // NOTE: Replace 'Password' with the EXACT header name of your password column in row 1 of your sheet
            const correctPassword = result.user.Password || result.user.password;

            if (correctPassword && String(correctPassword).trim() === password) {
                // SUCCESS: Passwords match perfectly!
                memberId = result.user.MemberID || result.user.memberId || "MBR-" + Date.now();
                if (result.user.Name || result.user.Full_Name) {
                    displayName = result.user.Name || result.user.Full_Name;
                }
                
                // Save profile tokens securely onto the physical device
                localStorage.setItem("iron_pulse_id", memberId);
                localStorage.setItem("iron_pulse_name", displayName);
                localStorage.setItem("iron_pulse_email", email);

                // Initialize layout views
                setupDashboardView(memberId, displayName, email);
                
                // Populate metrics and training rows 
                // NOTE: Change 'WorkoutColumn' and 'AssessmentColumn' to your exact column header labels
                document.getElementById('workout-display').innerText = result.user.WorkoutColumn || "No workout assigned.";
                document.getElementById('assessment-display').innerText = result.user.AssessmentColumn || "No recent metrics.";
            } else {
                // FAILURE: Password didn't match the row value
                alert("Incorrect password. Please try again.");
                document.getElementById("user-password").value = "";
            }

        } else {
            // 3. REGISTRATION FALLBACK (If account doesn't exist yet)
            if (!name) {
                alert("Account not found. If you are registering a brand new profile, please type your Full Name as well!");
                activateBtn.innerText = "Enter Portal";
                activateBtn.disabled = false;
                return;
            }

            // Create a brand new local deployment ID
            memberId = "MBR-" + Date.now();
            localStorage.setItem("iron_pulse_id", memberId);
            localStorage.setItem("iron_pulse_name", displayName);
            localStorage.setItem("iron_pulse_email", email);

            setupDashboardView(memberId, displayName, email);
            document.getElementById('workout-display').innerText = "Profile activated! Your custom workout schedules will load here shortly.";
            document.getElementById('assessment-display').innerText = "No assessment metrics loaded for this profile yet.";
        }

      } catch (error) {
          console.error("Authentication handshake failed:", error);
          alert("Could not connect to authentication grid. Please check your network.");
      } finally {
          // Restore button parameters
          activateBtn.innerText = "Enter Portal";
          activateBtn.disabled = false;
      }
    });
  }
});

// =========================================================================
// LEAVE ALL REMAINING BOOKING AND VIEW LOGIC UNTOUCHED BELOW THIS LINE
// =========================================================================


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
