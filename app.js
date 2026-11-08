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
    // 🍏 To your modern automated function call (or delete it if you want it to trigger by button click only):
loadNutritionPlan();
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

            // 1. MAP YOUR CLASSES TO THEIR TRUE DAYS OF THE WEEK (0 = Sunday, 1 = Monday, 2 = Tuesday...)
      let targetDayNum = 2; // Change default to 2 if your base class is Tuesday
      
      if (className.toLowerCase().includes("wednesday")) {
        targetDayNum = 3; // Wednesday (HIIT Women's Wednesday)
      } else if (className.toLowerCase().includes("shred")) {
        targetDayNum = 4; // Thursday (HIIT Lean Body Shred)
      } else if (className.toLowerCase().includes("saturday")) {
        targetDayNum = 6; // Saturday (Super Strength Saturday)
      } else if (className.toLowerCase().includes("built to last") || className.toLowerCase().includes("strength")) {
        targetDayNum = 2; // Tuesday (HIIT Built to Last Strength)
      } else {
        targetDayNum = 2; // Safe fallback to Tuesday if no keywords match
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

// =========================================================================
// 3. SECURE AUTHENTICATION ENGINE (SIGN IN / SIGN UP)
// =========================================================================
async function handleAuthAction() {
  const usernameElem = document.getElementById("user-username");
  const passwordElem = document.getElementById("user-password");
  const nameElem = document.getElementById("user-name");
  const emailElem = document.getElementById("user-email");
  const activateBtn = document.getElementById("activate-profile-btn");

  if (!usernameElem || !passwordElem) return;

  const username = usernameElem.value.trim().toLowerCase();
  const password = passwordElem.value.trim();

  if (!username || !password) {
    alert("Please enter both your username and password.");
    return;
  }

  const defaultBtnText = isLoginMode ? "Enter Portal" : "Register Account";

  if (activateBtn) {
    activateBtn.innerText = "Processing...";
    activateBtn.disabled = true;
  }

  // ==========================================
  // PIPELINE A: SIGN IN / LOGIN MODE
  // ==========================================
  if (isLoginMode) {
    try {
      const loginUrl = `${GOOGLE_API_URL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

      const response = await fetch(loginUrl, {
        method: 'GET'
      });
      
      const result = await response.json();

      if (result.success) {
        const displayName = result.user.ClientName || username;
        const memberId = "MBR-" + username;

        localStorage.setItem("iron_pulse_id", memberId);
        localStorage.setItem("iron_pulse_name", displayName);
        localStorage.setItem("iron_pulse_username", username);

        setupDashboardView(memberId, displayName, username);
        
      } else {
        alert(result.message || "Invalid credentials. Please try again.");
        passwordElem.value = "";
        if (activateBtn) {
          activateBtn.innerText = defaultBtnText;
          activateBtn.disabled = false;
        }
      }
    } catch (e) {
      console.error("Critical authentication routing failure:", e);
      alert("Authentication connection error. Check your Inspect console for details.");
      if (activateBtn) {
        activateBtn.innerText = defaultBtnText;
        activateBtn.disabled = false;
      }
    }
  } 
  // ==========================================
  // PIPELINE B: SIGN UP / REGISTRATION MODE
  // ==========================================
  else {
    const name = nameElem ? nameElem.value.trim() : "";
    const email = emailElem ? emailElem.value.trim() : "";

    if (!name || !email) {
      alert("Please provide your name and email to register.");
      if (activateBtn) {
        activateBtn.innerText = defaultBtnText;
        activateBtn.disabled = false;
      }
      return;
    }

    try {
      const regUrl = `${GOOGLE_API_URL}?action=registerUser&Username=${encodeURIComponent(username)}&Password=${encodeURIComponent(password)}&Name=${encodeURIComponent(name)}&Email=${encodeURIComponent(email)}`;
      
      const response = await fetch(regUrl, {
        method: 'GET'
      });

      const result = await response.json();

      if (result.success) {
        alert("Account created securely! You can now log in.");
        
        if (nameElem) nameElem.value = "";
        if (emailElem) emailElem.value = "";
        passwordElem.value = "";
        
        const toggleBtn = document.getElementById("toggle-auth-btn");
        if (toggleBtn) {
          toggleBtn.click(); 
        }
      } else {
        alert("Registration Error: " + (result.error || "Failed to finalize registration."));
      }

    } catch (e) {
      console.error("Critical registration pipeline failure:", e);
      alert("Registration system connection error.");
    } finally {
      if (activateBtn) {
        activateBtn.innerText = isLoginMode ? "Enter Portal" : "Register Account";
        activateBtn.disabled = false;
      }
    }
  }
}

// =========================================================================
// 🍏 INTERACTIVE POP-UP MODAL STREAM CONTROLLERS
// =========================================================================

/**
 * A. WORKOUT ROUTINE POP-UP MODAL PIPELINES
 */
function openWorkoutModal() {
  const modal = document.getElementById("workout-modal");
  const displayContainer = document.getElementById("workout-modal-display");
  
  if (!modal || !displayContainer) {
    console.error("Layout Error: Could not locate workout modal container elements in HTML.");
    return;
  }
  
  modal.style.display = "flex";
  displayContainer.innerHTML = "<p class='loading-text' style='color: var(--accent-color);'>Streaming your custom training splits out of Google Drive...</p>";
  
  loadDocumentStreamIntoElement("workout", displayContainer);
}

function closeWorkoutModal() {
  const modal = document.getElementById("workout-modal");
  if (modal) modal.style.display = "none";
}

/**
 * B. FITNESS ASSESSMENT POP-UP MODAL PIPELINES
 */
function openAssessmentModal() {
  const modal = document.getElementById("assessment-modal");
  const displayContainer = document.getElementById("assessment-modal-display");
  
  if (!modal || !displayContainer) {
    console.error("Layout Error: Could not locate assessment modal container elements in HTML.");
    return;
  }
  
  modal.style.display = "flex";
  displayContainer.innerHTML = "<p class='loading-text' style='color: var(--accent-color);'>Retrieving your biometric milestone data from Google Drive...</p>";
  
  loadDocumentStreamIntoElement("assessment", displayContainer);
}

function closeAssessmentModal() {
  const modal = document.getElementById("assessment-modal");
  if (modal) modal.style.display = "none";
}

/**
 * C. NUTRITION BLUEPRINT POP-UP MODAL CONTROLLERS
 */
function openNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  const displayContainer = document.getElementById("nutrition-modal-display");
  
  if (!modal || !displayContainer) {
    console.error("Layout Error: Could not locate nutrition modal container elements in HTML.");
    return;
  }
  
  modal.style.display = "flex";
  displayContainer.innerHTML = "<p class='loading-text' style='color: var(--accent-color);'>Streaming your unique nutrition blueprint out of Google Drive...</p>";
  
  loadDocumentStreamIntoElement("nutrition", displayContainer);
}

function closeNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "none";
}

// Global exposure for HTML inline onclick attributes to find them safely
window.openWorkoutModal = openWorkoutModal;
window.closeWorkoutModal = closeWorkoutModal;
window.openAssessmentModal = openAssessmentModal;
window.closeAssessmentModal = closeAssessmentModal;
window.openNutritionModal = openNutritionModal;
window.closeNutritionModal = closeNutritionModal;

/**
 * UNIFIED DIAGNOSTIC DOCUMENT UTILITY ENGINE
 */
async function loadDocumentStreamIntoElement(docType, displayContainer) {
  const username = localStorage.getItem("iron_pulse_username");
  
  if (!username) {
    displayContainer.innerHTML = "<p class='error-text' style='color: #ff4757;'>Profile Error: Logged-in username token not found in browser memory. Please log out and back in.</p>";
    return;
  }
  
  try {
    const targetUrl = `${GOOGLE_API_URL}?action=fetchDoc&username=${encodeURIComponent(username)}&docType=${docType}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      displayContainer.innerHTML = `<p class='error-text' style='color: #ff4757;'>Server HTTP Rejection: ${response.status} ${response.statusText}</p>`;
      return;
    }
    
    const result = await response.json();

    if (result.status === "success") {
      renderDocumentElements(displayContainer, result.elements);
    } else {
      displayContainer.innerHTML = `<p class='error-text' style='color: #ff4757;'>Backend Warning: ${result.message || "Unknown database mapping error."}</p>`;
    }
  } catch (err) {
    console.error(`Streaming infrastructure connection issue for ${docType}:`, err);
    displayContainer.innerHTML = `<p class='error-text' style='color: #ff4757;'>Connection Error: Failed to parse server response. Check browser developer console for network details.</p>`;
  }
}

/**
 * REUSABLE CORE RENDER ENGINE
 */
function renderDocumentElements(container, elements) {
  container.innerHTML = ""; 
  
  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    container.innerHTML = "<p class='empty-text'>Plan document is currently empty or unreadable. Contact your coach!</p>";
    return;
  }

  elements.forEach(el => {
    if (el.type === "text") {
      const p = document.createElement("p");
      p.className = "doc-paragraph";
      p.innerText = el.content;
      container.appendChild(p);
    } else if (el.type === "image") {
      const img = document.createElement("img");
      img.className = "doc-inline-image";
      img.src = `data:${el.mimeType};base64,${el.data}`;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      img.style.margin = "12px 0";
      img.style.display = "block";
      container.appendChild(img);
    }
  });
}



function closeNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "none";
}
// =========================================================================
// 6. INDIVIDUAL GYM SESSION CALENDAR BOOKING PIPELINE
// =========================================================================
async function bookIndividualSession() {
  const dateInput = document.getElementById('session-date');
  const timeSelect = document.getElementById('session-time');
  const bookBtn = document.getElementById('book-session-btn');
  
  if (!dateInput || !timeSelect || !bookBtn) return;
  
  const chosenDate = dateInput.value; // Format: YYYY-MM-DD
  const chosenTime = timeSelect.value; // Format: HH:MM
  
  if (!chosenDate || !chosenTime) {
    alert("Please select both a date and a time slot before booking.");
    return;
  }
  
  const originalText = bookBtn.textContent;
  bookBtn.textContent = "Processing reservation...";
  bookBtn.disabled = true;
  
  try {
    // Compile input parameters into a true local Date element matrix
    const startDateTime = new Date(`${chosenDate}T${chosenTime}:00`);
    
    // Create an end timestamp precisely 1 hour later
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000));
    
    const memberName = localStorage.getItem('iron_pulse_name') || 'Gym Member';
    const memberEmail = localStorage.getItem('iron_pulse_username') || 'member@example.com';
    const memberId = localStorage.getItem('iron_pulse_id') || 'ID-TEMP';
    
    // Explicit targeting mirror to matching group class payload arrays
    const webAppUrl = 'https://google.com';
    
    const payload = {
      action: 'bookSession', // Distinct hook key for Apps Script routing
      name: memberName,
      email: memberEmail,
      memberId: memberId,
      className: `Gym Session (${memberId})`, // Populates as event title in calendar
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    };
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.status === "success") {
      bookBtn.textContent = "Reserved Slot! ✓";
      bookBtn.style.backgroundColor = "#28a745";
      bookBtn.style.color = "white";
      
      // Auto-reset state placeholders after brief success delay
      setTimeout(() => {
        bookBtn.textContent = originalText;
        bookBtn.style.backgroundColor = "";
        bookBtn.disabled = false;
        dateInput.value = "";
        timeSelect.value = "";
      }, 3000);
      
    } else {
      alert("Session Booking Failed: " + result.message);
      bookBtn.textContent = originalText;
      bookBtn.disabled = false;
    }
    
  } catch (err) {
    console.error("Individual session processing failure:", err);
    alert("Connection failure trying to build calendar event allocation block.");
    bookBtn.textContent = originalText;
    bookBtn.disabled = false;
  }
}

// Expose block cleanly to window layer context
window.bookIndividualSession = bookIndividualSession;
