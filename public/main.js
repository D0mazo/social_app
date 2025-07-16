import { checkAuth, setupLogout } from '/JavaScript/auth.js';
import { setupSignupForm, setupLoginForm, setupPostForm } from '/JavaScript/forms.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';

document.addEventListener('DOMContentLoaded', () => {
    // Display logged-in user's name
    const username = localStorage.getItem('username') || 'Guest';
    const userDisplay = document.getElementById('logged-in-user');
    if (userDisplay) {
        userDisplay.textContent = `Logged in as: ${username}`;
    }

    // Initialize authentication, forms, and logout
    checkAuth();
    setupLogout();
    setupSignupForm();
    setupLoginForm();
    setupPostForm(fetchPosts);

    // Fetch posts if elements exist
    if (document.getElementById('post-form')) fetchPosts();
    if (document.getElementById('all-posts')) fetchAllPosts();
});