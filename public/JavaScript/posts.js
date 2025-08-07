// Import the isAdminUser function from the auth.js module to check if the user has admin privileges
import { isAdminUser } from '/JavaScript/auth.js';

// Import fetchComments and setupCommentDeletion functions from comments.js for handling comment-related operations
import { fetchComments, setupCommentDeletion } from '/JavaScript/comments.js';

// Define the base URL for API calls, set to localhost:3000 (can be changed for production)
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

// Async function to fetch and display posts from the server
async function fetchPosts({ endpoint, containerId, showUsername = false }) {
    // Get the DOM element where posts will be displayed using the provided containerId
    const container = document.getElementById(containerId);
    // Check if the container element exists; log a warning and exit if it doesn't
    if (!container) {
        console.warn(`Element #${containerId} not found`);
        return;
    }

    try {
        // Retrieve the authentication token from localStorage
        const token = localStorage.getItem('token');
        // If no token is found, show a notification and redirect to the login page
        if (!token) {
            showNotification('Please log in to view posts');
            window.location.href = `${BASE_URL}/login`;
            return;
        }

        // Check if the user is an admin, default to false if the check fails
        const isAdmin = await isAdminUser().catch(err => {
            console.error('Error checking admin status:', err);
            return false;
        });

        // Make a GET request to the specified endpoint to fetch posts
        const res = await fetch(`${API_URL}/${endpoint}`, {
            // Include the authorization token in the request headers
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Handle unauthorized or forbidden responses by clearing token and redirecting to login
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            showNotification('Session expired. Please log in again.');
            window.location.href = `${BASE_URL}/login`;
            return;
        }
        // Throw an error if the response is not successful
        if (!res.ok) throw new Error('Failed to fetch posts');

        // Parse the JSON response to get the posts data
        const posts = await res.json();
        // Clear the container's current content
        container.innerHTML = '';

        // If no posts are found, display a message encouraging the user to post
        if (posts.length === 0) {
            container.innerHTML = '<p>No posts yet. Share something!</p>';
            return;
        }

        // Iterate over each post in the response
        for (const p of posts) {
            // Initialize an empty array to store comments for the current post
            let comments = [];
            try {
                // Fetch comments for the current post using its ID
                comments = await fetchComments(p.id);
            } catch (err) {
                // Log any errors encountered while fetching comments
                console.error(`Error fetching comments for post ${p.id}:`, err);
            }

            // Create a new div element for the post
            const div = document.createElement('div');
            // Assign the 'post' class to the div
            div.className = 'post';
            // Store the post ID as a data attribute for later use
            div.dataset.postId = p.id;

            // Determine the post content based on its type (photo or text)
            let postContent = p.type === 'photo'
                ? `<img src="${p.content}" class="post-image" alt="Post image">`
                : `<p>${p.content}</p>`;
            // Append post metadata (username if enabled, and creation date)
            postContent += `<small>${showUsername ? `By User ${p.username} ` : ''}on ${new Date(p.createdAt).toLocaleString()}</small>`;

            // If the user is logged in (has a token), add a comment form
            if (token) {
                postContent += `
                    <form class="comment-form" data-post-id="${p.id}">
                        <textarea class="comment-content" placeholder="Add a comment..." rows="2"></textarea>
                        <button type="submit" class="submit-comment">Comment</button>
                    </form>`;
            }

            // Start the comments section
            postContent += `<div class="comments">`;
            // If no comments exist, display a message
            if (comments.length === 0) {
                postContent += `<p class="no-comments">No comments yet.</p>`;
            } else {
                // Map each comment to HTML, including content, username, date, and delete button for admins
                postContent += comments.map(c => `
                    <div class="comment" data-comment-id="${c.id}">
                        <p>${c.content}</p>
                        <small>By ${c.username} on ${new Date(c.createdAt).toLocaleString()}</small>
                        ${isAdmin ? `<button class="delete-comment" data-comment-id="${c.id}">Delete Comment</button>` : ''}
                    </div>
                `).join('');
            }
            // Close the comments div
            postContent += `</div>`;

            // If the user is an admin, add admin controls (delete and update buttons)
            if (isAdmin) {
                postContent += `
                    <div class="admin-controls">
                        <button class="delete-button" data-post-id="${p.id}">Delete</button>
                        <button class="update-button" data-post-id="${p.id}">Update</button>
                        <div class="update-form" style="display: none;">
                            <textarea class="update-content" placeholder="New content">${p.type !== 'photo' ? p.content : ''}</textarea>
                            <input type="file" class="update-photo" accept="image/jpeg,image/png,image/gif">
                            <button class="submit-update" data-post-id="${p.id}">Submit Update</button>
                        </div>
                    </div>`;
            }

            // Set the post div's content to the generated HTML
            div.innerHTML = postContent;
            // Append the post div to the container
            container.appendChild(div);
        }

        // Set up event listeners for post-related actions (delete/update)
        setupPostEventListeners(isAdmin, endpoint);
        // Set up event listeners for comment submission
        setupCommentEventListeners(endpoint);
        // If the user is an admin, set up comment deletion listeners
        if (isAdmin) setupCommentDeletion({ containerId, endpoint });
    } catch (err) {
        // Log any errors that occur during the fetch process
        console.error(`Fetch posts error (${endpoint}):`, err);
        // Display an error notification to the user
        showNotification('Failed to load posts');
    }
}

// Function to set up event listeners for post-related actions (admin only)
function setupPostEventListeners(isAdmin, endpoint) {
    // Exit if the user is not an admin
    if (!isAdmin) return;

    // Add click event listeners to all delete buttons
    document.querySelectorAll('.delete-button').forEach(btn => {
        btn.addEventListener('click', async () => {
            // Get the post ID from the button's data attribute
            const postId = btn.dataset.postId;
            try {
                // Send a DELETE request to remove the post
                const res = await fetch(`${API_URL}/posts/${postId}`, {
                    method: 'DELETE',
                    // Include the authorization token
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                });
                // If the deletion is successful, show a success notification and refresh posts
                if (res.ok) {
                    showNotification('Post deleted successfully', 'success');
                    fetchPosts({ endpoint, containerId: endpoint === 'posts' ? 'posts' : 'all-posts', showUsername: endpoint === 'all-posts' });
                } else {
                    // Parse the error message from the response and display it
                    const data = await res.json();
                    showNotification(data.error || 'Failed to delete post');
                }
            } catch (err) {
                // Log any errors during the deletion process
                console.error('Delete error:', err);
                // Display a server error notification
                showNotification('Error: Cannot reach server');
            }
        });
    });

    // Add click event listeners to all update buttons
    document.querySelectorAll('.update-button').forEach(btn => {
        btn.addEventListener('click', () => {
            // Get the update form element within the same parent as the button
            const updateForm = btn.parentElement.querySelector('.update-form');
            // Toggle the visibility of the update form
            updateForm.style.display = updateForm.style.display === 'none' ? 'block' : 'none';
        });
    });

    // Add click event listeners to all submit-update buttons
    document.querySelectorAll('.submit-update').forEach(btn => {
        btn.addEventListener('click', async () => {
                       const postId = btn.dataset.postId;
            // Get the updated content from the textarea
            const updateContent = btn.parentElement.querySelector('.update-content').value;
            // Get the updated photo file (if any) from the file input
            const updatePhoto = btn.parentElement.querySelector('.update-photo').files[0];

            // Validate that at least one of content or photo is provided
            if (!updateContent && !updatePhoto) {
                showNotification('Content or photo is required');
                return;
            }

            // If a photo is provided, validate its type and size
            if (updatePhoto) {
                // Define allowed image MIME types
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                // Set maximum file size to 5MB
                const maxSize = 5 * 1024 * 1024; // 5MB
                // Check if the file type is allowed
                if (!allowedTypes.includes(updatePhoto.type)) {
                    showNotification('Only JPEG, PNG, or GIF files are allowed');
                    return;
                }
                // Check if the file size exceeds the limit
                if (updatePhoto.size > maxSize) {
                    showNotification('File size exceeds 5MB limit');
                    return;
                }
            }

            // Create a FormData object to handle file and text data
            const formData = new FormData();
            // Append content to FormData if provided
            if (updateContent) formData.append('content', updateContent);
            // Append photo to FormData if provided
            if (updatePhoto) formData.append('photo', updatePhoto);

            try {
                // Send a PUT request to update the post
                const res = await fetch(`${API_URL}/posts/${postId}`, {
                    method: 'PUT',
                    // Include the authorization token
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    // Send the FormData as the request body
                    body: formData,
                });
                // Parse the response data
                const data = await res.json();
                // If the update is successful, show a success notification and refresh posts
                if (res.ok) {
                    showNotification('Post updated successfully', 'success');
                    fetchPosts({ endpoint, containerId: endpoint === 'posts' ? 'posts' : 'all-posts', showUsername: endpoint === 'all-posts' });
                } else {
                    // Display the error message from the response
                    showNotification(data.error || 'Failed to update post');
                }
            } catch (err) {
                // Log any errors during the update process
                console.error('Update error:', err);
                // Display a server error notification
                showNotification('Error: Cannot reach server');
            }
        });
    });
}

// Function to set up event listeners for comment submission
function setupCommentEventListeners(endpoint) {
    // Add submit event listeners to all comment forms
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', async e => {
            // Prevent the default form submission behavior
            e.preventDefault();
            // Get the post ID from the form's data attribute
            const postId = form.dataset.postId;
            // Get the comment content from the textarea
            const content = form.querySelector('.comment-content').value;
            // Validate that the comment is not empty
            if (!content) {
                showNotification('Comment cannot be empty');
                return;
            }

            try {
                // Send a POST request to create a new comment
                const res = await fetch(`${API_URL}/comments`, {
                    method: 'POST',
                    // Set headers for JSON content and authorization
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    // Send the post ID and comment content as JSON
                    body: JSON.stringify({ postId, content }),
                });
                // Parse the response data
                const data = await res.json();
                // If the comment is added successfully, show a success notification, reset the form, and refresh posts
                if (res.ok) {
                    showNotification('Comment added successfully', 'success');
                    form.reset();
                    fetchPosts({ endpoint, containerId: endpoint === 'posts' ? 'posts' : 'all-posts', showUsername: endpoint === 'all-posts' });
                } else {
                    // Display the error message from the response
                    showNotification(data.error || 'Failed to add comment');
                }
            } catch (err) {
                // Log any errors during the comment submission process
                console.error('Comment error:', err);
                // Display a server error notification
                showNotification('Error: Cannot reach server');
            }
        });
    });
}

// Async function to fetch all posts (wrapper for fetchPosts)
async function fetchAllPosts() {
    // Call fetchPosts with the 'all-posts' endpoint and showUsername set to true
    await fetchPosts({ endpoint: 'all-posts', containerId: 'all-posts', showUsername: true });
}

// Export the fetchPosts and fetchAllPosts functions for use in other modules
export { fetchPosts, fetchAllPosts };