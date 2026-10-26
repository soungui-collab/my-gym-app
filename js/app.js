// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

// URL for Fitness Assessments & Workouts Sheet (Your dashboard connection)
const GOOGLE_API_URL = "https://google.com"; 

let isLoginMode = true;

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();
});

// Dynamic routing engine to shift panel cards and pull real-time database updates from Google Sheets
async function navigateToTab(tabId, clickedElement) {
  const tabs = document.querySelectorAll('.dashboard-tab');
  tabs.forEach(tab => tab.classList.remove('active-tab'));
  
  const navItems = document.querySelectorAll('.nav-dock-item');
  navItems.forEach(item => item.classList.remove('active-nav'));
  
  const activeTabPanel = document.getElementById(tabId);
  if (activeTabPanel) activeTabPanel.classList.add('active-tab');
  if (clickedElement) clickedElement.classList.add('active-nav');

  const currentUsername = localStorage.getItem("iron_pulse_username");
  const currentId = localStorage.getItem("iron_pulse_id");

  if (!currentUsername) return; 

  if (tabId === 'tab-home') {
    await fetchFreshSheetMetrics(currentUsername);
  } else if (tabId === 'tab-classes') {
    await fetchLiveClassSchedules(currentId);
  }
}

function checkLocalProfile() {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentName = localStorage.getItem("iron_pulse_name");
  const currentUsername = localStorage.getItem("iron_pulse_username");

  if (currentId && currentName && currentUsername) {
    setupDashboardView(currentId, currentName, currentUsername);
    fetchFreshSheetMetrics(currentUsername);
  }
}

async function fetchFreshSheetMetrics(username) {
  const workoutDisp = document.getElementById('workout-display');
  const assessDisp = document.getElementById('assessment-display');
  
  if (workoutDisp) workoutDisp.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">Syncing training file...</span>';
  if (assessDisp) assessDisp.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">Syncing assessment logging...</span>';

  try {
    const response = await fetch(`${GOOGLE_API_URL}?username=${encodeURIComponent(username)}`);
    const result = await response.json();
    if (result.success) {
      if (workoutDisp) workoutDisp.innerText = result.user.Workout || "No training routine assigned for today.";
      if (assessDisp) assessDisp.innerText = result.user.Assessment || "No recent fitness metrics logged.";
    } else {
      if (workoutDisp) workoutDisp.innerText = "Unable to locate routine file metrics.";
      if (assessDisp) assessDisp.innerText = "No metrics found linked to this profile.";
    }
  } catch(e) {
    console.error("Metric dashboard refresh sync failed:", e);
    if (workoutDisp) workoutDisp.innerText = "Offline. Failed to pull latest routine grid sync.";
    if (assessDisp) assessDisp.innerText = "Offline. Failed to read fitness metrics index.";
  }
}

async function fetchLiveClassSchedules(memberId) {
  const classContainer = document.getElementById('live-classes-container');
  if (!classContainer) return;

  classContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; font-style: italic; padding: 20px 0;">Polling available sessions from sheets roster...</p>';

  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getClasses&memberId=${encodeURIComponent(memberId)}`);
    const data = await response.json();

    if (data && data.classes && data.classes.length > 0) {
      classContainer.innerHTML = ''; 
      data.classes.forEach(gymClass => {
        const isReserved = gymClass.booked === true;
        const buttonHtml = isReserved 
          ? `<button class="book-btn" style="background: #444444; color: #888888;" disabled>Reserved</button>`
          : `<button class="book-btn" onclick="handleBooking('${gymClass.name}')">Book</button>`;

        const itemHtml = `
          <div class="class-item">
            <div class="class-info">
              <h3>${gymClass.name}</h3>
              <p>${gymClass.time || 'Schedule Unspecified'} • ${gymClass.type || 'General Access'}</p>
            </div>
            ${buttonHtml}
          </div>
        `;
        classContainer.insertAdjacentHTML('beforeend', itemHtml);
      });
    } else {
      throw new Error("No classes parsed or action unhandled");
    }
  } catch (error) {
    // Safe Fallback Layout to process static entries if your Apps Script isn't returning custom JSON arrays yet
    classContainer.innerHTML = `
      <div class="class-item"><div class="class-info"><h3>HIIT Circuit Training</h3><p>06:00 AM - 07:00 AM • High Intensity</p></div><button class="book-btn" onclick="handleBooking('HIIT Circuit Training')">Book</button></div>
      <div class="class-item"><div class="class-info"><h3>Strength & Conditioning</h3><p>09:30 AM - 10:30 AM • Power Building</p></div><button class="book-btn" onclick="handleBooking('Strength & Conditioning')">Book</button></div>
      <div class="class-item"><div class="class-info"><h3>Olympic Weightlifting</h3><p>05:30 PM - 06:45 PM • Advanced Form</p></div><button class="book-btn" onclick="handleBooking('Olympic Weightlifting')">Book</button></div>
    `;
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
          if (assessDisp) assessDisp.innerText = result.user.Assessment || "No recent fitness metrics logged.";
          
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
