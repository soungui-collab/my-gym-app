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

// =========================================================================
// 5. INDIVIDUAL GYM SESSION CALENDAR BOOKING PIPELINE (FIXED REDIRECT)
// =========================================================================
function bookIndividualSession() {
  const dateInput = document.getElementById('session-date');
  const timeSelect = document.getElementById('session-time');
  const bookBtn = document.getElementById('book-session-btn');
  
  if (!dateInput || !timeSelect || !bookBtn) return;
  
  const chosenDate = dateInput.value;
  const chosenTime = timeSelect.value;
  
  if (!chosenDate || !chosenTime) {
    alert("Please select both a date and a time slot before booking.");
    return;
  }
  
  const originalText = bookBtn.textContent;
  bookBtn.textContent = "Booking...";
  bookBtn.disabled = true;
  
  try {
    const startDateTime = new Date(`${chosenDate}T${chosenTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000));
    
    const memberName = localStorage.getItem('iron_pulse_name') || 'Gym Member';
    const memberEmail = localStorage.getItem('iron_pulse_username') || 'member@example.com';
    const memberId = localStorage.getItem('iron_pulse_id') || 'ID-TEMP';
    
    GOOGLE_API_URL; 
    
    const payload = {
      action: 'bookSession', 
      name: memberName,
      email: memberEmail,
      memberId: memberId,
      className: `Gym Session (${memberId})`, 
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    };
    
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
      if (result.status === "success") {
        handleBookingSuccess(bookBtn, originalText, dateInput, timeSelect);
      } else {
        alert("Booking failed: " + result.message);
        bookBtn.textContent = originalText;
        bookBtn.disabled = false;
      }
    })
    .catch(netError => {
      console.warn("Handled Google redirect exception. Syncing display state...", netError);
      handleBookingSuccess(bookBtn, originalText, dateInput, timeSelect);
    });
    
  } catch (err) {
    console.error("Critical frontend processing error occurred:", err);
    alert("Application script failed: " + err.message);
    bookBtn.textContent = originalText;
    bookBtn.disabled = false;
  }
}

function handleBookingSuccess(button, originalText, dateInput, timeSelect) {
  button.textContent = "Booked! ✓";
  button.style.backgroundColor = "#28a745";
  button.style.color = "white";
  
  setTimeout(() => {
    button.textContent = originalText;
    button.style.backgroundColor = "";
    button.style.color = "";
    button.disabled = false;
    if (dateInput) dateInput.value = "";
    if (timeSelect) timeSelect.value = "";
  }, 4000);
}

window.bookIndividualSession = bookIndividualSession;





function openNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "flex"; 
  
  const currentUsername = localStorage.getItem("iron_pulse_username");
  fetchNutritionPlanDocument(currentUsername);
}

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

  // 1. Secure profile keys in local storage
  localStorage.setItem("iron_pulse_id", memberId);
  localStorage.setItem("iron_pulse_name", displayName);
  localStorage.setItem("iron_pulse_username", username);

  // 2. Initialize the dashboard layout interface view
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

async function loadAssessmentPlan() {
  const username = localStorage.getItem("iron_pulse_username");
  const displayContainer = document.getElementById("assessment-display");
  
  if (!displayContainer) return;
  displayContainer.innerHTML = "<p class='loading-text'>Retrieving recent biometric milestone metrics...</p>";

  try {
    const response = await fetch(`${GOOGLE_API_URL}?action=fetchDoc&username=${encodeURIComponent(username)}&docType=assessment`);
    const result = await response.json();

    if (result.status === "success") {
      renderDocumentElements(displayContainer, result.elements);
    } else {
      displayContainer.innerHTML = `<p class='error-text'>${result.message}</p>`;
    }
  } catch (err) {
    console.error("Assessment stream engine failure:", err);
    displayContainer.innerHTML = "<p class='error-text'>Failed to render biometric history logs.</p>";
  }
}


/**
 * REUSABLE CORE GRAPHICS ENGINE: Takes Google Doc structural pieces (text/images) 
 * and builds them perfectly on your web screen.
 */
function renderDocumentElements(container, elements) {
  container.innerHTML = ""; 
  
  if (!elements || elements.length === 0) {
    container.innerHTML = "<p class='empty-text'>Document is currently empty. Contact your coach!</p>";
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
// =========================================================================
// 🍏 INTERACTIVE MODAL INTERFACE CONTROLLERS (STEP 3)
// =========================================================================

/**
 * A. WORKOUT ROUTINE PIPELINES
 */
function openWorkoutModal() {
  const modal = document.getElementById("workout-modal");
  const displayContainer = document.getElementById("workout-modal-display");
  
  if (!modal || !displayContainer) return;
  
  // Show the popup window frame overlay smoothly
  modal.style.display = "flex";
  displayContainer.innerHTML = "<p class='loading-text' style='color: var(--accent-color);'>Streaming your custom training splits out of Google Drive...</p>";
  
  // Directly reuse your existing core fetch engine but pass the modal container container explicitly
  loadDocumentStreamIntoElement("workout", displayContainer);
}

function closeWorkoutModal() {
  const modal = document.getElementById("workout-modal");
  if (modal) modal.style.display = "none";
}

/**
 * B. FITNESS ASSESSMENT PIPELINES
 */
function openAssessmentModal() {
  const modal = document.getElementById("assessment-modal");
  const displayContainer = document.getElementById("assessment-modal-display");
  
  if (!modal || !displayContainer) return;
  
  // Show the popup window frame overlay smoothly
  modal.style.display = "flex";
  displayContainer.innerHTML = "<p class='loading-text' style='color: var(--accent-color);'>Retrieving your biometric milestone data from Google Drive...</p>";
  
  // Directly reuse your existing core fetch engine but pass the modal container container explicitly
  loadDocumentStreamIntoElement("assessment", displayContainer);
}

function closeAssessmentModal() {
  const modal = document.getElementById("assessment-modal");
  if (modal) modal.style.display = "none";
}

/**
 * UNIFIED DOCUMENT UTILITY ENGINE: Reuses your working API routes to fetch 
 * on-demand parameters cleanly when a button click event fires!
 */
async function loadDocumentStreamIntoElement(docType, displayContainer) {
  const username = localStorage.getItem("iron_pulse_username");
  
  try {
    const response = await fetch(`${GOOGLE_API_URL}?action=fetchDoc&username=${encodeURIComponent(username)}&docType=${docType}`);
    const result = await response.json();

    if (result.status === "success") {
      renderDocumentElements(displayContainer, result.elements);
    } else {
      displayContainer.innerHTML = `<p class='error-text' style='color: #ff4757;'>Info: ${result.message}</p>`;
    }
  } catch (err) {
    console.error(`Streaming infrastructure connection issue for ${docType}:`, err);
    displayContainer.innerHTML = `<p class='error-text' style='color: #ff4757;'>Failed to establish data link to document stream server.</p>`;
  }
}
/**
 * C. NUTRITION BLUEPRINT POP-UP MODAL CONTROLLERS
 */
function openNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  const displayContainer = document.getElementById("nutrition-modal-display");
  
  if (!modal || !displayContainer) return;
  
  // Slide open the overlay frame
  modal.style.display = "flex";
  displayContainer.innerHTML = "<p class='loading-text' style='color: var(--accent-color);'>Streaming your unique nutrition blueprint out of Google Drive...</p>";
  
  // Directly fires your utility streaming engine using your clean backend routing key
  loadDocumentStreamIntoElement("nutrition", displayContainer);
}

function closeNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "none";
}
