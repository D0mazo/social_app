import { fetchPosts } from '/JavaScript/posts.js';

// Base URL for API calls (configurable for subdirectories)
const BASE_URL = process.env.BASE_URL || '';
const API_URL = `${BASE_URL}/api`;

// Utility to show notifications (consistent with other files)
function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    const protectedRoutes = [`${BASE_URL}/user`, `${BASE_URL}/profile`];
    const currentPath = window.location.pathname;

    if (!protectedRoutes.includes(currentPath)) return null;

    if (!token) {
        showNotification('Please log in to access this page');
        window.location.href = `${BASE_URL}/login`;
        return null;
    }

    try {
        const res = await fetch(`${API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            showNotification('Session expired. Please log in again.');
            window.location.href = `${BASE_URL}/login`;
            return null;
        }
        if (!res.ok) throw new Error('Failed to validate token');
        return await res.json(); // Return user data for use in other scripts
    } catch (err) {
        console.error('Check auth error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        showNotification('Error: Cannot validate session');
        window.location.href = `${BASE_URL}/login`;
        return null;
    }
}

async function isAdminUser() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const res = await fetch(`${API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            showNotification('Session expired. Please log in again.');
            window.location.href = `${BASE_URL}/login`;
            return false;
        }
        if (!res.ok) throw new Error('Failed to fetch user data');
        const user = await res.json();
        return user.isAdmin || false;
    } catch (err) {
        console.error('Error checking admin status:', err);
        return false;
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-button');
    if (!logoutBtn) {
        console.warn('Element #logout-button not found');
        return;
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        const userDisplay = document.getElementById('logged-in-user');
        if (userDisplay) {
            userDisplay.textContent = 'Logged in as: Guest';
        }
        showNotification('Logged out successfully', 'success');
        window.location.href = `${BASE_URL}/login`;
    });
}

export { checkAuth, isAdminUser, setupLogout };