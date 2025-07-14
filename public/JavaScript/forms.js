import { token } from '/JavaScript/auth.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';

function setupSignupForm() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async e => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const msg = document.getElementById('signup-message');

            if (password !== confirmPassword) {
                msg.textContent = 'Passwords do not match';
                msg.classList.add('error');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
                return;
            }

            try {
                const res = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });
                const data = await res.json();

                if (res.ok) {
                    msg.textContent = data.message || 'Signup successful! Redirecting...';
                    msg.classList.add('success');
                    setTimeout(() => window.location.href = '/login', 2000);
                } else {
                    msg.textContent = data.error || 'Signup failed';
                    msg.classList.add('error');
                }
            } catch (err) {
                console.error('Sign-up error:', err);
                msg.textContent = 'Error: Cannot reach server';
                msg.classList.add('error');
            }

            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error', 'success');
            }, 3000);
        });
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const msg = document.getElementById('login-message');

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await res.json();

                if (data.token) {
                    localStorage.setItem('token', data.token);
                    msg.textContent = 'Login successful! Redirecting...';
                    msg.classList.add('success');
                    setTimeout(() => window.location.href = '/user', 2000);
                } else {
                    msg.textContent = data.error || 'Login failed';
                    msg.classList.add('error');
                }
            } catch (err) {
                console.error('Login error:', err);
                msg.textContent = 'Error: Cannot reach server';
                msg.classList.add('error');
            }

            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error', 'success');
            }, 3000);
        });
    }
}

function setupPostForm(fetchPosts) {
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', async e => {
            e.preventDefault();
            const content = document.getElementById('post-content').value;
            const photo = document.getElementById('post-photo').files[0];
            const msg = document.getElementById('post-message');
            const formData = new FormData();

            if (content) formData.append('content', content);
            if (photo) formData.append('photo', photo);

            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                const data = await res.json();

                if (res.ok) {
                    msg.textContent = data.message || 'Posted successfully';
                    msg.classList.add('success');
                    postForm.reset();
                    fetchPosts();
                } else {
                    msg.textContent = data.error || 'Post failed';
                    msg.classList.add('error');
                }
            } catch (err) {
                console.error('Post error:', err);
                msg.textContent = 'Error: Cannot reach server';
                msg.classList.add('error');
            }

            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error', 'success');
            }, 3000);
        });
    }
}

export { setupSignupForm, setupLoginForm, setupPostForm };