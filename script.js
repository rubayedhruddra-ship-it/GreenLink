// =========================
// INDEX PAGE 
// =========================
if (document.body.id === "index-page") {
  const slideshowText = document.getElementById("slideshow-text");
  if (slideshowText) {
    const texts = ["Greener", "Smarter", "Sustainable Community"];
    let index = 0;

    setInterval(() => {
      index = (index + 1) % texts.length;
      slideshowText.textContent = texts[index];
    }, 1500);
  }
}

// =========================
// HOME SLIDESHOW
// =========================
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.slider-container');
  if (!container) return;
  const slides = Array.from(container.querySelectorAll('.slider .slide'));
  if (!slides.length) return;
  let current = 0;
  slides.forEach((s, i) => { s.classList.toggle('show', i === 0); });

  function showSlide(next) {
    if (next === current) return;
    slides[current].classList.remove('show');
    slides[next].classList.add('show');
    current = next;
  }

  let timer = setInterval(() => { showSlide((current + 1) % slides.length); }, 4000);

  container.addEventListener('mouseenter', () => { clearInterval(timer); });
  container.addEventListener('mouseleave', () => { timer = setInterval(() => { showSlide((current + 1) % slides.length); }, 4000); });
});

// =========================
// LOGIN PAGE
// =========================
  document.addEventListener("DOMContentLoaded", () => {
  // --- PASSWORD VISIBILITY TOGGLE ---
  const toggle = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (toggle && passwordInput) {
    toggle.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";

      // Toggle icon and animation class
      toggle.classList.toggle("fa-eye");
      toggle.classList.toggle("fa-eye-slash");
      toggle.classList.toggle("active");

      // Update ARIA label (accessibility)
      toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");

      // Optional: quick visual feedback (small glow pulse)
      toggle.style.textShadow = isPassword
        ? "0 0 8px rgba(60,146,60,0.7)"
        : "0 0 0 transparent";

      setTimeout(() => toggle.style.textShadow = "none", 300);
    });
  }

  // --- LOGIN FORM SUBMIT HANDLER ---
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = {
        username: f.get("username"),
        password: f.get("password")
      };

      try {
        const res = await fetch("api/login.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const j = await res.json();
        if (j.success) {
          window.location.href = "home.php";
        } else {
          alert(j.error || "Login failed");
        }
      } catch (err) {
        alert("Network or server error");
        console.error(err);
      }
    });
  }

});


// =========================
// SIGNUP PAGE
// =========================
// === Password toggle logic for both login and signup ===
document.addEventListener("DOMContentLoaded", () => {

  // === Password Visibility Toggle ===
  const toggles = document.querySelectorAll(".pw-toggle");

  toggles.forEach(toggle => {
    const targetId = toggle.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;

    const updateIcon = () => {
      const isPwd = input.type === "password";
      toggle.classList.toggle("fa-eye", isPwd);
      toggle.classList.toggle("fa-eye-slash", !isPwd);
      toggle.classList.toggle("active", !isPwd);
    };

    const toggleFn = () => {
      const isPwd = input.type === "password";
      input.type = isPwd ? "text" : "password";
      updateIcon();
      toggle.style.textShadow = isPwd
        ? "0 0 8px rgba(60,146,60,0.7)"
        : "none";
      setTimeout(() => (toggle.style.textShadow = "none"), 300);
    };

    toggle.addEventListener("click", toggleFn);
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggleFn();
      }
    });

    updateIcon();
  });

  // === Form Submit Handler ===
  const form = document.getElementById("signupForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);

      if (f.get("password") !== f.get("confirm")) {
        alert("Passwords do not match");
        return;
      }

      const payload = {
        name: f.get("name"),
        email: f.get("email"),
        username: f.get("username"),
        password: f.get("password")
      };

      try {
        const res = await fetch("api/register.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const j = await res.json();
        if (j.success) {
          window.location.href = "home.php";
        } else {
          alert(j.error || "Registration failed");
        }
      } catch (err) {
        alert("Network or server error");
        console.error(err);
      }
    });
  }

  // === Leaf Animation ===
  const signupBtn = document.querySelector(".signup-btn");
  if (signupBtn) {
    const leafContainer = signupBtn.querySelector(".leaf-container");

    signupBtn.addEventListener("click", () => {
      for (let i = 0; i < 10; i++) {
        const leaf = document.createElement("span");
        leaf.classList.add("leaf");
        leaf.textContent = "🍃";
        const angle = Math.random() * 2 * Math.PI;
        const distance = 60 + Math.random() * 40;
        const x = Math.cos(angle) * distance + "px";
        const y = Math.sin(angle) * distance + "px";
        leaf.style.setProperty("--x", x);
        leaf.style.setProperty("--y", y);
        leafContainer.appendChild(leaf);
        setTimeout(() => leaf.remove(), 1000);
      }
    });
  }

});