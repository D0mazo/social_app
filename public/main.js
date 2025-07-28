import { checkAuth, setupLogout } from '/JavaScript/auth.js';
import { setupSignupForm, setupLoginForm, setupPostForm } from '/JavaScript/forms.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';
import { editProfile, uploadProfilePhoto } from '/JavaScript/profile.js';

document.addEventListener('DOMContentLoaded', () => {
    // Display logged-in user's name
    const username = localStorage.getItem('username') || 'Guest';
    const userDisplay = document.getElementById('logged-in-user');
    if (userDisplay) {
        userDisplay.textContent = `Logged in as: ${username}`;
    }

    // Initialize authentication and logout for all pages
    checkAuth();
    setupLogout();

    // Initialize page-specific functionality
    const pathname = window.location.pathname;

    if (pathname === '/signup') {
        setupSignupForm();
    } else if (pathname === '/login') {
        setupLoginForm();
    } else if (pathname === '/user') {
        setupPostForm(fetchPosts);
        if (document.getElementById('post-form')) fetchPosts();
        if (document.getElementById('all-posts')) fetchAllPosts();
    } else if (pathname === '/profile') {
        // Profile page initialization is handled in profile.js
        // Functions editProfile and uploadProfilePhoto are already bound in profile.html
    }
});