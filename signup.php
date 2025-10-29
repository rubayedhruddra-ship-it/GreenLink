<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up - GreenLink</title>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body id="signup-page">
  <div class="signup-container">
    <div class="signup-box">
      <h2>Sign Up</h2>

      <form id="signupForm">
        <div class="input-box">
          <i class="fa fa-user"></i>
          <input name="name" placeholder="Enter your full name" required>
        </div>

        <div class="input-box">
          <i class="fa fa-envelope"></i>
          <input name="email" type="email" placeholder="Email Address" required>
        </div>

        <div class="input-box">
          <i class="fa fa-at"></i>
          <input name="username" placeholder="Username" required>
        </div>

        <!-- Password field -->
        <div class="input-box">
          <i class="fa fa-lock"></i>
          <input type="password" name="password" id="password" placeholder="Enter Password" required>
          <i id="pwToggle1" class="fa fa-eye pw-toggle" data-target="password" role="button" tabindex="0" aria-label="Toggle password visibility"></i>
        </div>

        <!-- Confirm Password -->
        <div class="input-box">
          <i class="fa fa-lock"></i>
          <input type="password" name="confirm" id="confirmPassword" placeholder="Confirm Password" required>
          <i id="pwToggle2" class="fa fa-eye pw-toggle" data-target="confirmPassword" role="button" tabindex="0" aria-label="Toggle confirm password visibility"></i>
        </div>

        <button class="signup-btn" type="submit">Sign Up <span class="leaf-container"></span></button>
        <p class="login-link">Already have an account? <a href="login.php">Log In</a></p>
      </form>

      <div class="brand"><img src="IMG/ICO1.png" alt="GreenLink Logo"></div>
    </div>
  </div>

  <script src="script.js"></script>
</body>

<script>
  // --- Password visibility toggle (fixed) ---
  // This replaces the previous broken handler: the .pw-toggle element is the icon itself,
  // so we toggle classes on that element and the target input.
  (function () {
    document.querySelectorAll('.pw-toggle').forEach(btn => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const icon = btn; // the <i> element
      // initialise icon state to match input.type
      const initState = () => {
        if (input.type === 'password') {
          icon.classList.add('fa-eye');
          icon.classList.remove('fa-eye-slash');
          icon.setAttribute('aria-pressed', 'false');
          icon.classList.remove('active');
        } else {
          icon.classList.add('fa-eye-slash');
          icon.classList.remove('fa-eye');
          icon.setAttribute('aria-pressed', 'true');
          icon.classList.add('active');
        }
      };

      const toggle = (ev) => {
        if (ev && ev.preventDefault) ev.preventDefault();
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';

        if (isPwd) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
          icon.classList.add('active');
          icon.setAttribute('aria-pressed', 'true');
        } else {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
          icon.classList.remove('active');
          icon.setAttribute('aria-pressed', 'false');
        }

        // keep focus for accessibility
        try { icon.focus({ preventScroll: true }); } catch (e) {}
      };

      // click + keyboard support
      icon.addEventListener('click', toggle);
      icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          toggle(e);
        }
      });

      initState();
    });
  })();

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pw-toggle').forEach(icon => {
      const targetId = icon.getAttribute('data-target');
      const input = targetId ? document.getElementById(targetId) : icon.closest('.input-box')?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;

      // ensure accessible attributes
      if (!icon.hasAttribute('role')) icon.setAttribute('role', 'button');
      if (!icon.hasAttribute('tabindex')) icon.setAttribute('tabindex', '0');

      const updateIcon = () => {
        const isPwd = input.type === 'password';
        icon.classList.toggle('fa-eye', isPwd);
        icon.classList.toggle('fa-eye-slash', !isPwd);
        icon.classList.toggle('active', !isPwd);
        icon.setAttribute('aria-pressed', String(!isPwd));
      };

      const doToggle = (ev) => {
        if (ev && ev.preventDefault) ev.preventDefault();
        input.type = (input.type === 'password') ? 'text' : 'password';
        updateIcon();
        try { input.focus({ preventScroll: true }); } catch (e) {}
      };

      icon.addEventListener('click', doToggle);
      icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          doToggle(e);
        }
      });

      // initialize state to match current input.type
      updateIcon();
    });
  });
</script>

</html>
