// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzV1FQZ2zWcLBTquasr4rX8S4JtEbzIO0RbO3bKiJngpuskD431bMdNTBAnkicQRAx4/exec";

// URL for Fitness Assessments & Workouts Sheet (Your dashboard connection)
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzCqCk9fmNXAwLgpHYPSbixHky2vJuabT4H1-WhjWzuHLW2cXMsiOvKE_RchAHp-bEA/exec"; 

// 🆕 URL for your brand new standalone Google Docs script
const GOOGLE_DOCS_API_URL = "https://script.google.com/macros/s/AKfycbwJEc00R1kvOxcONbB_QDmTgmyl6-cMbvRXF4u8TDiTOp3V8QMEk2SInuKS8LP2gXE6/exec";

let isLoginMode = true;

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();
});

function generateGoogleCalendarUrl(title, startTime, endTime, details, location) {
  const formatUrlDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  };

  const startStr = formatUrlDate(startTime);
  const endStr = formatUrlDate(endTime);
  
  const baseUrl = 'https://google.com';
  const url = `${baseUrl}&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  
  return url;
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
          
          // 🆕 TRIGGER: Fetch Document content immediately following profile authentication
          await fetchMemberDocument(username);
          
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
    if (workoutDisp) workoutDisp.innerText = "Welcome! Your customized workout plan will appear here soon.";
    if (assessDisp) assessDisp.innerText = "No recent fitness assessments found.";
    
    if (activateBtn) {
      activateBtn.innerText = "Activate Account";
      activateBtn.disabled = false;
    }
  }
}

// 🆕 FUNCTION: Look up the Google Doc via Drive API standalone script 
async function fetchMemberDocument(username) {
  const workoutDisp = document.getElementById('workout-display');
  
  if (workoutDisp) {
    workoutDisp.innerText = "Loading your custom training file out of Google Drive...";
  }

  try {
    const docResponse = await fetch(`${GOOGLE_DOCS_API_URL}?action=fetchDocContent&username=${encodeURIComponent(username)}`);
    const docResult = await docResponse.json();
    
    if (docResult.success) {
      if (workoutDisp) {
        // Overwrite the static grid card with the full contents of your Google Doc file
        workoutDisp.innerText = docResult.documentText;
      }
    } else {
      console.warn("Document query notice:", docResult.error);
      // Fallback display message inside the element box if a doc file isn't set up yet
      if (workoutDisp) workoutDisp.innerText = "No file with your username found in Google Drive yet.";
    }
  } catch (error) {
    console.error("Failed to safely fetch your customized Google Document:", error);
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
  alert(`Successfully booked! You are locked in for "${className}".`);
  if (btn && btn.classList.contains("book-btn")) {
    btn.style.background = "#444444";
    btn.style.color = "#888888";
    btn.innerText = "Reserved";
    btn.disabled = true;
  }
}

function setupDashboardView(id, name, username) {
  const authCard = document.getElementById("auth-card");
  const dashView = document.getElementById("dashboard-view");
  // Remainder of your layout setup logic follows cleanly below...
}
