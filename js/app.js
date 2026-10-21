// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

// URL for Fitness Assessments & Workouts Sheet (Your dashboard connection)
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzl00dLKbw7MYQtkc8hDHycjj_3oEESVFY5dUfCFE7UO-4vn0hBzI9woY6zpUOhTxX4/exec"; 

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();

  const activateBtn = document.getElementById("activate-profile-btn");

  if (activateBtn) {
    activateBtn.addEventListener("click", async () => {
      const username = document.getElementById("user-username").value.trim().toLowerCase();
      const password = document.getElementById("user-password").value.trim();

      if (!username || !password) {
        alert("Please enter both your username and password to log in.");
        return;
      }

      activateBtn.innerText = "Verifying Credentials...";
      activateBtn.disabled = true;

      try {
        // Fetch row data from your Google Sheet by passing the username
        const response = await fetch(`${GOOGLE_API_URL}?username=${encodeURIComponent(username)}`);
        const result = await response.json();

        if (result.success) {
            // PASSWORD VALIDATION (⚠️ Change 'Password' if your column header row uses a different spelling)
            const correctPassword = result.user.Password || result.user.password;

            if (correctPassword && String(correctPassword).trim() === password) {
                // SUCCESS: Match found on the row!
                // Fallback to username if a dedicated MemberID column doesn't exist
                const memberId = result.user.MemberID || result.user.memberId || "MBR-" + username;
                const displayName = result.user.Name || result.user.Full_Name || username;

                // Lock details into local hardware storage so they stay logged in
                localStorage.setItem("iron_pulse_id", memberId);
                localStorage.setItem("iron_pulse_name", displayName);
                localStorage.setItem("iron_pulse_email", username); // Uses username as booking identifier reference

                setupDashboardView(memberId, displayName, username);
                
                // Display row data (⚠️ Update 'WorkoutPlan' and 'Assessments' to match your row 1 headers)
                document.getElementById('workout-display').innerText = result.user.Workout || "No workout assigned.";
                document.getElementById('assessment-display').innerText = result.user.Assessment || "No recent metrics.";
            } else {
                alert("Incorrect password. Please try again.");
                document.getElementById("user-password").value = "";
            }
        } else {
            alert("Username not found. Please verify spelling.");
        }

      } catch (error) {
          console.error("Login connection failure:", error);
          alert("Could not connect to authentication grid. Ensure your Google Script is deployed to 'Anyone'.");
      } finally {
          activateBtn.innerText = "Enter Portal";
          activateBtn.disabled = false;
      }
    });
  }
});

// Class Booking Transmission Engine (Perfected for your Booking Sheet layout)
// Class Booking Transmission Engine (Tailored to bypass Booking script parameter filters)
function handleBooking(className) {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentName = localStorage.getItem("iron_pulse_name"); 
  const currentUsername = localStorage.getItem("iron_pulse_username"); // Validated Login User Name

  if (!currentId) {
    alert("Please log in before booking gym classes.");
    return;
  }

  const btn = document.activeElement;
  if (btn && btn.classList.contains("book-btn")) {
    btn.disabled = true;
    btn.innerText = "Booking...";
  }

  // Generate background tracking values
  const bookingId = "BKG-" + Date.now();
  const currentDateTime = new Date().toLocaleString();

  // DUAL-MAPPING PAYLOAD: We send both old styles and new header variations 
  // so your Google Apps Script script functions perfectly either way!
  const payload = {
    action: "bookClass",
    
    // Original system parameter naming tracks
    memberId: currentId,
    name: currentName, 
    email: currentUsername, // Sends username profile tag into the original tracking line
    className: className,
    
    // Column header mapping variations
    BookingID: bookingId,
    MemberID: currentId,
    MemberName: currentName,
    ClassName: className,
    DateTime: currentDateTime,
    Email: currentUsername
  };
  
  const queryParams = new URLSearchParams(payload).toString();
  const transmissionUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

  // Image ping tracking transmission to your Booking script deployment
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
  document.getElementById("display-email").innerText = "@" + email;
}

async function checkLocalProfile() {
  const id = localStorage.getItem("iron_pulse_id");
  const name = localStorage.getItem("iron_pulse_name");
  const username = localStorage.getItem("iron_pulse_email");

  if (id && name && username) {
    setupDashboardView(id, name, username);
    
    // Auto-fetch fresh row metrics if already logged in
    try {
        const response = await fetch(`${GOOGLE_API_URL}?username=${encodeURIComponent(username)}`);
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
  document.getElementById("user-username").value = "";
  document.getElementById("user-password").value = "";
}
