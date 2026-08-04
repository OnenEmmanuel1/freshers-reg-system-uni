/**
 * Client JavaScript: Authentication (Login / Signup)
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('hfrsLoginForm');
  const signupForm = document.getElementById('hfrsSignupForm');
  const alertContainer = document.getElementById('hfrsAuthAlert');

  function showAlert(message, type = 'danger') {
    if (!alertContainer) return;
    alertContainer.className = `hfrs-alert hfrs-alert-${type}`;
    alertContainer.innerHTML = `<span>${message}</span>`;
    alertContainer.style.display = 'block';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
          showAlert(data.message, 'success');
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 600);
        } else {
          showAlert(data.error || 'Login failed. Please check credentials.');
        }
      } catch (err) {
        showAlert('Network error occurred during login.');
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
        showAlert('Passwords do not match.');
        return;
      }

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (data.success) {
          showAlert(data.message, 'success');
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 800);
        } else {
          showAlert(data.error || 'Account registration failed.');
        }
      } catch (err) {
        showAlert('Network error during account registration.');
      }
    });
  }
});
