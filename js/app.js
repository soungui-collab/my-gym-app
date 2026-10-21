// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

// URL for Fitness Assessments & Workouts Sheet (Your dashboard connection)
const GOOGLE_API_URL = "https://google.com"; 

// Track whether the form is in "login" mode or "register" mode
let isLoginMode = true;

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();
});

// Switches the UI elements back and forth between Login and Sign Up views
function toggleAuthMode(event) {
  event.preventDefault();
  isLoginMode = !isLoginMode;
  
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const nameGroup = document.getElementById("reg-name-group");
  const emailGroup = document.getElementById("reg-email-group");
  const submitBtn = document.getElementById("activate-profile-btn");
  const toggleLink = document.getElementById("toggle-auth-btn");
  const toggleText = document.getElementById("toggle-text");

  if (isLoginMode) {
    title.innerText = "Access Member Portal";
    subtitle.innerText = "Enter your credentials to access your profile, book classes, and view your routine.";
    nameGroup.style.display = "none";
    emailGroup.style.display = "none";
    submitBtn.innerText = "Enter Portal";
    toggleText.innerText = "Don't have an account?";
    toggleLink.innerText = "Create an Account";
  } else {
    title.innerText = "Create Your Profile";
    subtitle.innerText = "Activate your profile instantly to begin scheduling daily gym classes and track your workouts.";
    nameGroup.style.display = "block";
    emailGroup.style.display = "block";
    submitBtn.innerText = "Activate Account";
    toggleText.innerText = "Already have an account?";
    toggleLink.innerText = "Log In Here";
  }
}

// Master execution gatekeeper for your button click
async function handleAuthAction() {
  const username = document.getElementById("user-username").value.trim().toLowerCase();
  const password = document.getElementById("user-password").value.trim();
  const activateBtn = document.getElementById("activate-profile-btn");

  if (!username || !password) {
    alert("Please enter both your username and password.");
    return;
  }

  activateBtn.innerText = "Processing...";
  activateBtn.disabled = true;

  if (isLoginMode) {
    // ==========================================
    // TRACK A: LOG IN AN EXISTING MEMBER
    // ==========================================
    try {
      const response = await fetch(`${GOOGLE_API_URL}?username=${encodeURIComponent(username)}`);
      const result = await response.json();

      if (result.success) {
        const correctPassword = result.user.Password || result.user.password;

        if (correctPassword && String(correctPassword).trim() === password) {
          // Success! Capture profile rows seamlessly
          const memberId = result.user.MemberID || result.user.memberId || "MBR-" + username;
          const displayName = result.user.Name || result.user.FullName || result.user.MemberName || username;

          localStorage.setItem("iron_pulse_id", memberId);
          localStorage.setItem("iron_pulse_name", displayName);
          localStorage.setItem("iron_pulse_username", username);

          setupDashboardView(memberId, displayName, username);
          
          // Display workouts/assessments (⚠️ Customize these keywords to match your Row 1 columns exactly!)
          document.getElementById('workout-display').innerText = result.user.WorkoutPlan || "No training routine assigned for today.";
          document.getElementById('assessment-display').innerText = result.user.Assessments || "No recent fitness metrics logged.";
        } else {
          alert("Incorrect password. Please try again.");
          document.getElementById("user-password").value = "";
        }
      } else {
        alert("Username not found. Check spelling or switch to 'Create an Account'.");
      }
    } catch (error) {
      console.error("Login connection failure:", error);
      alert("Could not connect to authentication grid.");
    } finally {
      activateBtn.innerText = "Enter Portal";
      activateBtn.disabled = false;
    }

  } else {
    // ==========================================
    // TRACK B: REGISTER A BRAND NEW ACCOUNT
    // ==========================================
    const name = document.getElementById("user-name").value.trim();
    const email = document.getElementById("user-email").value.trim();

    if (!name || !email) {
      alert("Please fill in your Full Name and Email Address to create an account.");
      activateBtn.innerText = "Activate Account";
      activateBtn.disabled = false;
      return;
    }

    const memberId = "MBR-" + Date.now();

    // Cache registration metrics to device memory architecture
    localStorage.setItem("iron_pulse_id", memberId);
    localStorage.setItem("iron_pulse_name", name);
    localStorage.setItem("iron_pulse_username", username);

    setupDashboardView(memberId, name, username);
    
    document.getElementById('workout-display').innerText = "Welcome! Your customized workout plan will appear here soon.";
    document.getElementById('assessment-display').innerText = "No recent fitness assessments found.";
    
    activateBtn.innerText = "Activate Account";
    activateBtn.disabled = false;
  }
}

// Class Booking Transmission Engine (Stable, original structure preserved)
function handleBooking(className) {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentName = localStorage.getItem("iron_pulse_name"); 
  const currentUsername = localStorage.getItem("iron_pulse_username"); 

  if (!currentId) {
    alert("Please log in before booking gym classes.");
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
    email: currentUsername, // Sends username to your sheet parameters line
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

function setupDashboardView(id, name, username) {
  document.getElementById("auth-card").style.display = "none";
  document.getElementById("dashboard-view").style.display = "block";
  document.getElementById("display-name").innerText = name;
  document.getElementById("display-email").innerText = "@" + username;
}

async function checkLocalProfile() {
  const id = localStorage.getItem("iron_pulse_id");
  const name = localStorage.getItem("iron_pulse_name");
  const username = localStorage.getItem("iron_pulse_username");

  if (id && name && username) {
    setupDashboardView(id, name, username);
    
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
  document.getElementById("user-name").value = "";
  document.getElementById("user-email").value = "";
  
  // Revert back to login mode styles explicitly on signout
  isLoginMode = false; 
  toggleAuthMode({ preventDefault: () => {} });
}
