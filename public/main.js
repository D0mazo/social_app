import { checkAuth } from '/JavaScript/auth.js';
import { setupSignupForm, setupLoginForm, setupPostForm } from '/JavaScript/forms.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';

// Base URL for API calls and redirects
const BASE_URL = 'http://localhost:3000'; // Change this to your real backend URL if needed

// Utility to show notifications (consistent with other files)
function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Normalize pathname to handle trailing slashes, query parameters, and BASE_URL
const normalizePath = (path) => {
    const cleanPath = path.split('?')[0].replace(/\/+$/, '');
    return cleanPath.startsWith(BASE_URL) ? cleanPath.slice(BASE_URL.length) : cleanPath;
};

document.addEventListener('DOMContentLoaded', async () => {
    const pathname = normalizePath(window.location.pathname);

    // Set username display for all pages
    try {
        const user = await checkAuth(); // checkAuth handles redirects for protected routes
        const username = user?.username || 'Guest';
        const userDisplay = document.getElementById('logged-in-user');
        if (userDisplay) {
            userDisplay.textContent = `Logged in as: ${username}`;
        } else if (pathname !== '/signup' && pathname !== '/login') {
            console.warn('Element #logged-in-user not found');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        const userDisplay = document.getElementById('logged-in-user');
        if (userDisplay) {
            userDisplay.textContent = 'Logged in as: Guest';
        }
    }

    // Initialize page-specific functionality
    try {
        if (pathname === '/signup') {
            setupSignupForm();
        } else if (pathname === '/login') {
            setupLoginForm();
        } else if (pathname === '/user') {
            const postForm = document.getElementById('post-form');
            if (postForm) {
                setupPostForm(() => fetchPosts({ endpoint: 'posts', containerId: 'posts' }));
            } else {
                console.warn('Element #post-form not found');
            }
            const postsContainer = document.getElementById('posts');
            if (postsContainer) {
                fetchPosts({ endpoint: 'posts', containerId: 'posts' }).catch((error) => {
                    console.error('Error fetching posts:', error);
                    showNotification('Failed to load posts');
                });
            } else {
                console.warn('Element #posts not found');
            }
        } else if (pathname === '/all-posts') {
            const allPostsContainer = document.getElementById('all-posts');
            if (allPostsContainer) {
                fetchAllPosts().catch((error) => {
                    console.error('Error fetching all posts:', error);
                    showNotification('Failed to load posts');
                });
            } else {
                console.warn('Element #all-posts not found');
            }
        } else if (pathname === '/profile') {
            // Profile initialization is handled by profile.js
        } else {
            console.warn(`No specific initialization for path: ${pathname}`);
        }
    } catch (error) {
        console.error('Page initialization error:', error);
        showNotification('Error initializing page');
    }
});