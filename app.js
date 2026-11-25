const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxwFu09velerANm9ZuV8vjBFzOhEVuJ1SgqavBEBIMe2ELHLFVZWbRiOTclXzPmD56e/exec";
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzCqCk9fmNXAwLgpHYPSbixHky2vJuabT4H1-WhjWzuHLW2cXMsiOvKE_RchAHp-bEA/exec"; 
const GOOGLE_DOCS_API_URL = "https://script.google.com/macros/s/AKfycbwMiFc9utMC56DxxgSvJfT8usYSL4kAT0XgURxbVwr0YoWKhEadmuXpcBy-uKMi-l_N/exec";

let isLoginMode = true;

document.addEventListener("DOMContentLoaded", () => {
  checkLocalProfile();
  populateSessionDates();
});

// =========================================================================
// 1. DASHBOARD & PROFILE INITIALIZATION
// =========================================================================
function setupDashboardView(id, name, username) {
  const authCard = document.getElementById("auth-card");
  const dashView = document.getElementById("dashboard-view");
  
  if (authCard) authCard.style.display = "none";
  if (dashView) dashView.style.display = "block";
  
  const dispName = document.getElementById("display-name") || document.getElementById("user-display-name");
  if (dispName) dispName.innerText = name;

  loadNutritionTracker();
  loadHistoryLog();
  syncHistoryFromCloud();
}

