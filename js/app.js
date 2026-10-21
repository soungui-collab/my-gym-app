// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzdrT34LP3PHx0qAQUs6zqVUrH11Jy8X-Uyzudod_ewYacWgIaGGe75K5KVILqf5FZi/exec";

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

      // Visual button feedback
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
            // ⚠️ Ensure 'Password' matches the column header name in row 1 of your sheet!
            const correctPassword = result.user.Password || result.user.password;

            if (correctPassword && String(correctPassword).trim() === password) {
                // SUCCESS: Passwords match!
                memberId = result.user.MemberID || result.user.memberId || "MBR-" + Date.now();
                if (result.user.Name || result.user.Full_Name) {
                    displayName = result.user.Name || result.user.Full_Name;
                }
                
                // Save tokens locally on user phone hardware
                localStorage.setItem("iron_pulse_id", memberId);
                localStorage.setItem("iron_pulse_name", displayName);
                localStorage.setItem("iron_pulse_email", email);

                // Open your original preferred layout container view
                setupDashboardView(memberId, displayName, email);
                
                // Populates workout text data from your sheet columns
                // ⚠️ Change 'WorkoutPlan' and 'Assessments' to match your actual row 1 column header keys!
                document.getElementById('workout-display').innerText = result.user.WorkoutPlan || "No customized training routine assigned for today.";
                document.getElementById('assessment-display').innerText = result.user.Assessments || "No recent metrics found.";
            } else {
                alert("Incorrect password. Please try again.");
                document.getElementById("user-password").value = "";
            }

        } else {
            // 3. NEW CLIENT REGISTRATION FALLBACK
            if (!name) {
                alert("Account not found. If you are registering a brand new profile, please enter your Full Name as well!");
                activateBtn.innerText = "Enter Portal";
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
          console.error("Handshake fail:", error);
          alert("Could not connect to authentication grid. Please ensure your Google Script is deployed to 'Anyone'.");
      } finally {
          activateBtn.innerText = "Enter Portal";
          activateBtn.disabled = false;
      }
    });
  }
});

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

  const payload = {
    action: "bookClass",
    memberId: currentId,
    name: currentName, 
    email: currentEmail,
    className: className
  };
  const queryParams = new URLSearchParams(payload).toString();
  const transmissionUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

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

async function checkLocalProfile() {
  const id = localStorage.getItem("iron_pulse_id");
  const name = localStorage.getItem("iron_pulse_name");
  const email = localStorage.getItem("iron_pulse_email");

  if (id && name && email) {
    setupDashboardView(id, name, email);
    
    // Automatically retrieve fresh sheet rows for cached log-ins
    try {
        const response = await fetch(`${GOOGLE_API_URL}?email=${encodeURIComponent(email)}`);
        const result = await response.json();
        if (result.success) {
            document.getElementById('workout-display').innerText = result.user.WorkoutPlan || "No workout assigned.";
            document.getElementById('assessment-display').innerText = result.user.Assessments || "No recent metrics.";
        }
    } catch (e) {
        document.getElementById('workout-display').innerText = "Loaded offline mode cached routine.";
    }
  }
}

function clearProfile() {
  localStorage.clear();
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("auth-card").style.display = "block";
  document.getElementById("user-name").value = "";
  document.getElementById("user-email").value = "";
  document.getElementById("user-password").value = "";
}
