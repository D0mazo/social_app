import { checkAuth, setupLogout } from '/JavaScript/auth.js';
import { setupSignupForm, setupLoginForm, setupPostForm } from '/JavaScript/forms.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';
import { editProfile, uploadProfilePhoto } from '/JavaScript/profile.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Normalize pathname to handle trailing slashes and query parameters
    const normalizePath = (path) => path.split('?')[0].replace(/\/+$/, '');
    const pathname = normalizePath(window.location.pathname);

    // Initialize authentication and display username for authenticated pages
    const authenticatedPages = ['/user', '/profile'];
    if (authenticatedPages.includes(pathname)) {
        try {
            const user = await checkAuth(); // Assume checkAuth returns user data or throws
            const username = user?.username || 'Guest';
            const userDisplay = document.getElementById('logged-in-user');
            if (userDisplay) {
                userDisplay.textContent = `Logged in as: ${username}`;
            }
            setupLogout();
        } catch (error) {
            console.error('Authentication error:', error);
            const userDisplay = document.getElementById('logged-in-user');
            if (userDisplay) {
                userDisplay.textContent = 'Logged in as: Guest';
            }
        }
    }

    // Initialize page-specific functionality
    try {
        if (pathname === '/signup') {
            setupSignupForm();
        } else if (pathname === '/login') {
            setupLoginForm();
        } else if (pathname === '/user') {
            setupPostForm(fetchPosts);
            if (document.getElementById('post-form')) {
                fetchPosts().catch((error) => console.error('Error fetching posts:', error));
            }
            if (document.getElementById('all-posts')) {
                fetchAllPosts().catch((error) => console.error('Error fetching all posts:', error));
            }
        } else if (pathname === '/profile') {
            // Explicitly initialize profile functionality
            editProfile();
            uploadProfilePhoto();
        } else {
            console.warn(`No specific initialization for path: ${pathname}`);
        }
    } catch (error) {
        console.error('Page initialization error:', error);
    }
});