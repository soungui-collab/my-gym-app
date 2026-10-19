// 1. Your Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

let activeMemberId = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check if member already has a saved profile on their device phone
  checkSession();

  const loginForm = document.getElementById("login-form");
  const regForm = document.getElementById("reg-form");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault(); 
      const email = document.getElementById("login-email").value.trim();
      const submitBtn = loginForm.querySelector(".action-btn");
      
      submitBtn.disabled = true;
      submitBtn.innerText = "Verifying...";
      sendToGoogle({ action: "login", email: email }, loginForm);
    });
  }

  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault(); 
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const memberId = "MBR-" + Date.now(); 

      const submitBtn = regForm.querySelector(".action-btn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Registering...";

      sendToGoogle({
        action: "register",
        memberId: memberId,
        name: name,
        email: email
      }, regForm);
    });
  }
});

// 2. Optimized Network Handler
function sendToGoogle(payload, formElement) {
  const queryParams = new URLSearchParams(payload).toString();
  const finalUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

  fetch(finalUrl, { method: "GET", mode: "cors" })
  .then(response => {
    if (!response.ok) throw new Error("Network status: " + response.status);
    return response.json();
  })
  .then(data => {
    const submitBtn = formElement.querySelector(".action-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = formElement.id === "login-form" ? "Sign In" : "Register Account";
    }

    if (data.status === "success") {
      // Save data locally so they NEVER have to log in on this phone again
      saveSession(data.memberId, data.name);
      loadDashboard(data.memberId, data.name);
    } else {
      alert("Error: " + data.message);
    }
  })
  .catch(error => {
    console.error("Database connection fault:", error);
    alert("Connection Error:\n" + error.toString());
    const submitBtn = formElement.querySelector(".action-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = formElement.id === "login-form" ? "Sign In" : "Register Account";
    }
  });
}

// 3. Class Booking Integration (Fully optimized for device compatibility)
function handleBooking(className) {
  if (!activeMemberId) {
    alert("Please sign into your profile to book gym classes.");
    return;
  }

  // Pure JavaScript target finder (100% compatible with iOS Safari & Android Chrome)
  const btn = document.activeElement;
  let originalText = "Book";
  
  if (btn && btn.classList.contains("book-btn")) {
    originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Booking...";
  }

  const payload = {
    action: "bookClass",
    memberId: activeMemberId,
    className: className
  };

  const queryParams = new URLSearchParams(payload).toString();
  const finalUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

  fetch(finalUrl, { method: "GET", mode: "cors" })
  .then(response => response.json())
  .then(data => {
    if (btn && btn.classList.contains("book-btn")) {
      btn.disabled = false;
      btn.innerText = originalText;
    }

    if (data.status === "success") {
      alert(`Success! You are locked in for "${className}".`);
      if (btn && btn.classList.contains("book-btn")) {
        btn.style.background = "#555";
        btn.innerText = "Reserved";
        btn.disabled = true;
      }
    } else {
      alert("Booking failed: " + data.message);
    }
  })
  .catch(error => {
    if (btn && btn.classList.contains("book-btn")) {
      btn.disabled = false;
      btn.innerText = originalText;
    }
    console.error("Booking error:", error);
    alert("Could not process booking. Check your internet connection.");
  });
}

// 4. View Controllers
function loadDashboard(id, name) {
  activeMemberId = id;
  document.getElementById("auth-card").style.display = "none";
  document.getElementById("dashboard-view").style.display = "block";
  document.getElementById("user-welcome").innerText = "Welcome back, " + name + "!";
  generateBarcode(id);
}

function generateBarcode(id) {
  document.getElementById("member-id-display").innerText = "ID: " + id;
  if (typeof JsBarcode === "undefined") {
    setTimeout(() => { generateBarcode(id); }, 300);
    return;
  }
  JsBarcode("#barcode", id, {
    format: "CODE128",
    lineColor: "#121212",
    width: 2,
    height: 70,
    displayValue: false
  });
}

function toggleAuthView(showRegister) {
  if (showRegister) {
    document.getElementById("auth-title").innerText = "Create Account";
    document.getElementById("login-form").style.display = "none";
    document.getElementById("reg-form").style.display = "block";
  } else {
    document.getElementById("auth-title").innerText = "Member Login";
    document.getElementById("login-form").style.display = "block";
    document.getElementById("reg-form").style.display = "none";
  }
}

// 5. Device-Level Memory Cache
function saveSession(id, name) {
  localStorage.setItem("gym_member_id", id);
  localStorage.setItem("gym_member_name", name);
}

function checkSession() {
  const savedId = localStorage.getItem("gym_member_id");
  const savedName = localStorage.getItem("gym_member_name");
  if (savedId && savedName) {
    // Instantly inject data onto screen without hitches
    activeMemberId = savedId;
    window.addEventListener("load", () => {
      loadDashboard(savedId, savedName);
    });
  }
}

function logout() {
  localStorage.clear();
  activeMemberId = null;
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("auth-card").style.display = "block";
  toggleAuthView(false);
}
