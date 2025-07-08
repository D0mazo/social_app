// Token management
let token = localStorage.getItem('token');

// Redirect if not authenticated on protected route
if (!token && window.location.pathname === '/user') {
    window.location.href = '/login';
}

// Logout
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        console.log('Logout clicked');
        localStorage.removeItem('token');
        window.location.href = '/login';
    });
}

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const messageDiv = document.getElementById('login-message');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                messageDiv.textContent = 'Login successful! Redirecting...';
                messageDiv.classList.add('success');
                setTimeout(() => {
                    window.location.href = '/user';
                }, 2000);
            } else {
                messageDiv.textContent = data.error || 'Login failed';
                messageDiv.classList.add('error');
            }
        } catch (error) {
            console.error('Login error:', error);
            messageDiv.textContent = 'Error: Unable to connect to server';
            messageDiv.classList.add('error');
        }

        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.classList.remove('error', 'success');
        }, 3000);
    });
}

// Post submission
const postForm = document.getElementById('post-form');
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = document.getElementById('post-content').value;
        const photo = document.getElementById('post-photo').files[0];
        const messageDiv = document.getElementById('post-message');
        const formData = new FormData();

        if (content) formData.append('content', content);
        if (photo) formData.append('photo', photo);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                messageDiv.textContent = data.message || 'Post created successfully';
                messageDiv.classList.add('success');
                postForm.reset();
                fetchPosts();
            } else {
                messageDiv.textContent = data.error || 'Failed to create post';
                messageDiv.classList.add('error');
            }
        } catch (error) {
            console.error('Post error:', error);
            messageDiv.textContent = 'Error: Unable to connect to server';
            messageDiv.classList.add('error');
        }

        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.classList.remove('success', 'error');
        }, 3000);
    });
}

// Fetch user's posts
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        const posts = await response.json();
        const postsDiv = document.getElementById('posts');
        postsDiv.innerHTML = '';

        if (posts.length === 0) {
            postsDiv.innerHTML = '<p>No posts yet. Share something!</p>';
        } else {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = post.type === 'photo'
                    ? `<img src="${post.content}" alt="User post" class="post-image">
                       <small>Posted on ${new Date(post.createdAt).toLocaleString()}</small>`
                    : `<p>${post.content}</p>
                       <small>Posted on ${new Date(post.createdAt).toLocaleString()}</small>`;
                postsDiv.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Fetch posts error:', error);
        const messageDiv = document.getElementById('post-message');
        if (messageDiv) {
            messageDiv.textContent = 'Error: Unable to fetch posts';
            messageDiv.classList.add('error');
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.classList.remove('error');
            }, 3000);
        }
    }
}

// Fetch all public posts
async function fetchAllPosts() {
    try {
        const response = await fetch('/api/all-posts');
        const posts = await response.json();
        const postsDiv = document.getElementById('all-posts');
        postsDiv.innerHTML = '';

        if (posts.length === 0) {
            postsDiv.innerHTML = '<p>No posts yet. Be the first to share!</p>';
        } else {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = post.type === 'photo'
                    ? `<img src="${post.content}" alt="User post" class="post-image">
                       <small>Posted by User ${post.userId} on ${new Date(post.createdAt).toLocaleString()}</small>`
                    : `<p>${post.content}</p>
                       <small>Posted by User ${post.userId} on ${new Date(post.createdAt).toLocaleString()}</small>`;
                postsDiv.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Fetch all posts error:', error);
        const postsDiv = document.getElementById('all-posts');
        postsDiv.innerHTML = '<p class="error">Error: Unable to fetch posts</p>';
    }
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('posts')) fetchPosts();
    if (document.getElementById('all-posts')) fetchAllPosts();
});
