/**
 * auth.js — Login / Register logic for index.html
 */

// Redirect if already logged in
if (sessionStorage.getItem('user')) {
  window.location.href = 'dashboard.html';
}

/* ── Tab switching ── */
function showTab(tab) {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab     = document.getElementById('loginTab');
  const registerTab  = document.getElementById('registerTab');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  }

  // Clear messages
  clearMessages();
}

function clearMessages() {
  ['loginError', 'registerError', 'registerSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.textContent = ''; }
  });
}

/* ── Login ── */
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');

  errEl.classList.add('hidden');
  setLoading(btn, true);

  try {
    const result = await API.login(email, password);
    // result = { role, email }
    // Try to get name from a previously registered session, else use email
    const savedName = sessionStorage.getItem('pendingName') || email;
    const user = {
      id:    null,          // backend doesn't return id on login — complaint submit uses userId
      name:  savedName,
      email: result.email,
      role:  result.role
    };
    sessionStorage.removeItem('pendingName');
    sessionStorage.setItem('user', JSON.stringify(user));
    window.location.href = 'dashboard.html';
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    setLoading(btn, false);
  }
}

/* ── Register ── */
async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role     = document.getElementById('regRole').value;
  const errEl    = document.getElementById('registerError');
  const sucEl    = document.getElementById('registerSuccess');
  const btn      = document.getElementById('registerBtn');

  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');
  setLoading(btn, true);

  try {
    await API.register(name, email, password, role);
    sucEl.textContent = '✅ Account created! You can now login.';
    sucEl.classList.remove('hidden');
    // Save name so login can pick it up
    sessionStorage.setItem('pendingName', name);
    document.getElementById('registerForm').reset();
    // Pre-fill login email and switch tab
    document.getElementById('loginEmail').value = email;
    setTimeout(() => showTab('login'), 1500);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    setLoading(btn, false);
  }
}

/* ── Helpers ── */
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-text').textContent = loading ? 'Please wait...' : btn.dataset.label || btn.querySelector('.btn-text').textContent;
}
