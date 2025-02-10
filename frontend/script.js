const API_URL = "http://localhost:5000";
let token = localStorage.getItem("token");
let debounceTimer;

// Clear input fields
function clearInputs() {
  document.getElementById("signup-username").value = "";
  document.getElementById("signup-password").value = "";
}
function clearLoginInputs() {
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}
// Sign Up Function
function signup() {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;

  fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Sign-up successful! Now login.");
      clearInputs();
    })
    .catch((err) => console.error("Sign-up error:", err));
}

// Login Function
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token) {
        token = data.token;
        localStorage.setItem("token", token);
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("app").style.display = "block";
        clearLoginInputs();
      } else {
        alert("Login failed!");
      }
    });
}
function checkGrammarLive() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const text = document.getElementById("text-input").value;
    if (!text.trim()) {
      document.getElementById("output").innerHTML = "";
      document.getElementById("corrected-output").innerText = "";
      return;
    }

    fetch(`${API_URL}/check-grammar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.highlighted) {
          document.getElementById("output").innerHTML = data.highlighted;
        }
        if (data.corrected) {
          document.getElementById("corrected-output").innerText =
            data.corrected;
        }
      })
      .catch((err) => console.error("Error checking grammar:", err));
  }, 500);
}
document
  .getElementById("text-input")
  .addEventListener("input", checkGrammarLive);
function logout() {
  localStorage.removeItem("token");
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("app").style.display = "none";
  document.getElementById("text-input").value = "";
  document.getElementById("output").innerHTML = "";
  document.getElementById("corrected-output").innerText = "";
}
