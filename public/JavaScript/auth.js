// Configuration (reverted to hardcoded BASE_URL for compatibility)
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
const PROTECTED_ROUTES = [`${BASE_URL}/user`, `${BASE_URL}/profile`]; // Reverted to original
const NOTIFICATION_DURATION = 3000;

// Utility to show notifications with accessibility
function showNotification(message, type = 'error') {
  console.log(`Showing notification: ${message} (${type})`); // Debug
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), NOTIFICATION_DURATION);
}

// Centralized function to clear session and redirect
function clearSessionAndRedirect(message = 'Session expired. Please log in again.') {
  console.log('Clearing session and redirecting'); // Debug
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  showNotification(message, 'error');
  window.location.href = `${BASE_URL}/login`;
}

// Centralized function to fetch user data
async function fetchUserData(token) {
  console.log('Fetching user data with token:', token); // Debug
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log('API response status:', res.status); // Debug
    if (res.status === 401 || res.status === 403) {
      clearSessionAndRedirect();
      return null;
    }
    if (!res.ok) throw new Error('Failed to fetch user data');
    const user = await res.json();
    console.log('User data:', user); // Debug
    return user;
  } catch (err) {
    console.error('Fetch user error:', err);
    clearSessionAndRedirect('Error: Cannot validate session');
    return null;
  }
}

// Check authentication for protected routes
async function checkAuth() {
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;
  console.log('Checking auth for path:', currentPath, 'Token:', token); // Debug

  if (!PROTECTED_ROUTES.includes(currentPath)) {
    console.log('Not a protected route, skipping auth'); // Debug
    return null;
  }

  if (!token) {
    clearSessionAndRedirect('Please log in to access this page');
    return null;
  }

  return fetchUserData(token);
}

// Check if user is admin
async function isAdminUser() {
  const token = localStorage.getItem('token');
  console.log('Checking admin status, token:', token); // Debug
  if (!token) return false;

  const user = await fetchUserData(token);
  return user ? user.isAdmin || false : false;
}

// Setup logout functionality
function setupLogout() {
  const logoutBtn = document.getElementById('logout-button');
  const userDisplay = document.getElementById('logged-in-user');
  console.log('Setting up logout, button exists:', !!logoutBtn, 'userDisplay exists:', !!userDisplay); // Debug

  if (!logoutBtn) {
    console.warn('Element #logout-button not found on page:', window.location.pathname);
    return;
  }

  const token = localStorage.getItem('token');
  logoutBtn.style.display = token ? 'block' : 'none';
  if (userDisplay) {
    userDisplay.textContent = token
      ? `Logged in as: ${localStorage.getItem('username') || 'User'}`
      : 'Logged in as: Guest';
  }

  logoutBtn.addEventListener('click', () => {
    console.log('Logout button clicked'); // Debug
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    logoutBtn.style.display = 'none';
    if (userDisplay) userDisplay.textContent = 'Logged in as: Guest';
    showNotification('Logged out successfully', 'success');
    window.location.href = `${BASE_URL}/login`;
  });
}

export { checkAuth, isAdminUser, setupLogout };