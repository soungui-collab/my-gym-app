// =========================================================================
// 1. ALL BUTTON TRIGGERS & CLICK HANDLERS (At the top so HTML can always find them)
// =========================================================================
async function handleAuthAction() {
  const usernameElem = document.getElementById("user-username");
  const passwordElem = document.getElementById("user-password");
  const activateBtn = document.getElementById("activate-profile-btn");

  if (!usernameElem || !passwordElem) return;

  const username = usernameElem.value.trim().toLowerCase();
  const password = passwordElem.value.trim();

  if (!username || !password) {
    alert("Please enter both your username and password.");
    return;
  }

  if (activateBtn) {
    activateBtn.innerText = "Processing...";
    activateBtn.disabled = true;
  }

  if (isLoginMode) {
    try {
      const response = await fetch(`${GOOGLE_API_URL}?username=${encodeURIComponent(username)}`);
      const result = await response.json();

      if (result.success) {
        const correctPassword = result.user.Password || result.user.password;

        if (correctPassword && String(correctPassword).trim() === password) {
          const memberId = result.user.MemberID || result.user.memberId || "MBR-" + username;
          const displayName = result.user.Name || result.user.FullName || result.user.MemberName || username;

          localStorage.setItem("iron_pulse_id", memberId);
          localStorage.setItem("iron_pulse_name", displayName);
          localStorage.setItem("iron_pulse_username", username);

          setupDashboardView(memberId, displayName, username);
          
          const workoutDisp = document.getElementById('workout-display');
          const assessDisp = document.getElementById('assessment-display');
          
          if (workoutDisp) workoutDisp.innerText = result.user.Workout || "No training routine assigned for today.";
          if (assessDisp) assessDisp.innerText = result.user.Assessment || result.user.Assessments || "No recent fitness metrics logged.";
          
        } else {
          alert("Incorrect password. Please try again.");
          passwordElem.value = "";
        }
      } else {
        alert("Username not found. Check spelling or click 'Create an Account'.");
      }
    } catch (error) {
      console.error("handshake error:", error);
      alert("Could not connect to authentication grid.");
    } finally {
      if (activateBtn) {
        activateBtn.innerText = "Enter Portal";
        activateBtn.disabled = false;
      }
    }

  } else {
    const nameElem = document.getElementById("user-name");
    const emailElem = document.getElementById("user-email");
    const name = nameElem ? nameElem.value.trim() : "";
    const email = emailElem ? emailElem.value.trim() : "";

    if (!name || !email) {
      alert("Please fill in your Full Name and Email Address to create an account.");
      if (activateBtn) {
        activateBtn.innerText = "Activate Account";
        activateBtn.disabled = false;
      }
      return;
    }

    const memberId = "MBR-" + Date.now();

    localStorage.setItem("iron_pulse_id", memberId);
    localStorage.setItem("iron_pulse_name", name);
    localStorage.setItem("iron_pulse_username", username);

    setupDashboardView(memberId, name, username);
    
    const workoutDisp = document.getElementById('workout-display');
    const assessDisp = document.getElementById('assessment-display');
    const nutritionDisp = document.getElementById('nutrition-display');

    if (workoutDisp) workoutDisp.innerText = "Welcome! Your customized workout plan will appear here soon.";
    if (assessDisp) assessDisp.innerText = "No recent fitness assessments found.";
    if (nutritionDisp) nutritionDisp.innerHTML = "<p>Your custom nutrition document will appear here.</p>";
    
    if (activateBtn) {
      activateBtn.innerText = "Activate Account";
      activateBtn.disabled = false;
    }
  }
}

function toggleAuthMode(event) {
  if (event && typeof event.preventDefault === "function") event.preventDefault();
  isLoginMode = !isLoginMode;
  
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const nameGroup = document.getElementById("reg-name-group");
  const emailGroup = document.getElementById("reg-email-group");
  const submitBtn = document.getElementById("activate-profile-btn");
  const toggleLink = document.getElementById("toggle-auth-btn");
  const toggleText = document.getElementById("toggle-text");

  if (isLoginMode) {
    if (title) title.innerText = "Access Member Portal";
    if (subtitle) subtitle.innerText = "Enter your credentials to access your profile, book classes, and view your routine.";
    if (nameGroup) nameGroup.style.display = "none";
    if (emailGroup) emailGroup.style.display = "none";
    if (submitBtn) submitBtn.innerText = "Enter Portal";
    if (toggleText) toggleText.innerText = "Don't have an account?";
    if (toggleLink) toggleLink.innerText = "Create an Account";
  } else {
    if (title) title.innerText = "Create Your Profile";
    if (subtitle) subtitle.innerText = "Activate your profile instantly to begin scheduling daily gym classes and track your workouts.";
    if (nameGroup) nameGroup.style.display = "block";
    if (emailGroup) emailGroup.style.display = "block";
    if (submitBtn) submitBtn.innerText = "Activate Account";
    if (toggleText) toggleText.innerText = "Already have an account?";
    if (toggleLink) toggleLink.innerText = "Log In Here";
  }
}

async function openNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  const nutritionDisp = document.getElementById('nutrition-display');
  
  if (modal) modal.style.display = "flex";
  if (nutritionDisp) nutritionDisp.innerHTML = "<em>Syncing secure cloud data streams...</em>";
  
  const currentUsername = localStorage.getItem("iron_pulse_username");
  if (currentUsername) {
    await fetchNutritionPlanDocument(currentUsername);
  } else {
    if (nutritionDisp) nutritionDisp.innerHTML = "<p style='color:var(--text-muted);'>Please log in to view nutrition data.</p>";
  }
}

function closeNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "none";
}

// =========================================================================
// 2. NETWORK ENDPOINTS CONFIGURATION
// =========================================================================
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";
const GOOGLE_API_URL = "https://google.com"; 
const GOOGLE_DOCS_API_URL = "https://google.com";

let isLoginMode = true;

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();
});

// =========================================================================
// 3. CORE APPS LAYOUT ENGINE & UTILITIES
// =========================================================================
function setupDashboardView(id, name, username) {
  const authCard = document.getElementById("auth-card");
  const dashView = document.getElementById("dashboard-view");
  
  if (authCard) authCard.style.display = "none";
  if (dashView) dashView.style.display = "block";
  
  const dispName = document.getElementById("display-name") || document.getElementById("user-display-name");
  if (dispName) dispName.innerText = name;
}

function checkLocalProfile() {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentName = localStorage.getItem("iron_pulse_name");
  const currentUsername = localStorage.getItem("iron_pulse_username");

  if (currentId && currentName && currentUsername) {
    setupDashboardView(currentId, currentName, currentUsername);
  }
}

async function fetchNutritionPlanDocument(username) {
  const nutritionDisp = document.getElementById('nutrition-display');

  try {
    const docResponse = await fetch(`${GOOGLE_DOCS_API_URL}?action=fetchDocContent&username=${encodeURIComponent(username)}`);
    const docResult = await docResponse.json();
    
    if (docResult.success) {
      if (nutritionDisp) nutritionDisp.innerHTML = docResult.documentHtml;
    } else {
      console.warn("Drive lookup notice:", docResult.error);
      if (nutritionDisp) nutritionDisp.innerHTML = "<p style='color:#888;'>No custom nutrition document file found in Google Drive yet.</p>";
    }
  } catch (error) {
    console.error("Critical failure during nutrition file parsing sync:", error);
    if (nutritionDisp) nutritionDisp.innerHTML = "<p style='color:#ff4444;'>Failed to load nutrition profile data.</p>";
  }
}

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
    email: currentUsername, 
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
