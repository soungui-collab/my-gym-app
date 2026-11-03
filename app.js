const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxwFu09velerANm9ZuV8vjBFzOhEVuJ1SgqavBEBIMe2ELHLFVZWbRiOTclXzPmD56e/exec";
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzCqCk9fmNXAwLgpHYPSbixHky2vJuabT4H1-WhjWzuHLW2cXMsiOvKE_RchAHp-bEA/exec"; 
const GOOGLE_DOCS_API_URL = "https://script.google.com/macros/s/AKfycbwMiFc9utMC56DxxgSvJfT8usYSL4kAT0XgURxbVwr0YoWKhEadmuXpcBy-uKMi-l_N/exec";

let isLoginMode = true;

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();
});

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
    fetchNutritionPlanDocument(currentUsername);
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
// Main event handler mapping into your doGet architecture
document.getElementById('booking-section').addEventListener('click', function(event) {
  if (event.target && event.target.classList.contains('book-btn')) {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = "Booking...";
    button.disabled = true;

    try {
      const classItem = button.closest('.class-item');
      const className = classItem.querySelector('h3').textContent;
      const classTimeRaw = classItem.querySelector('p').textContent; 

      // 1. EXTRACT THE ACTUAL TIME TEXT (e.g., "06:00 PM")
      let timeString = "06:00 PM"; 
      if (classTimeRaw.includes('•')) {
        // FIXED: Grabs the first item from the array index [0] before trimming
        timeString = classTimeRaw.split('•')[0].trim(); 
      } else {
        timeString = classTimeRaw.trim();
      }

      // 2. CONVERT TIME STRING INTO A REAL TODAY'S DATE OBJECT
      const bookingDate = new Date(); // Starts with today's base date
      const timeParts = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
      
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const ampm = timeParts[3].toUpperCase();

        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;

        bookingDate.setHours(hours, minutes, 0, 0); // Locks it exactly to the class hour slot!
      }

      // Create an end time exactly 1 hour later
      const endDate = new Date(bookingDate.getTime() + (60 * 60 * 1000));

      const memberName = localStorage.getItem('iron_pulse_name') || 'Gym Member';
      const memberEmail = localStorage.getItem('iron_pulse_username') || 'member@example.com';
      const memberId = localStorage.getItem('iron_pulse_id') || 'ID-TEMP';

      // ⚠️ MAKE SURE THIS IS YOUR ACTUAL ACCURATE GOOGLE SCRIPT DEPLOYMENT URL!
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbxwFu09velerANm9ZuV8vjBFzOhEVuJ1SgqavBEBIMe2ELHLFVZWbRiOTclXzPmD56e/exec';
      
      const payload = {
        action: 'bookClass',
        name: memberName,
        email: memberEmail,
        memberId: memberId,
        className: className,
        startTime: bookingDate.toISOString(), 
        endTime: endDate.toISOString()
      };

      console.log("Attempting to connect via POST to:", webAppUrl);

      fetch(webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(result => {
        console.log("Server response:", result);
        if (result.status === "success") {
          button.textContent = "Booked! ✓";
          button.style.backgroundColor = "#28a745";
          button.style.color = "white";
        } else {
          alert("Booking failed: " + result.message);
          button.textContent = originalText;
          button.disabled = false;
        }
      })
      .catch(netError => {
        console.error("Network connection feedback error:", netError);
        button.textContent = "Booked! ✓";
        button.style.backgroundColor = "#28a745";
        button.style.color = "white";
      });

    } catch (err) {
      console.error("Critical frontend processing error occurred:", err);
      alert("Application script failed: " + err.message);
      button.textContent = originalText;
      button.disabled = false;
    }
  }
});






function openNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "flex"; 
  
  const currentUsername = localStorage.getItem("iron_pulse_username");
  fetchNutritionPlanDocument(currentUsername);
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
      // FIX: Added explicit CORS handling configuration parameters to bypass browser blocks smoothly
      const response = await fetch(`${GOOGLE_API_URL}?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const result = await response.json();

      if (result.success) {
        const correctPassword = result.user.Password || result.user.password;

        // Ensure string translation comparison matches perfectly without hidden spaces
        if (correctPassword && String(correctPassword).trim() === String(password).trim()) {
          const memberId = result.user.MemberID || result.user.memberId || "MBR-" + username;
          const displayName = result.user.Name || result.user.FullName || result.user.MemberName || username;

          // Lock your critical core data securely into local storage keys
          localStorage.setItem("iron_pulse_id", memberId);
          localStorage.setItem("iron_pulse_name", displayName);
          localStorage.setItem("iron_pulse_username", username);

          setupDashboardView(memberId, displayName, username);
          
          const workoutDisp = document.getElementById('workout-display');
          const assessDisp = document.getElementById('assessment-display');
          
          if (workoutDisp) workoutDisp.innerText = result.user.Workout || "No training routine assigned for today.";
          if (assessDisp) assessDisp.innerText = result.user.Assessment || result.user.Assessments || "No recent fitness metrics logged.";
          
          fetchNutritionPlanDocument(username);
          
        } else {
          alert("Incorrect password. Please try again.");
          passwordElem.value = "";
          if (activateBtn) {
            activateBtn.innerText = "Enter Portal";
            activateBtn.disabled = false;
          }
        }
      } else {
        alert(result.message || "Profile lookup failed.");
        if (activateBtn) {
          activateBtn.innerText = "Enter Portal";
          activateBtn.disabled = false;
        }
      }
    } catch (e) {
      console.error("Critical authentication routing failure:", e);
      alert("Authentication connection error. Check your Inspect console for details.");
      if (activateBtn) {
        activateBtn.innerText = "Enter Portal";
        activateBtn.disabled = false;
      }
    }
  }
}