function checkLocalProfile() {
  const currentId = localStorage.getItem("iron_pulse_id");
  const currentName = localStorage.getItem("iron_pulse_name");
  const currentUsername = localStorage.getItem("iron_pulse_username");

  if (currentId && currentName && currentUsername) {
    setupDashboardView(currentId, currentName, currentUsername);
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

// =========================================================================
// 2. AUTHENTICATION (SIGN IN & SIGN UP)
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

  if (isLoginMode) {
    try {
      const loginUrl = `${GOOGLE_API_URL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(loginUrl, { method: 'GET' });
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
  } else {
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
      const response = await fetch(regUrl, { method: 'GET' });
      const result = await response.json();

      if (result.success) {
        alert("Account created securely! You can now log in.");
        if (nameElem) nameElem.value = "";
        if (emailElem) emailElem.value = "";
        passwordElem.value = "";
        
        const toggleBtn = document.getElementById("toggle-auth-btn");
        if (toggleBtn) toggleBtn.click();
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
// 3. FORMATTED GOOGLE DOCS & SHEETS RENDERER
// =========================================================================
function renderFormattedContent(result, displayContainer) {
  if (result && result.html) {
    displayContainer.innerHTML = `<div class="google-formatted-wrapper" style="background: #ffffff; color: #1f2328; padding: 16px; border-radius: 8px; overflow-x: auto;">${result.html}</div>`;

    const checkboxes = displayContainer.querySelectorAll('input[type="checkbox"][data-sheet-id]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', async (e) => {
        const target = e.target;
        const sheetId = target.getAttribute('data-sheet-id');
        const sheetName = target.getAttribute('data-sheet-name');
        const row = target.getAttribute('data-row');
        const col = target.getAttribute('data-col');
        const checked = target.checked;

        try {
          await fetch(`${GOOGLE_API_URL}?action=toggleCheckbox&sheetId=${encodeURIComponent(sheetId)}&sheetName=${encodeURIComponent(sheetName)}&row=${row}&col=${col}&checked=${checked}`);
        } catch (cbErr) {
          console.error("Failed to sync checkbox:", cbErr);
          target.checked = !checked;
        }
      });
    });
  } else if (result.type === "sheet") {
    renderGoogleSheet(result, displayContainer);
  } else {
    renderDocumentElements(displayContainer, result.elements || result.sections);
  }
}

function renderGoogleSheet(data, containerElement) {
  if (data && data.html) {
    renderFormattedContent(data, containerElement);
    return;
  }

  let html = `<h3 style="margin-bottom: 12px;">${data.title || "Sheet"}</h3>
    <div style="overflow-x: auto;">
      <table border="1" style="width: 100%; border-collapse: collapse;">`;

  (data.rows || []).forEach((row, rowIndex) => {
    html += "<tr>";
    row.forEach((cell, colIndex) => {
      if (rowIndex === 0) {
        html += `<th style="padding: 8px; text-align: left;">${cell}</th>`;
      } else if (cell === "TRUE" || cell === "FALSE") {
        const checkedAttr = cell === "TRUE" ? "checked" : "";
        html += `<td style="padding: 8px; text-align: center;">
          <input type="checkbox" ${checkedAttr} style="width: 18px; height: 18px; cursor: pointer;"
            onchange="toggleSheetCheckbox('${data.sheetId}', '${data.sheetName}', ${rowIndex + 1}, ${colIndex + 1}, this.checked)">
        </td>`;
      } else {
        html += `<td style="padding: 8px;">${cell}</td>`;
      }
    });
    html += "</tr>";
  });

  html += "</table></div>";
  containerElement.innerHTML = html;
}

function toggleSheetCheckbox(sheetId, sheetName, row, col, isChecked) {
  const url = `${GOOGLE_API_URL}?action=toggleCheckbox&sheetId=${encodeURIComponent(sheetId)}&sheetName=${encodeURIComponent(sheetName)}&row=${row}&col=${col}&checked=${isChecked}`;

  fetch(url)
    .then(res => res.json())
    .then(response => {
      if (response.status !== "success") {
        alert("Could not save checkbox: " + response.message);
}
})
.catch(err => console.error("Checkbox sync error:", err));
}
function renderDocumentElements(container, elements) {
container.innerHTML = "";
if (!elements || elements.length === 0) {
container.innerHTML = "Document is currently empty. Contact your coach!";
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
img.src = el.content && el.content.dataUri ? el.content.dataUri : data:${el.mimeType};base64,${el.data};
img.style.maxWidth = "100%";
img.style.borderRadius = "8px";
img.style.margin = "12px 0";
img.style.display = "block";
container.appendChild(img);
}
});
}
// =========================================================================
// 4. MODAL CONTROLLERS & DOCUMENT STREAMING
// =========================================================================
async function loadDocumentStreamIntoElement(docType, displayContainer) {
const username = localStorage.getItem("iron_pulse_username");
try {
const response = await fetch(${GOOGLE_API_URL}?action=fetchDoc&username=${encodeURIComponent(username)}&docType=${docType});
const result = await response.json();
if (result.status === "success" || result.success === true) {
renderFormattedContent(result, displayContainer);
} else {
displayContainer.innerHTML = <p class='error-text' style='color: #ff4757;'>Info: ${result.message || "Unknown error occurred."}</p>;
}
} catch (err) {
console.error(Streaming infrastructure connection issue for ${docType}:, err);
displayContainer.innerHTML = <p class='error-text' style='color: #ff4757;'>Failed to establish data link to document stream server.</p>;
}
}
function openWorkoutModal() {
const modal = document.getElementById("workout-modal");
const displayContainer = document.getElementById("workout-modal-display");
if (!modal || !displayContainer) return;
modal.style.display = "flex";
displayContainer.innerHTML = "Streaming your custom training splits out of Google Drive...";
loadDocumentStreamIntoElement("workout", displayContainer);
}
function closeWorkoutModal() {
const modal = document.getElementById("workout-modal");
if (modal) modal.style.display = "none";
}
function openAssessmentModal() {
const modal = document.getElementById("assessment-modal");
const displayContainer = document.getElementById("assessment-modal-display");
if (!modal || !displayContainer) return;
modal.style.display = "flex";
displayContainer.innerHTML = "Retrieving your biometric milestone data from Google Drive...";
loadDocumentStreamIntoElement("assessment", displayContainer);
}
function closeAssessmentModal() {
const modal = document.getElementById("assessment-modal");
if (modal) modal.style.display = "none";
}
function openNutritionModal() {
const modal = document.getElementById("nutrition-modal");
const displayContainer = document.getElementById("nutrition-modal-display");
if (!modal || !displayContainer) return;
modal.style.display = "flex";
displayContainer.innerHTML = "Streaming your unique nutrition blueprint out of Google Drive...";
loadDocumentStreamIntoElement("nutrition", displayContainer);
}
function closeNutritionModal() {
const modal = document.getElementById("nutrition-modal");
if (modal) modal.style.display = "none";
}
async function loadAssessmentPlan() {
const displayContainer = document.getElementById("assessment-display");
if (!displayContainer) return;
displayContainer.innerHTML = "Retrieving recent biometric milestone metrics...";
loadDocumentStreamIntoElement("assessment", displayContainer);
}
// =========================================================================
// 5. CLASS & INDIVIDUAL SESSION BOOKING
// =========================================================================
const bookingSection = document.getElementById('booking-section');
if (bookingSection) {
bookingSection.addEventListener('click', function(event) {
if (event.target && event.target.classList.contains('book-btn')) {
const button = event.target;
const originalText = button.textContent;
button.textContent = "Booking...";
button.disabled = true;
try {
const classItem = button.closest('.class-item');
const className = classItem.querySelector('h3').textContent.trim();
let targetDayNum = 2;
if (className.toLowerCase().includes("wednesday")) {
targetDayNum = 3;
} else if (className.toLowerCase().includes("shred")) {
targetDayNum = 4;
} else if (className.toLowerCase().includes("saturday")) {
targetDayNum = 6;
}
const bookingDate = new Date();
const currentDayNum = bookingDate.getDay();
let daysUntilClass = targetDayNum - currentDayNum;
if (daysUntilClass <= 0) daysUntilClass += 7;
bookingDate.setDate(bookingDate.getDate() + daysUntilClass);
if (targetDayNum === 6) {
bookingDate.setHours(11, 0, 0, 0);
} else if (className.toLowerCase().includes("wednesday")) {
bookingDate.setHours(18, 30, 0, 0);
} else {
bookingDate.setHours(18, 0, 0, 0);
}
const endDate = new Date(bookingDate.getTime() + (60 * 60 * 1000));
const memberName = localStorage.getItem('iron_pulse_name') || 'Gym Member';
const memberEmail = localStorage.getItem('iron_pulse_username') || 'member@example.com';
const memberId = localStorage.getItem('iron_pulse_id') || 'ID-TEMP';
const payload = {
action: 'bookClass',
name: memberName,
email: memberEmail,
memberId: memberId,
className: className,
startTime: bookingDate.toISOString(),
endTime: endDate.toISOString()
};
fetch(GOOGLE_APPS_SCRIPT_URL, {
method: 'POST',
mode: 'cors',
headers: { 'Content-Type': 'text/plain;charset=utf-8' },
body: JSON.stringify(payload)
})
.then(response => response.json())
.then(result => {
if (result.status === "success") {
button.textContent = "Booked! ✓";
saveToHistoryLog(className, "Group", bookingDate.toISOString());
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
}
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
const startDateTime = new Date(${chosenDate}T${chosenTime}:00);
const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000));
const memberName = localStorage.getItem('iron_pulse_name') || 'Gym Member';
const memberEmail = localStorage.getItem('iron_pulse_username') || 'member@example.com';
const memberId = localStorage.getItem('iron_pulse_id') || 'ID-TEMP';
const payload = {
action: 'bookSession',
name: memberName,
email: memberEmail,
memberId: memberId,
className: Gym Session (${memberId}),
startTime: startDateTime.toISOString(),
endTime: endDateTime.toISOString()
};
fetch(GOOGLE_API_URL, {
method: 'POST',
mode: 'cors',
headers: { 'Content-Type': 'text/plain;charset=utf-8' },
body: JSON.stringify(payload)
})
.then(response => response.json())
.then(result => {
if (result.status === "success") {
handleBookingSuccess(bookBtn, originalText, dateInput, timeSelect);
saveToHistoryLog(Gym Session (${memberId}), "Individual", startDateTime.toISOString());
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
function populateSessionDates() {
const dateSelect = document.getElementById("session-date");
if (!dateSelect) return;
dateSelect.innerHTML = 'Choose a date...';
const today = new Date();
for (let i = 0; i < 14; i++) {
const futureDate = new Date(today);
futureDate.setDate(today.getDate() + i);
const year = futureDate.getFullYear();
const month = String(futureDate.getMonth() + 1).padStart(2, '0');
const day = String(futureDate.getDate()).padStart(2, '0');
const isoValue = ${year}-${month}-${day};
const readableLabel = futureDate.toLocaleDateString('en-CA', {
weekday: 'short',
month: 'short',
day: 'numeric'
});
const option = document.createElement("option");
option.value = isoValue;
option.textContent = i === 0 ? Today (${readableLabel}) : readableLabel;
dateSelect.appendChild(option);
}
}
// =========================================================================
// 6. SESSION HISTORY LOG & NUTRITION TRACKER
// =========================================================================
function getHistoryLogKey() {
const user = localStorage.getItem("iron_pulse_username") || "anon";
return iron_pulse_history_${user.replace(/[^a-zA-Z0-9]/g, '')};
}
function getTrackerDateKey() {
const user = localStorage.getItem("iron_pulse_username") || "anon";
const today = new Date().toLocaleDateString('en-CA');
return iron_pulse_nutrition_${user.replace(/[^a-zA-Z0-9]/g, '')}_${today};
}
function loadHistoryLog() {
const displayContainer = document.getElementById("history-log-display");
const groupCountEl = document.getElementById("group-count");
const individualCountEl = document.getElementById("individual-count");
if (!displayContainer) return;
const historyData = JSON.parse(localStorage.getItem(getHistoryLogKey())) || [];
displayContainer.innerHTML = "";
let groupCount = 0;
let individualCount = 0;
if (historyData.length === 0) {
displayContainer.innerHTML = <p class="empty-text" style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 10px 0;">No sessions recorded for this profile yet.</p>;
if (groupCountEl) groupCountEl.textContent = "0";
if (individualCountEl) individualCountEl.textContent = "0";
return;
}
historyData.forEach(item => {
if (item.type === "Group") groupCount++;
if (item.type === "Individual") individualCount++;
const eventDate = new Date(item.timestamp);
const formattedDate = eventDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
const formattedTime = eventDate.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
const logItem = document.createElement("div");
logItem.className = "class-item";
logItem.style.background = "rgba(255,255,255,0.02)";
logItem.style.padding = "10px";
logItem.style.borderRadius = "6px";
logItem.style.marginBottom = "4px";
logItem.style.borderLeft = item.type === "Individual" ? "3px solid var(--accent-color)" : "3px solid #28a745";
logItem.innerHTML = `

${item.name}
\({formattedDate} • \){formattedTime} • Verified Slot
${item.type}
`;
displayContainer.appendChild(logItem);
});
if (groupCountEl) groupCountEl.textContent = groupCount;
if (individualCountEl) individualCountEl.textContent = individualCount;
}
function saveToHistoryLog(sessionName, typeLabel, scheduledStartISO = "") {
const key = getHistoryLogKey();
const currentHistory = JSON.parse(localStorage.getItem(key)) || [];
const nowISO = new Date().toISOString();
currentHistory.unshift({
name: sessionName,
type: typeLabel,
timestamp: nowISO
});
localStorage.setItem(key, JSON.stringify(currentHistory));
loadHistoryLog();
syncDataToGoogleSheets({
action: "logSessionHistory",
memberId: localStorage.getItem("iron_pulse_id") || "ID-TEMP",
name: localStorage.getItem("iron_pulse_name") || "Gym Member",
username: localStorage.getItem("iron_pulse_username") || "anon",
sessionName: sessionName,
sessionType: typeLabel,
scheduledStart: scheduledStartISO ? new Date(scheduledStartISO).toLocaleString() : new Date(nowISO).toLocaleString()
});
}
function loadNutritionTracker() {
const listContainer = document.getElementById("meal-log-list");
const totalDisplay = document.getElementById("total-calories");
if (!listContainer || !totalDisplay) return;
const savedData = JSON.parse(localStorage.getItem(getTrackerDateKey())) || [];
listContainer.innerHTML = "";
let totalCals = 0;
savedData.forEach(item => {
totalCals += item.calories;
const itemRow = document.createElement("div");
itemRow.style.display = "flex";
itemRow.style.justifyContent = "space-between";
itemRow.style.fontSize = "0.85rem";
itemRow.style.padding = "6px 0";
itemRow.style.borderBottom = "1px solid #ffffff05";
itemRow.innerHTML = <span style="color: var(--text-muted);"><strong style="color: var(--accent-color); font-size: 0.75rem;">[${item.type}]</strong> ${item.description}</span> <span style="font-weight: bold;">${item.calories} kcal</span>;
listContainer.appendChild(itemRow);
});
totalDisplay.textContent = totalCals;
}
function addMealLog() {
const typeSelect = document.getElementById("meal-type");
const descInput = document.getElementById("meal-desc");
const calsInput = document.getElementById("meal-cals");
if (!descInput || !calsInput || !descInput.value.trim() || !calsInput.value) {
alert("Please provide a food description and accurate calories.");
return;
}
const mealType = typeSelect.value;
const description = descInput.value.trim();
const calories = parseInt(calsInput.value, 10);
const dateKey = getTrackerDateKey();
const currentLogs = JSON.parse(localStorage.getItem(dateKey)) || [];
currentLogs.push({ type: mealType, description: description, calories: calories });
localStorage.setItem(dateKey, JSON.stringify(currentLogs));
descInput.value = "";
calsInput.value = "";
loadNutritionTracker();
syncDataToGoogleSheets({
action: "logNutrition",
memberId: localStorage.getItem("iron_pulse_id") || "ID-TEMP",
name: localStorage.getItem("iron_pulse_name") || "Gym Member",
username: localStorage.getItem("iron_pulse_username") || "anon",
mealType: mealType,
description: description,
calories: calories
});
}
function resetNutritionTracker() {
if (confirm("Are you sure you want to clear your calories for today?")) {
localStorage.removeItem(getTrackerDateKey());
loadNutritionTracker();
}
}
function syncDataToGoogleSheets(payload) {
fetch(GOOGLE_API_URL, {
method: 'POST',
mode: 'cors',
headers: { 'Content-Type': 'text/plain;charset=utf-8' },
body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log(Synced ${payload.action} to Google Sheets:, data))
.catch(err => console.warn(Handled redirect during ${payload.action} sync:, err));
}
async function syncHistoryFromCloud() {
const username = localStorage.getItem("iron_pulse_username");
if (!username) return;
try {
const fetchUrl = ${GOOGLE_API_URL}?action=fetchHistory&username=${encodeURIComponent(username)};
const response = await fetch(fetchUrl, { method: 'GET' });
const data = await response.json();
if (data.status === "success") {
if (Array.isArray(data.sessions)) {
localStorage.setItem(getHistoryLogKey(), JSON.stringify(data.sessions));
loadHistoryLog();
}
if (Array.isArray(data.nutrition)) {
localStorage.setItem(getTrackerDateKey(), JSON.stringify(data.nutrition));
loadNutritionTracker();
}
}
} catch (err) {
console.warn("Cloud history sync skipped (using local cache):", err);
}
}
function secureLogout() {
localStorage.removeItem("iron_pulse_id");
localStorage.removeItem("iron_pulse_name");
localStorage.removeItem("iron_pulse_username");
window.location.reload();
}
async function deleteMemberAccount() {
const username = localStorage.getItem("iron_pulse_username");
if (!username) return;
if (!confirm("Are you sure you want to permanently delete your account? This will remove your profile and log you out.")) return;
const deleteBtn = document.getElementById("delete-account-btn");
if (deleteBtn) {
deleteBtn.innerText = "Deleting Account...";
deleteBtn.disabled = true;
}
try {
const deleteUrl = ${GOOGLE_API_URL}?action=deleteUser&username=${encodeURIComponent(username)};
const response = await fetch(deleteUrl, { method: 'GET' });
const result = await response.json();
if (result.success) {
localStorage.removeItem(getHistoryLogKey());
localStorage.removeItem(getTrackerDateKey());
localStorage.removeItem("iron_pulse_id");
localStorage.removeItem("iron_pulse_name");
localStorage.removeItem("iron_pulse_username");
alert("Your account has been permanently deleted.");
window.location.reload();
} else {
alert("Error deleting account: " + (result.message || "Please contact your trainer."));
if (deleteBtn) {
deleteBtn.innerText = "Delete Account & Data";
deleteBtn.disabled = false;
}
}
} catch (err) {
console.error("Account deletion error:", err);
alert("Connection error while trying to delete account.");
if (deleteBtn) {
deleteBtn.innerText = "Delete Account & Data";
deleteBtn.disabled = false;
}
}
}
// =========================================================================
// 7. GLOBAL WINDOW EXPORTS FOR INLINE ONCLICK HANDLERS
// =========================================================================
window.handleAuthAction = handleAuthAction;
window.toggleAuthMode = toggleAuthMode;
window.openWorkoutModal = openWorkoutModal;
window.closeWorkoutModal = closeWorkoutModal;
window.openAssessmentModal = openAssessmentModal;
window.closeAssessmentModal = closeAssessmentModal;
window.openNutritionModal = openNutritionModal;
window.closeNutritionModal = closeNutritionModal;
window.loadAssessmentPlan = loadAssessmentPlan;
window.bookIndividualSession = bookIndividualSession;
window.toggleSheetCheckbox = toggleSheetCheckbox;
window.addMealLog = addMealLog;
window.resetNutritionTracker = resetNutritionTracker;
window.secureLogout = secureLogout;
window.deleteMemberAccount = deleteMemberAccount;
