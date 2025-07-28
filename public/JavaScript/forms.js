import { fetchPosts } from '/JavaScript/posts.js';

// Base URL for API calls (configurable for subdirectories)
const BASE_URL = process.env.BASE_URL || '';
const API_URL = `${BASE_URL}/api`;

// Utility to validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Utility to validate password strength (e.g., min 8 chars, 1 letter, 1 number)
const isValidPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

// Utility to validate username (e.g., alphanumeric, 3-20 chars)
const isValidUsername = (username) => /^[A-Za-z0-9]{3,20}$/.test(username);

function setupSignupForm() {
    const signupForm = document.getElementById('signup-form');
    const msg = document.getElementById('signup-message');
    if (!signupForm || !msg) {
        console.warn('Signup form or message element not found');
        return;
    }

    signupForm.addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('signup-username')?.value;
        const email = document.getElementById('signup-email')?.value;
        const password = document.getElementById('signup-password')?.value;
        const confirmPassword = document.getElementById('signup-confirm-password')?.value;

        if (!username || !email || !password || !confirmPassword) {
            msg.textContent = 'All fields are required';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        if (!isValidUsername(username)) {
            msg.textContent = 'Username must be 3-20 characters, alphanumeric only';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        if (!isValidEmail(email)) {
            msg.textContent = 'Invalid email format';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        if (!isValidPassword(password)) {
            msg.textContent = 'Password must be at least 8 characters with a letter and a number';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        if (password !== confirmPassword) {
            msg.textContent = 'Passwords do not match';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();

            if (res.ok) {
                msg.textContent = data.message || 'Signup successful! Redirecting...';
                msg.classList.remove('error');
                msg.classList.add('success');
                setTimeout(() => window.location.href = `${BASE_URL}/login`, 3000);
            } else {
                msg.textContent = data.error || 'Signup failed';
                msg.classList.remove('success');
                msg.classList.add('error');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
            }
        } catch (err) {
            console.error('Sign-up error:', err);
            msg.textContent = 'Error: Cannot reach server';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
        }
    });
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const msg = document.getElementById('login-message');
    if (!loginForm || !msg) {
        console.warn('Login form or message element not found');
        return;
    }

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('login-username')?.value;
        const password = document.getElementById('login-password')?.value;

        if (!username || !password) {
            msg.textContent = 'Username and password are required';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                msg.textContent = 'Login successful! Redirecting...';
                msg.classList.remove('error');
                msg.classList.add('success');
                setTimeout(() => window.location.href = `${BASE_URL}/user`, 3000);
            } else {
                msg.textContent = data.error || 'Login failed';
                msg.classList.remove('success');
                msg.classList.add('error');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
            }
        } catch (err) {
            console.error('Login error:', err);
            msg.textContent = 'Error: Cannot reach server';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
        }
    });
}

function setupPostForm(fetchPostsFn) {
    const postForm = document.getElementById('post-form');
    const msg = document.getElementById('post-message');
    if (!postForm || !msg) {
        console.warn('Post form or message element not found');
        return;
    }

    postForm.addEventListener('submit', async e => {
        e.preventDefault();
        const content = document.getElementById('post-content')?.value;
        const photo = document.getElementById('post-photo')?.files[0];
        const token = localStorage.getItem('token');

        if (!token) {
            msg.textContent = 'Please log in to create a post';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            window.location.href = `${BASE_URL}/login`;
            return;
        }

        if (!content && !photo) {
            msg.textContent = 'Content or photo is required';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
            return;
        }

        if (photo) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (!allowedTypes.includes(photo.type)) {
                msg.textContent = 'Only JPEG, PNG, or GIF files are allowed';
                msg.classList.remove('success');
                msg.classList.add('error');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
                return;
            }
            if (photo.size > maxSize) {
                msg.textContent = 'File size exceeds 5MB limit';
                msg.classList.remove('success');
                msg.classList.add('error');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
                return;
            }
        }

        const formData = new FormData();
        if (content) formData.append('content', content);
        if (photo) formData.append('photo', photo);

        try {
            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                msg.textContent = data.message || 'Posted successfully';
                msg.classList.remove('error');
                msg.classList.add('success');
                postForm.reset();
                fetchPostsFn();
            } else {
                msg.textContent = data.error || 'Post failed';
                msg.classList.remove('success');
                msg.classList.add('error');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
            }
        } catch (err) {
            console.error('Post error:', err);
            msg.textContent = 'Error: Cannot reach server';
            msg.classList.remove('success');
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
        }
    });
}

export { setupSignupForm, setupLoginForm, setupPostForm };