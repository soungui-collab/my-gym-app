// URL for Class Bookings Sheet (Your original connection)
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

// URL for Fitness Assessments & Workouts Sheet (Your dashboard connection)
const GOOGLE_API_URL = "https://google.com"; 

// URL for your standalone Google Docs script (Pulls Nutrition content)
const GOOGLE_DOCS_API_URL = "https://google.com";

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
    nutritionDisp.innerHTML = "<em>Syncing customized nutrition plan file from Google Drive...</em>";
  }
  
  const urlParam = username ? `?username=${encodeURIComponent(username)}` : "";
  const fetchUrl = `${GOOGLE_DOCS_API_URL}${urlParam}`;
  
  try {
    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    if (data && data.text) {
      // 1. Render core layout text
      nutritionDisp.innerHTML = data.text.replace(/\n/g, "<br>");
      
      // 2. Append images neatly below text if present
      if (data.images && data.images.length > 0) {
        const imageContainer = document.createElement('div');
        imageContainer.style.marginTop = '20px';
        imageContainer.style.display = 'flex';
        imageContainer.style.flexDirection = 'column';
        imageContainer.style.gap = '15px';
        imageContainer.style.alignItems = 'center';
        
        data.images.forEach(imgData => {
          const imgTag = document.createElement('img');
          imgTag.src = imgData.dataUri;
          imgTag.alt = imgData.altText || "Nutrition Plan Image";
          imgTag.title = imgData.title || "";
          imgTag.style.maxWidth = '100%';
          imgTag.style.height = 'auto';
          imgTag.style.borderRadius = '8px';
          imgTag.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          
          imageContainer.appendChild(imgTag);
        });
        
        nutritionDisp.appendChild(imageContainer);
      }
    } else if (data && data.message) {
      nutritionDisp.innerHTML = `<span style='color: orange;'>${data.message}</span>`;
    } else {
      nutritionDisp.innerHTML = "<span style='color: orange;'>Nutrition plan text container is empty.</span>";
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
