import { checkAuth } from '/JavaScript/auth.js';
import { setupSignupForm, setupLoginForm, setupPostForm } from '/JavaScript/forms.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';

const BASE_URL = 'http://localhost:3000';

// Utility to show notifications
const showNotification = (message, type = 'error') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
};

// Normalize pathname
const normalizePath = (path) => 
    path.split('?')[0].replace(/\/+$/, '').replace(BASE_URL, '');

// Update username display
const updateUsernameDisplay = async () => {
    const userDisplay = document.getElementById('logged-in-user');
    if (!userDisplay) return;

    try {
        const user = await checkAuth();
        userDisplay.textContent = `Logged in as: ${user?.username || 'Guest'}`;
    } catch (error) {
        console.error('Authentication error:', error);
        userDisplay.textContent = 'Logged in as: Guest';
    }
};

// Page-specific initialization
const initializePage = async (pathname) => {
    const routes = {
        '/signup': () => setupSignupForm(),
        '/login': () => setupLoginForm(),
        '/user': () => {
            const postForm = document.getElementById('post-form');
            const postsContainer = document.getElementById('posts');
            
            if (postForm) {
                setupPostForm(() => fetchPosts({ endpoint: 'posts', containerId: 'posts' }));
            } else {
                console.warn('Element #post-form not found');
            }
            
            if (postsContainer) {
                fetchPosts({ endpoint: 'posts', containerId: 'posts' })
                    .catch(error => {
                        console.error('Error fetching posts:', error);
                        showNotification('Failed to load posts');
                    });
            } else {
                console.warn('Element #posts not found');
            }
        },
        '/all-posts': () => {
            const allPostsContainer = document.getElementById('all-posts');
            if (allPostsContainer) {
                fetchAllPosts()
                    .catch(error => {
                        console.error('Error fetching all posts:', error);
                        showNotification('Failed to load posts');
                    });
            } else {
                console.warn('Element #all-posts not found');
            }
        },
        '/profile': () => {} // Handled by profile.js
    };

    const routeHandler = routes[pathname] || (() => console.warn(`No initialization for path: ${pathname}`));
    await routeHandler();
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const pathname = normalizePath(window.location.pathname);
        await updateUsernameDisplay();
        await initializePage(pathname);
    } catch (error) {
        console.error('Page initialization error:', error);
        showNotification('Error initializing page');
    }
});