// 1. Your Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = "https://google.com";

// Global variable to keep track of the logged-in member's ID
let activeMemberId = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check if a member is already logged in from a previous session
  checkSession();

  const loginForm = document.getElementById("login-form");
  const regForm = document.getElementById("reg-form");

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault(); 
      const email = document.getElementById("login-email").value;
      const submitBtn = loginForm.querySelector(".action-btn");
      
      submitBtn.disabled = true;
      submitBtn.innerText = "Verifying...";

      sendToGoogle({ action: "login", email: email }, loginForm);
    });
  }

  // Handle Registration Form Submission
  if (regForm) {
    regForm.addEventListener("submit", (event) => {
      event.preventDefault(); 
      const name = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
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

// 2. Network function to send requests via safe GET parameters
function sendToGoogle(payload, formElement) {
  let queryParams = new URLSearchParams(payload).toString();
  let finalUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

  fetch(finalUrl, {
    method: "GET",
    mode: "cors"
  })
  .then(response => {
    if (!response.ok) throw new Error("Server communication failure: " + response.status);
    return response.json();
  })
  .then(data => {
    const submitBtn = formElement.querySelector(".action-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = formElement.id === "login-form" ? "Sign In" : "Register Account";
    }

    if (data.status === "success") {
      saveSession(data.memberId, data.name);
      loadDashboard(data.memberId, data.name);
    } else {
      alert("Error: " + data.message);
    }
  })
  .catch(error => {
    console.error("Database connection fault:", error);
    alert("Connection Error Diagnostic:\n" + error.toString());
    const submitBtn = formElement.querySelector(".action-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = formElement.id === "login-form" ? "Sign In" : "Register Account";
    }
  });
}

// 3. Class Booking Logic (Passing the HTML button explicitly to prevent mobile Safari crashes)
function handleBooking(className) {
  if (!activeMemberId) {
    alert("Please sign into your profile to book gym classes.");
    return;
  }

  // Safely find the exact button that clicked this function without using global window events
  const btn = window.event ? window.event.target : null;
  let originalText = "Book";
  
  if (btn) {
    originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Booking...";
  }

  const payload = {
    action: "bookClass",
    memberId: activeMemberId,
    className: className
  };

  let queryParams = new URLSearchParams(payload).toString();
  let finalUrl = GOOGLE_APPS_SCRIPT_URL + "?" + queryParams;

  fetch(finalUrl, {
    method: "GET",
    mode: "cors"
  })
  .then(response => response.json())
  .then(data => {
    if (btn) {
      btn.disabled = false;
      btn.innerText = originalText;
    }

    if (data.status === "success") {
      alert(`Success! You are locked in for "${className}".`);
      if (btn) {
        btn.style.background = "#555";
        btn.innerText = "Reserved";
        btn.disabled = true;
      }
    } else {
      alert("Booking failed: " + data.message);
    }
  })
  .catch(error => {
    if (btn) {
      btn.disabled = false;
      btn.innerText = originalText;
    }
    console.error("Booking error:", error);
    alert("Could not process booking. Check your internet connection.");
  });
}

// 4. View Controllers & Dashboard Handlers
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
    setTimeout(() => { generateBarcode(id); }, 500);
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

// Switches form layouts visually on the screen
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

// 5. Session Memory Hooks
function saveSession(id, name) {
  localStorage.setItem("gym_member_id", id);
  localStorage.setItem("gym_member_name", name);
}

function checkSession() {
  const savedId = localStorage.getItem("gym_member_id");
  const savedName = localStorage.getItem("gym_member_name");
  if (savedId && savedName) {
    // Wrap in a tiny timeout to ensure HTML elements exist before drawing dashboard
    setTimeout(() => { loadDashboard(savedId, savedName); }, 100);
  }
}

function logout() {
  localStorage.clear();
  activeMemberId = null;
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("auth-card").style.display = "block";
  toggleAuthView(false);
}
