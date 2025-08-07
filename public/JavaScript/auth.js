// Define the base URL for API calls, set to localhost:3000 (configurable for production)
const BASE_URL = 'http://localhost:3000';

// Construct the full API URL by appending '/api' to the base URL
const API_URL = `${BASE_URL}/api`;

// Define an array of protected routes that require authentication
const PROTECTED_ROUTES = [`${BASE_URL}/user`, `${BASE_URL}/profile`]; // Reverted to original

// Set the duration for notifications to be displayed (3000ms = 3 seconds)
const NOTIFICATION_DURATION = 3000;

// Utility function to display notifications with accessibility attributes
function showNotification(message, type = 'error') {
  // Log the notification message and type for debugging
  console.log(`Showing notification: ${message} (${type})`); // Debug
  // Create a new div element for the notification
  const notification = document.createElement('div');
  // Set the CSS class of the notification based on the type (default is 'error')
  notification.className = `notification ${type}`;
  // Add ARIA role for accessibility
  notification.setAttribute('role', 'alert');
  // Set ARIA live attribute to ensure assistive technologies announce the notification
  notification.setAttribute('aria-live', 'assertive');
  // Set the text content of the notification to the provided message
  notification.textContent = message;
  // Append the notification to the document body
  document.body.appendChild(notification);
  // Remove the notification after the specified duration
  setTimeout(() => notification.remove(), NOTIFICATION_DURATION);
}

// Centralized function to clear session data and redirect to login
function clearSessionAndRedirect(message = 'Session expired. Please log in again.') {
  // Log session clearing action for debugging
  console.log('Clearing session and redirecting'); // Debug
  // Remove the authentication token from localStorage
  localStorage.removeItem('token');
  // Remove the username from localStorage
  localStorage.removeItem('username');
  // Display the provided error message
  showNotification(message, 'error');
  // Redirect to the login page
  window.location.href = `${BASE_URL}/login`;
}

// Centralized function to fetch user data from the server
async function fetchUserData(token) {
  // Log the token being used to fetch user data for debugging
  console.log('Fetching user data with token:', token); // Debug
  try {
    // Send a GET request to the user endpoint with the authorization token
    const res = await fetch(`${API_URL}/user`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    // Log the API response status for debugging
    console.log('API response status:', res.status); // Debug
    // Handle unauthorized or forbidden responses by clearing session and redirecting
    if (res.status === 401 || res.status === 403) {
      clearSessionAndRedirect();
      return null;
    }
    // Throw an error if the response is not successful
    if (!res.ok) throw new Error('Failed to fetch user data');
    // Parse the JSON response to get user data
    const user = await res.json();
    // Log the fetched user data for debugging
    console.log('User data:', user); // Debug
    // Return the user data
    return user;
  } catch (err) {
    // Log any errors that occur during the fetch process
    console.error('Fetch user error:', err);
    // Clear session and redirect with an error message
    clearSessionAndRedirect('Error: Cannot validate session');
    // Return null to indicate failure
    return null;
  }
}

// Function to check authentication for protected routes
async function checkAuth() {
  // Retrieve the authentication token from localStorage
  const token = localStorage.getItem('token');
  // Get the current path of the page
  const currentPath = window.location.pathname;
  // Log the current path and token for debugging
  console.log('Checking auth for path:', currentPath, 'Token:', token); // Debug

  // Check if the current path is not a protected route
  if (!PROTECTED_ROUTES.includes(currentPath)) {
    // Log that the route is not protected for debugging
    console.log('Not a protected route, skipping auth'); // Debug
    // Return null as no authentication is needed
    return null;
  }

  // Check if there is no token
  if (!token) {
    // Clear session and redirect with a login prompt
    clearSessionAndRedirect('Please log in to access this page');
    // Return null to indicate authentication failure
    return null;
  }

  // Fetch and return user data if token exists
  return fetchUserData(token);
}

// Function to check if the user is an admin
async function isAdminUser() {
  // Retrieve the authentication token from localStorage
  const token = localStorage.getItem('token');
  // Log the token for debugging
  console.log('Checking admin status, token:', token); // Debug
  // Return false if no token exists
  if (!token) return false;

  // Fetch user data using the token
  const user = await fetchUserData(token);
  // Return true if user exists and has isAdmin property set to true, otherwise false
  return user ? user.isAdmin || false : false;
}

// Function to set up logout functionality
function setupLogout() {
  // Get the logout button element by its ID
  const logoutBtn = document.getElementById('logout-button');
  // Get the user display element for showing the logged-in user
  const userDisplay = document.getElementById('logged-in-user');
  // Log whether the logout button and user display elements exist for debugging
  console.log('Setting up logout, button exists:', !!logoutBtn, 'userDisplay exists:', !!userDisplay); // Debug

  // Check if the logout button is missing; log a warning and exit if so
  if (!logoutBtn) {
    console.warn('Element #logout-button not found on page:', window.location.pathname);
    return;
  }

  // Retrieve the authentication token from localStorage
  const token = localStorage.getItem('token');
  // Show the logout button if a token exists, hide it otherwise
  logoutBtn.style.display = token ? 'block' : 'none';
  // Update the user display text based on login status
  if (userDisplay) {
    userDisplay.textContent = token
      ? `Logged in as: ${localStorage.getItem('username') || 'User'}`
      : 'Logged in as: Guest';
  }

  // Add a click event listener to the logout button
  logoutBtn.addEventListener('click', () => {
    // Log the logout button click for debugging
    console.log('Logout button clicked'); // Debug
    // Remove the token from localStorage
    localStorage.removeItem('token');
    // Remove the username from localStorage
    localStorage.removeItem('username');
    // Hide the logout button
    logoutBtn.style.display = 'none';
    // Update the user display to show guest status if the element exists
    if (userDisplay) userDisplay.textContent = 'Logged in as: Guest';
    // Display a success notification for logout
    showNotification('Logged out successfully', 'success');
    // Redirect to the login page
    window.location.href = `${BASE_URL}/login`;
  });
}

// Export the checkAuth, isAdminUser, and setupLogout functions for use in other modules
export { checkAuth, isAdminUser, setupLogout };