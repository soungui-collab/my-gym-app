const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzV1FQZ2zWcLBTquasr4rX8S4JtEbzIO0RbO3bKiJngpuskD431bMdNTBAnkicQRAx4/exec";
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

    const classItem = button.closest('.class-item');
    const className = classItem.querySelector('h3').textContent;
    const classTimeRaw = classItem.querySelector('p').textContent; 
    
    // Clean string split handling
    const timeString = classTimeRaw.split('•')[0].trim(); 

    // Setup weekly day routing
    let classDay = "Monday"; 
    if (className.toLowerCase().includes('wednesday')) classDay = "Wednesday";
    else if (className.toLowerCase().includes('saturday')) classDay = "Saturday";
    else if (className.toLowerCase().includes('built to last')) classDay = "Monday"; 
    else if (className.toLowerCase().includes('lean body shred')) classDay = "Tuesday"; 

    // Find target day calculations cleanly
    const today = new Date();
    const daysOfWeek = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
    const targetDay = daysOfWeek[classDay.toLowerCase()];
    const currentDay = today.getDay();
    let daysToAdd = (targetDay - currentDay + 7) % 7;
    
    const startIsoString = new Date();
    startIsoString.setDate(today.getDate() + daysToAdd);
    
    // Parse time string (e.g., "06:00 PM") safely
    const timeMatches = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatches) {
      let hours = parseInt(timeMatches[1], 10);
      const minutes = parseInt(timeMatches[2], 10);
      const ampm = timeMatches[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      startIsoString.setHours(hours, minutes, 0, 0);
    }
    
    const endDate = new Date(startIsoString);
    endDate.setHours(endDate.getHours() + 1);

    const memberName = localStorage.getItem('userName') || 'Gym Member';
    const memberEmail = localStorage.getItem('userEmail') || 'member@example.com';
    const memberId = localStorage.getItem('memberId') || 'ID-TEMP';

    // Set your deployment URL here
    const webAppUrl = 'https://script.google.com/macros/s/AKfycby8Yf0BgbnXKdTY0OcWfew-x6IP9ddEyMI8i5_2_XCsRUH0qaTAsT2MWQ_t6g6aRsa-/exec';
    
    const params = new URLSearchParams({
      action: 'bookClass',
      name: memberName,
      email: memberEmail,
      memberId: memberId,
      className: className,
      startTime: startIsoString.toISOString(),
      endTime: endDate.toISOString()
    });

    // Dispatches via fetch. mode: 'no-cors' sends data safely even if the return payload is hidden
    fetch(`${webAppUrl}?${params.toString()}`, {
      method: 'GET',
      mode: 'no-cors'
    })
    .then(() => {
      button.textContent = "Booked! ✓";
      button.style.backgroundColor = "#28a745";
      button.style.color = "white";
    })
    .catch((error) => {
      console.error('Booking system error:', error);
      button.textContent = originalText;
      button.disabled = false;
    });
  }
});




function openNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "flex"; 
  
  const currentUsername = localStorage.getItem("iron_pulse_username");
  fetchNutritionPlanDocument(currentUsername);
}

async function fetchNutritionPlanDocument(username) { 
  const nutritionDisp = document.getElementById('nutrition-display'); 
  if (!nutritionDisp) return;
  
  const modal = document.getElementById("nutrition-modal");
  if (modal && modal.style.display === "flex" && !nutritionDisp.innerHTML) {
    nutritionDisp.innerHTML = "<div style='text-align:center; padding:20px; font-style:italic; color:#bbb;'>Syncing customized nutrition plan file from Google Drive...</div>";
  }
  
  const urlParam = username ? `?username=${encodeURIComponent(username)}` : "";
  const fetchUrl = `${GOOGLE_DOCS_API_URL}${urlParam}`;
  
  try {
    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    if (data && data.sections) {
      nutritionDisp.innerHTML = "";

      const contentWrapper = document.createElement('div');
      contentWrapper.style.display = 'flex';
      contentWrapper.style.flexDirection = 'column';
      contentWrapper.style.gap = '10px';
      
      data.sections.forEach(section => {
        if (section.type === "text") {
          if (section.content.trim() === "") {
            const space = document.createElement('div');
            space.style.height = '1em';
            contentWrapper.appendChild(space);
          } else {
            const p = document.createElement('p');
            p.style.margin = '0';
            p.style.lineHeight = '1.6';
            p.style.fontSize = '15px';
            p.style.color = '#ffffff'; // High contrast white text for dark backgrounds
            p.innerText = section.content;
            contentWrapper.appendChild(p);
          }
        } else if (section.type === "image") {
          const imgData = section.content;
          
          const itemWrapper = document.createElement('div');
          itemWrapper.style.width = '100%';
          itemWrapper.style.maxWidth = '520px';
          itemWrapper.style.margin = '15px auto';
          itemWrapper.style.textAlign = 'center';
          itemWrapper.style.padding = '12px';
          itemWrapper.style.backgroundColor = '#1e1e1e'; // Soft dark background card to match dark theme
          itemWrapper.style.border = '1px solid #333333';
          itemWrapper.style.borderRadius = '8px';
          itemWrapper.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          
          const imgTag = document.createElement('img');
          imgTag.src = imgData.dataUri;
          imgTag.alt = imgData.altText || "Nutrition Plan Image";
          imgTag.title = imgData.title || "";
          imgTag.style.width = '100%';
          imgTag.style.height = 'auto';
          imgTag.style.borderRadius = '6px';
          itemWrapper.appendChild(imgTag);

          if (imgData.altText || imgData.title) {
            const caption = document.createElement('p');
            caption.style.margin = '10px 0 0 0';
            caption.style.fontSize = '13px';
            caption.style.color = '#cccccc'; // Light silver text for captions
            caption.style.fontStyle = 'italic';
            caption.style.lineHeight = '1.4';
            caption.innerText = imgData.altText || imgData.title;
            itemWrapper.appendChild(caption);
          }
          
          contentWrapper.appendChild(itemWrapper);
        }
      });
      
      nutritionDisp.appendChild(contentWrapper);
    } else if (data && data.message) {
      nutritionDisp.innerHTML = `<span style='color: orange;'>${data.message}</span>`;
    } else {
      nutritionDisp.innerHTML = "<span style='color: orange;'>Nutrition plan data structure is empty.</span>";
    }
    
  } catch (error) {
    console.error("Failed to load nutrition plan:", error);
    nutritionDisp.innerHTML = "<span style='color: red;'>Error loading nutrition plan. Please try again.</span>";
  }
}

function closeNutritionModal() {
  const modal = document.getElementById("nutrition-modal");
  if (modal) modal.style.display = "none";
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
      console.error(e);
      alert("Authentication error.");
      if (activateBtn) {
        activateBtn.innerText = "Enter Portal";
        activateBtn.disabled = false;
      }
    }
  }
}
