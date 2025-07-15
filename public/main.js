import { checkAuth, setupLogout } from '/JavaScript/auth.js';
import { setupSignupForm, setupLoginForm, setupPostForm } from '/JavaScript/forms.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogout();
    setupSignupForm();
    setupLoginForm();
    setupPostForm(fetchPosts);
    if (document.getElementById('post-form')) fetchPosts();
    if (document.getElementById('all-posts')) fetchAllPosts();
});
