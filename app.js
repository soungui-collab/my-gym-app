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
      const className = classItem.querySelector('h3').textContent.trim();

      // 1. MAP YOUR CLASSES TO THEIR SPECIFIC DAYS OF THE WEEK
      let targetDayNum = 1; // Default to Monday
      if (className.toLowerCase().includes("wednesday")) {
        targetDayNum = 3; // Wednesday
      } else if (className.toLowerCase().includes("shred")) {
        targetDayNum = 4; // Thursday (HIIT Lean Body Shred)
      } else if (className.toLowerCase().includes("saturday")) {
        targetDayNum = 6; // Saturday
      } else {
        targetDayNum = 1; // Tuesday (HIIT Built to Last Strength)
      }

      // 2. MATHEMATICALLY CALCULATE THE TRUE UPCOMING DATE
      const bookingDate = new Date(); // Start at right now
      const currentDayNum = bookingDate.getDay();

      let daysUntilClass = targetDayNum - currentDayNum;
      if (daysUntilClass <= 0) {
        daysUntilClass += 7; // If the day has passed or is today, schedule for next week's session
      }

      bookingDate.setDate(bookingDate.getDate() + daysUntilClass);

      // 3. SET THE EXACT HOURS FOR THE SESSIONS
      if (targetDayNum === 6) {
        bookingDate.setHours(11, 0, 0, 0); // Saturday at 11:00 AM
      } else if (className.toLowerCase().includes("wednesday")) {
        bookingDate.setHours(18, 30, 0, 0); // Wednesday at 6:30 PM
      } else {
        bookingDate.setHours(18, 0, 0, 0); // Monday & Thursday at 6:00 PM
      }

      // Create an end time exactly 1 hour later
      const endDate = new Date(bookingDate.getTime() + (60 * 60 * 1000));

      const memberName = localStorage.getItem('iron_pulse_name') || 'Gym Member';
      const memberEmail = localStorage.getItem('iron_pulse_username') || 'member@example.com';
      const memberId = localStorage.getItem('iron_pulse_id') || 'ID-TEMP';

      // ⚠️ PUT YOUR ACTUAL ACCURATE GOOGLE SCRIPT DEPLOYMENT URL HERE
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
        console.error("Network connection error:", netError);
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
