// Import the checkAuth function from auth.js to verify user authentication
import { checkAuth } from '/JavaScript/auth.js';
// Import form setup functions from forms.js for signup, login, and post creation
import { setupSignupForm, setupLoginForm, setupPostForm } from '/JavaScript/forms.js';
// Import post fetching functions from posts.js for user and all posts
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';

// Define the base URL for the application, set to localhost:3000 (configurable for production)
const BASE_URL = 'http://localhost:3000';

// Utility function to display temporary notifications on the page
const showNotification = (message, type = 'error') => {
    // Create a new div element for the notification
    const notification = document.createElement('div');
    // Set the CSS class of the notification based on the type (default is 'error')
    notification.className = `notification ${type}`;
    // Set the text content of the notification to the provided message
    notification.textContent = message;
    // Append the notification to the document body
    document.body.appendChild(notification);
    // Remove the notification after 3 seconds (3000ms)
    setTimeout(() => notification.remove(), 3000);
};

// Utility function to normalize the pathname by removing query parameters and trailing slashes
const normalizePath = (path) => 
    // Split the path at '?' to remove query parameters, take the first part, remove trailing slashes, and remove BASE_URL
    path.split('?')[0].replace(/\/+$/, '').replace(BASE_URL, '');

// Function to update the username display in the UI
const updateUsernameDisplay = async () => {
    // Get the user display element by its ID
    const userDisplay = document.getElementById('logged-in-user');
    // Exit if the user display element is not found
    if (!userDisplay) return;

    try {
        // Check authentication and retrieve user data
        const user = await checkAuth();
        // Update the display text with the username or 'Guest' if no user is authenticated
        userDisplay.textContent = `Logged in as: ${user?.username || 'Guest'}`;
    } catch (error) {
        // Log any errors during authentication
        console.error('Authentication error:', error);
        // Set the display to 'Guest' on error
        userDisplay.textContent = 'Logged in as: Guest';
    }
};

// Function to initialize page-specific functionality based on the current pathname
const initializePage = async (pathname) => {
    // Define a routes object mapping paths to their initialization functions
    const routes = {
        // Signup page: set up the signup form
        '/signup': () => setupSignupForm(),
        // Login page: set up the login form
        '/login': () => setupLoginForm(),
        // User page: set up post form and fetch user-specific posts
        '/user': () => {
            // Get the post form element by its ID
            const postForm = document.getElementById('post-form');
            // Get the posts container element by its ID
            const postsContainer = document.getElementById('posts');
            
            // If the post form exists, set it up with a callback to fetch posts
            if (postForm) {
                setupPostForm(() => fetchPosts({ endpoint: 'posts', containerId: 'posts' }));
            } else {
                // Log a warning if the post form is not found
                console.warn('Element #post-form not found');
            }
            
            // If the posts container exists, fetch and display user posts
            if (postsContainer) {
                fetchPosts({ endpoint: 'posts', containerId: 'posts' })
                    // Handle errors during post fetching
                    .catch(error => {
                        console.error('Error fetching posts:', error);
                        // Display an error notification
                        showNotification('Failed to load posts');
                    });
            } else {
                // Log a warning if the posts container is not found
                console.warn('Element #posts not found');
            }
        },
        // All-posts page: fetch and display all posts
        '/all-posts': () => {
            // Get the all-posts container element by its ID
            const allPostsContainer = document.getElementById('all-posts');
            // If the container exists, fetch and display all posts
            if (allPostsContainer) {
                fetchAllPosts()
                    // Handle errors during post fetching
                    .catch(error => {
                        console.error('Error fetching all posts:', error);
                        // Display an error notification
                        showNotification('Failed to load posts');
                    });
            } else {
                // Log a warning if the all-posts container is not found
                console.warn('Element #all-posts not found');
            }
        },
        // Profile page: placeholder for profile-specific initialization (handled elsewhere)
        '/profile': () => {} // Handled by profile.js
    };

    // Get the route handler for the current pathname, or a default handler that logs a warning
    const routeHandler = routes[pathname] || (() => console.warn(`No initialization for path: ${pathname}`));
    // Execute the route handler
    await routeHandler();
};

// Add an event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Normalize the current pathname
        const pathname = normalizePath(window.location.pathname);
        // Update the username display
        await updateUsernameDisplay();
        // Initialize the page based on the current pathname
        await initializePage(pathname);
    } catch (error) {
        // Log any errors during page initialization
        console.error('Page initialization error:', error);
        // Display an error notification
        showNotification('Error initializing page');
    }
});