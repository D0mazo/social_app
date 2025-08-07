// Import the fetchPosts function from posts.js to refresh posts after comment deletion
import { fetchPosts } from '/JavaScript/posts.js';

// Define the base URL for API calls, set to localhost:3000 (configurable for production)
const BASE_URL = 'http://localhost:3000'; // Change this to your real backend URL if needed

// Construct the full API URL by appending '/api' to the base URL
const API_URL = `${BASE_URL}/api`;

// Utility function to display temporary notifications on the page
function showNotification(message, type = 'error') {
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
}

// Async function to fetch comments for a specific post
async function fetchComments(postId) {
    try {
        // Send a GET request to fetch comments for the given post ID
        const res = await fetch(`${API_URL}/posts/${postId}/comments`);
        // Throw an error if the response is not successful
        if (!res.ok) throw new Error('Failed to fetch comments');
        // Parse and return the JSON response containing comments
        return await res.json();
    } catch (err) {
        // Log any errors that occur while fetching comments
        console.error(`Fetch comments error for post ${postId}:`, err);
        // Return an empty array if fetching fails
        return [];
    }
}

// Function to set up event listeners for comment deletion
function setupCommentDeletion({ containerId, endpoint }) {
    // Get the container element where comments are displayed using the provided containerId
    const container = document.getElementById(containerId);
    // Check if the container element exists; log a warning and exit if it doesn't
    if (!container) {
        console.warn(`Element #${containerId} not found`);
        return;
    }

    // Add a click event listener to the container to handle comment deletion
    container.addEventListener('click', async (e) => {
        // Check if the clicked element is a delete-comment button; exit if not
        if (!e.target.classList.contains('delete-comment')) return;

        // Get the comment ID from the button's data attribute
        const commentId = e.target.dataset.commentId;
        // Retrieve the authentication token from localStorage
        const token = localStorage.getItem('token');

        // Check if the user is logged in (has a token)
        if (!token) {
            // Display an error notification
            showNotification('Please log in to delete comments');
            // Redirect to the login page
            window.location.href = `${BASE_URL}/login`;
            return;
        }

        try {
            // Send a DELETE request to remove the comment
            const res = await fetch(`${API_URL}/comments/${commentId}`, {
                // Use DELETE method to remove the comment
                method: 'DELETE',
                // Include the authorization token in the headers
                headers: { 'Authorization': `Bearer ${token}` },
            });
            // Handle unauthorized or forbidden responses by clearing token and redirecting to login
            if (res.status === 401 || res.status === 403) {
                // Remove the token from localStorage
                localStorage.removeItem('token');
                // Remove the username from localStorage
                localStorage.removeItem('username');
                // Display a session expired notification
                showNotification('Session expired. Please log in again.');
                // Redirect to the login page
                window.location.href = `${BASE_URL}/login`;
                return;
            }
            // Check if the deletion was successful
            if (res.ok) {
                // Display a success notification
                showNotification('Comment deleted successfully', 'success');
                // Refresh the posts to reflect the deleted comment
                fetchPosts({ endpoint, containerId, showUsername: endpoint === 'all-posts' });
            } else {
                // Parse the error message from the response
                const data = await res.json();
                // Display the error message or a default message
                showNotification(data.error || 'Failed to delete comment');
            }
        } catch (err) {
            // Log any errors during the deletion process
            console.error('Delete comment error:', err);
            // Display a server error notification
            showNotification('Error: Cannot reach server');
        }
    });
}

// Export the fetchComments and setupCommentDeletion functions for use in other modules
export { fetchComments, setupCommentDeletion };