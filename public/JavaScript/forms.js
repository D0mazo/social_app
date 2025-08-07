// Import the fetchPosts function from posts.js to refresh posts after a successful post creation
import { fetchPosts } from '/JavaScript/posts.js';

// Define the base URL for API calls, set to localhost:3000 (configurable for production)
const BASE_URL = 'http://localhost:3000'; // Change this to your real backend URL if needed

// Construct the full API URL by appending '/api' to the base URL
const API_URL = `${BASE_URL}/api`;

// Utility function to validate email format using a regular expression
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Utility function to validate password strength (at least 8 characters, including a letter and a number)
const isValidPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

// Utility function to validate username (3-20 alphanumeric characters)
const isValidUsername = (username) => /^[A-Za-z0-9]{3,20}$/.test(username);

// Function to set up the signup form event listener
function setupSignupForm() {
    // Get the signup form element by its ID
    const signupForm = document.getElementById('signup-form');
    // Get the message element for displaying feedback
    const msg = document.getElementById('signup-message');
    // Check if the form or message element is missing; log a warning and exit if so
    if (!signupForm || !msg) {
        console.warn('Signup form or message element not found');
        return;
    }

    // Add a submit event listener to the signup form
    signupForm.addEventListener('submit', async e => {
        // Prevent the default form submission behavior
        e.preventDefault();
        // Get the username input value
        const username = document.getElementById('signup-username')?.value;
        // Get the email input value
        const email = document.getElementById('signup-email')?.value;
        // Get the password input value
        const password = document.getElementById('signup-password')?.value;
        // Get the confirm password input value
        const confirmPassword = document.getElementById('signup-confirm-password')?.value;

        // Check if any input fields are empty
        if (!username || !email || !password || !confirmPassword) {
            // Display an error message
            msg.textContent = 'All fields are required';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        // Validate the username format
        if (!isValidUsername(username)) {
            // Display an error message for invalid username
            msg.textContent = 'Username must be 3-20 characters, alphanumeric only';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        // Validate the email format
        if (!isValidEmail(email)) {
            // Display an error message for invalid email
            msg.textContent = 'Invalid email format';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        // Validate the password strength
        if (!isValidPassword(password)) {
            // Display an error message for invalid password
            msg.textContent = 'Password must be at least 8 characters with a letter and a number';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            // Display an error message for mismatched passwords
            msg.textContent = 'Passwords do not match';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        try {
            // Send a POST request to the signup endpoint
            const res = await fetch(`${API_URL}/signup`, {
                // Use POST method for creating a new user
                method: 'POST',
                // Set the content type to JSON
                headers: { 'Content-Type': 'application/json' },
                // Send user data as JSON
                body: JSON.stringify({ username, email, password }),
            });
            // Parse the response data
            const data = await res.json();

            // Check if the signup was successful
            if (res.ok) {
                // Display success message
                msg.textContent = data.message || 'Signup successful! Redirecting...';
                // Remove error class if present
                msg.classList.remove('error');
                // Add success class for styling
                msg.classList.add('success');
                // Redirect to login page after 3 seconds
                setTimeout(() => window.location.href = `${BASE_URL}/login`, 3000);
            } else {
                // Display error message from server or a default message
                msg.textContent = data.error || 'Signup failed';
                // Remove success class if present
                msg.classList.remove('success');
                // Add error class for styling
                msg.classList.add('error');
                // Clear the message after 3 seconds
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
            }
        } catch (err) {
            // Log any errors during the signup process
            console.error('Sign-up error:', err);
            // Display a server error message
            msg.textContent = 'Error: Cannot reach server';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
        }
    });
}

// Function to set up the login form event listener
function setupLoginForm() {
    // Get the login form element by its ID
    const loginForm = document.getElementById('login-form');
    // Get the message element for displaying feedback
    const msg = document.getElementById('login-message');
    // Check if the form or message element is missing; log a warning and exit if so
    if (!loginForm || !msg) {
        console.warn('Login form or message element not found');
        return;
    }

    // Add a submit event listener to the login form
    loginForm.addEventListener('submit', async e => {
        // Prevent the default form submission behavior
        e.preventDefault();
        // Get the username input value
        const username = document.getElementById('login-username')?.value;
        // Get the password input value
        const password = document.getElementById('login-password')?.value;

        // Check if username or password is empty
        if (!username || !password) {
            // Display an error message
            msg.textContent = 'Username and password are required';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        try {
            // Send a POST request to the login endpoint
            const res = await fetch(`${API_URL}/login`, {
                // Use POST method for login
                method: 'POST',
                // Set the content type to JSON
                headers: { 'Content-Type': 'application/json' },
                // Send credentials as JSON
                body: JSON.stringify({ username, password }),
            });
            // Parse the response data
            const data = await res.json();

            // Check if login was successful and a token was received
            if (res.ok && data.token) {
                // Store the token in localStorage
                localStorage.setItem('token', data.token);
                // Store the username in localStorage
                localStorage.setItem('username', username);
                // Display success message
                msg.textContent = 'Login successful! Redirecting...';
                // Remove error class if present
                msg.classList.remove('error');
                // Add success class for styling
                msg.classList.add('success');
                // Redirect to user page after 3 seconds
                setTimeout(() => window.location.href = `${BASE_URL}/user`, 3000);
            } else {
                // Display error message from server or a default message
                msg.textContent = data.error || 'Login failed';
                // Remove success class if present
                msg.classList.remove('success');
                // Add error class for styling
                msg.classList.add('error');
                // Clear the message after 3 seconds
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
            }
        } catch (err) {
            // Log any errors during the login process
            console.error('Login error:', err);
            // Display a server error message
            msg.textContent = 'Error: Cannot reach server';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
        }
    });
}

// Function to set up the post creation form event listener
function setupPostForm(fetchPostsFn) {
    // Get the post form element by its ID
    const postForm = document.getElementById('post-form');
    // Get the message element for displaying feedback
    const msg = document.getElementById('post-message');
    // Check if the form or message element is missing; log a warning and exit if so
    if (!postForm || !msg) {
        console.warn('Post form or message element not found');
        return;
    }

    // Add a submit event listener to the post form
    postForm.addEventListener('submit', async e => {
        // Prevent the default form submission behavior
        e.preventDefault();
        // Get the post content input value
        const content = document.getElementById('post-content')?.value;
        // Get the photo file input (if any)
        const photo = document.getElementById('post-photo')?.files[0];
        // Retrieve the authentication token from localStorage
        const token = localStorage.getItem('token');

        // Check if the user is logged in (has a token)
        if (!token) {
            // Display an error message
            msg.textContent = 'Please log in to create a post';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            // Redirect to login page
            window.location.href = `${BASE_URL}/login`;
            return;
        }

        // Check if either content or photo is provided
        if (!content && !photo) {
            // Display an error message
            msg.textContent = 'Content or photo is required';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        // If a photo is provided, validate its type and size
        if (photo) {
            // Define allowed image MIME types
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            // Set maximum file size to 5MB
            const maxSize = 5 * 1024 * 1024; // 5MB
            // Check if the file type is allowed
            if (!allowedTypes.includes(photo.type)) {
                // Display an error message for invalid file type
                msg.textContent = 'Only JPEG, PNG, or GIF files are allowed';
                // Remove success class if present
                msg.classList.remove('success');
                // Add error class for styling
                msg.classList.add('error');
                // Clear the message after 3 seconds
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
                return;
            }
            // Check if the file size exceeds the limit
            if (photo.size > maxSize) {
                // Display an error message for oversized file
                msg.textContent = 'File size exceeds 5MB limit';
                // Remove success class if present
                msg.classList.remove('success');
                // Add error class for styling
                msg.classList.add('error');
                // Clear the message after 3 seconds
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
                return;
            }
        }

        // Create a FormData object to handle file and text data
        const formData = new FormData();
        // Append content to FormData if provided
        if (content) formData.append('content', content);
        // Append photo to FormData if provided
        if (photo) formData.append('photo', photo);

        try {
            // Send a POST request to create a new post
            const res = await fetch(`${API_URL}/posts`, {
                // Use POST method for creating a post
                method: 'POST',
                // Include the authorization token
                headers: { 'Authorization': `Bearer ${token}` },
                // Send the FormData as the request body
                body: formData,
            });
            // Parse the response data
            const data = await res.json();

            // Check if the post was created successfully
            if (res.ok) {
                // Display success message
                msg.textContent = data.message || 'Posted successfully';
                // Remove error class if present
                msg.classList.remove('error');
                // Add success class for styling
                msg.classList.add('success');
                // Reset the form
                postForm.reset();
                // Call the provided fetchPosts function to refresh posts
                fetchPostsFn();
            } else {
                // Display error message from server or a default message
                msg.textContent = data.error || 'Post failed';
                // Remove success class if present
                msg.classList.remove('success');
                // Add error class for styling
                msg.classList.add('error');
                // Clear the message after 3 seconds
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
            }
        } catch (err) {
            // Log any errors during the post creation process
            console.error('Post error:', err);
            // Display a server error message
            msg.textContent = 'Error: Cannot reach server';
            // Remove success class if present
            msg.classList.remove('success');
            // Add error class for styling
            msg.classList.add('error');
            // Clear the message after 3 seconds
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
        }
    });
}

// Export the setup functions for use in other modules
export { setupSignupForm, setupLoginForm, setupPostForm };