// signup-login.js — unified logic for signup & login pages
const form = document.getElementById('signupForm') || document.getElementById('loginForm');
const toggle = document.getElementById('toggleEye');
const pass = document.getElementById('password');

// Toggle password visibility
if (toggle && pass) {
  toggle.addEventListener('click', () => {
    const isPwd = pass.type === 'password';
    pass.type = isPwd ? 'text' : 'password';
    toggle.textContent = isPwd ? 'Hide' : 'Show';
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const isSignup = form.id === 'signupForm';

    // Basic validation
    if (!data.email || !data.password || (isSignup && !data.username)) {
      alert('Please fill in all fields.');
      return;
    }
    if (!isValidEmail(data.email)) {
      alert('Please enter a valid email.');
      return;
    }
    if (data.password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }

    try {
      const url = isSignup
        ? "http://localhost:8080/api/users/signup"
        : "http://localhost:8080/api/users/login";

      const payload = isSignup
        ? { username: data.username, email: data.email, password: data.password }
        : { email: data.email, password: data.password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let result;
      const text = await res.text();
      try { result = JSON.parse(text); } catch { result = { message: text }; }

      console.log("🔹 Backend response:", result);

      if (res.ok) {
        if (isSignup) {
          alert("✅ Signup successful! You can now log in.");
          window.location.href = "login.html";
        } else {
          // Store logged-in info
          localStorage.setItem("userId", result.id);
          localStorage.setItem("username", result.username);
          localStorage.setItem("email", result.email);

          // 👑 Admin redirect logic
          const isAdmin =
            result.email?.toLowerCase() === "admin@admin.com" &&
            data.password === "bookstore";

          alert("✅ Login successful!");
          window.location.href = isAdmin ? "booklist.html" : "index.html";
        }
      } else {
        alert(`❌ ${result.message || 'Invalid credentials'}`);
      }

    } catch (err) {
      console.error("⚠️ Error connecting to backend:", err);
      alert("⚠️ Could not reach server. Is backend running?");
    }
  });
}

// Navigation helpers
function goLogin() { window.location.href = 'login.html'; }
function goSignup() { window.location.href = 'signup.html'; }
function goBack() { window.history.back(); }