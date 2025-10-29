<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenLink</title>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body id="login-page">
  <div class="login-container">
    <div class="login-box">
      <img src="IMG/loginimg.png" alt="Logo" class="logo">
      <h2>Log In</h2>

      <form id="loginForm">
        <div class="input-box">
          <i class="fa fa-user"></i>
          <input type="text" name="username" placeholder="Username" required>
        </div>

       <div class="input-box password-wrapper">
        <i class="fa fa-lock"></i>
        <input type="password" name="password" id="password" placeholder="Password" required autocomplete="current-password">
        <i class="fa fa-eye pw-toggle" id="togglePassword" tabindex="0" aria-label="Show password"></i>
      </div>






        <a href="#" class="forgot">Forget Password</a>

        <button class="login-btn" type="submit">Log In <span class="leaf-container"></span></button>

        <p class="signup">Don’t have an account? <a href="signup.php">Sign Up</a></p>

        <div class="brand"><img src="IMG/ICO1.png" alt="GreenLink Logo"></div>
      </form>
    </div>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const payload = { username: f.get('username'), password: f.get('password') };
      try {
        const res = await fetch('api/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await res.json();
        if (j.success) window.location.href = 'home.php'; else alert(j.error || 'Login failed');
      } catch (err) { alert('Network or server error'); console.error(err); }
    });
  </script>
</body>
<script>
  
  (function () {
  
    document.querySelectorAll('.pw-toggle').forEach(icon => {
      const targetId = icon.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const toggle = () => {
        const isPwd = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPwd ? 'text' : 'password');

       
        icon.classList.remove(isPwd ? 'fa-eye-slash' : 'fa-eye');
        icon.classList.add(isPwd ? 'fa-eye-slash' : 'fa-eye');

  
        const pressed = String(!isPwd);
        icon.setAttribute('aria-pressed', pressed);
        icon.focus({ preventScroll: true });
      };

      icon.addEventListener('click', toggle);

      icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          toggle();
        }
      });

      if (input.getAttribute('type') === 'password') {
        icon.classList.add('fa-eye');
        icon.classList.remove('fa-eye-slash');
        icon.setAttribute('aria-pressed', 'false');
      } else {
        icon.classList.add('fa-eye-slash');
        icon.classList.remove('fa-eye');
        icon.setAttribute('aria-pressed', 'true');
      }
    });

    // Login form submit handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const payload = { username: f.get('username'), password: f.get('password') };
        try {
          const res = await fetch('api/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const j = await res.json();
          if (j.success) window.location.href = 'home.php'; else alert(j.error || 'Login failed');
        } catch (err) { alert('Network or server error'); console.error(err); }
      });
    }
  })();

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pw-toggle').forEach(icon => {
      const targetId = icon.getAttribute('data-target');
      const input = targetId
        ? document.getElementById(targetId)
        : icon.closest('.input-box')?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;

      if (!icon.hasAttribute('role')) icon.setAttribute('role', 'button');
      if (!icon.hasAttribute('tabindex')) icon.setAttribute('tabindex', '0');

      const setState = () => {
        const isPwd = input.type === 'password';
        icon.classList.toggle('fa-eye', isPwd);
        icon.classList.toggle('fa-eye-slash', !isPwd);
        icon.setAttribute('aria-pressed', String(!isPwd));
      };

      const toggle = (ev) => {
        if (ev && ev.preventDefault) ev.preventDefault();
        input.type = input.type === 'password' ? 'text' : 'password';
        setState();
        try { input.focus({ preventScroll: true }); } catch (e) {}
      };

      icon.addEventListener('click', toggle);
      icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          toggle(e);
        }
      });

      // init
      setState();
    });
  });
</script>
</html>
