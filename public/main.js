import { checkAuth, setupLogout } from '/auth.js';
import { setupSignupForm, setupLoginForm, setupPostForm } from './forms.js';
import { fetchPosts, fetchAllPosts } from './posts.js';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogout();
    setupSignupForm();
    setupLoginForm();
    setupPostForm(fetchPosts);
    if (document.getElementById('post-form')) fetchPosts();
    if (document.getElementById('all-posts')) fetchAllPosts();
});