document.addEventListener('DOMContentLoaded', () => {
    // Token management inside DOMContentLoaded
    let token = localStorage.getItem('token');

    // Redirect if not logged in and trying to access protected page
    if (!token && window.location.pathname === '/user') {
        window.location.href = '/login';
    }

    // Check if user is admin by decoding token
    async function isAdminUser() {
        if (!token) return false;
        try {
            // Decode JWT token (assumes standard JWT format)
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.isAdmin || false;
        } catch (err) {
            console.error('Error decoding token:', err);
            return false;
        }
    }

    // Logout handler
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Logout clicked');
            localStorage.removeItem('token');
            window.location.href = '/login';
        });
    }

    // --- Sign-up ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async e => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;
            const msg = document.getElementById('signup-message');

            try {
                const res = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
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

    // --- Login ---
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

    // --- Post creation ---
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
                const token = localStorage.getItem('token');
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

    // --- Fetch user posts ---
    async function fetchPosts() {
        try {
            const token = localStorage.getItem('token');
            const isAdmin = await isAdminUser();
            const res = await fetch('/api/posts', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token');
                alert('Session expired. Please log in again.');
                window.location.href = '/login';
                return;
            }
            const posts = await res.json();
            const container = document.getElementById('posts');
            container.innerHTML = '';

            if (posts.length === 0) {
                container.innerHTML = '<p>No posts yet. Share something!</p>';
                return;
            }

            posts.forEach(p => {
                const div = document.createElement('div');
                div.className = 'post';
                div.dataset.postId = p.id; // Store post ID for delete/update
                let postContent = p.type === 'photo'
                    ? `<img src="${p.content}" class="post-image"><small>Posted on ${new Date(p.createdAt).toLocaleString()}</small>`
                    : `<p>${p.content}</p><small>Posted on ${new Date(p.createdAt).toLocaleString()}</small>`;

                // Add admin controls if user is admin
                if (isAdmin) {
                    postContent += `
                        <div class="admin-controls">
                            <button class="delete-button" data-post-id="${p.id}">Delete</button>
                            <button class="update-button" data-post-id="${p.id}">Update</button>
                            <div class="update-form" style="display: none;">
                                <textarea class="update-content" placeholder="New content">${p.type !== 'photo' ? p.content : ''}</textarea>
                                <input type="file" class="update-photo" accept="image/*">
                                <button class="submit-update" data-post-id="${p.id}">Submit Update</button>
                            </div>
                        </div>`;
                }

                div.innerHTML = postContent;
                container.appendChild(div);
            });

            // Add event listeners for admin controls
            if (isAdmin) {
                document.querySelectorAll('.delete-button').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const postId = btn.dataset.postId;
                        try {
                            const res = await fetch(`/api/posts/${postId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            if (res.ok) {
                                alert('Post deleted successfully');
                                fetchPosts();
                            } else {
                                const data = await res.json();
                                alert(data.error || 'Failed to delete post');
                            }
                        } catch (err) {
                            console.error('Delete error:', err);
                            alert('Error: Cannot reach server');
                        }
                    });
                });

                document.querySelectorAll('.update-button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const postId = btn.dataset.postId;
                        const updateForm = btn.parentElement.querySelector('.update-form');
                        updateForm.style.display = updateForm.style.display === 'none' ? 'block' : 'none';
                    });
                });

                document.querySelectorAll('.submit-update').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const postId = btn.dataset.postId;
                        const updateContent = btn.parentElement.querySelector('.update-content').value;
                        const updatePhoto = btn.parentElement.querySelector('.update-photo').files[0];
                        const formData = new FormData();

                        if (updateContent) formData.append('content', updateContent);
                        if (updatePhoto) formData.append('photo', updatePhoto);

                        try {
                            const res = await fetch(`/api/posts/${postId}`, {
                                method: 'PUT',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: formData,
                            });
                            const data = await res.json();
                            if (res.ok) {
                                alert('Post updated successfully');
                                fetchPosts();
                            } else {
                                alert(data.error || 'Failed to update post');
                            }
                        } catch (err) {
                            console.error('Update error:', err);
                            alert('Error: Cannot reach server');
                        }
                    });
                });
            }
        } catch (err) {
            console.error('Fetch posts error:', err);
        }
    }

    // --- Fetch all posts (home page) ---
    async function fetchAllPosts() {
        try {
            const isAdmin = await isAdminUser();
            const res = await fetch('/api/all-posts');
            const posts = await res.json();
            const container = document.getElementById('all-posts');
            container.innerHTML = '';

            if (posts.length === 0) {
                container.innerHTML = '<p>No posts yet.</p>';
                return;
            }

            posts.forEach(p => {
                const div = document.createElement('div');
                div.className = 'post';
                div.dataset.postId = p.id; // Store post ID for delete/update
                let postContent = p.type === 'photo'
                    ? `<img src="${p.content}" class="post-image"><small>By User ${p.userId} on ${new Date(p.createdAt).toLocaleString()}</small>`
                    : `<p>${p.content}</p><small>By User ${p.userId} on ${new Date(p.createdAt).toLocaleString()}</small>`;

                // Add admin controls if user is admin
                if (isAdmin) {
                    postContent += `
                        <div class="admin-controls">
                            <button class="delete-button" data-post-id="${p.id}">Delete</button>
                            <button class="update-button" data-post-id="${p.id}">Update</button>
                            <div class="update-form" style="display: none;">
                                <textarea class="update-content" placeholder="New content">${p.type !== 'photo' ? p.content : ''}</textarea>
                                <input type="file" class="update-photo" accept="image/*">
                                <button class="submit-update" data-post-id="${p.id}">Submit Update</button>
                            </div>
                        </div>`;
                }

                div.innerHTML = postContent;
                container.appendChild(div);
            });

            // Add event listeners for admin controls
            if (isAdmin) {
                document.querySelectorAll('.delete-button').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const postId = btn.dataset.postId;
                        try {
                            const res = await fetch(`/api/posts/${postId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            if (res.ok) {
                                alert('Post deleted successfully');
                                fetchAllPosts();
                            } else {
                                const data = await res.json();
                                alert(data.error || 'Failed to delete post');
                            }
                        } catch (err) {
                            console.error('Delete error:', err);
                            alert('Error: Cannot reach server');
                        }
                    });
                });

                document.querySelectorAll('.update-button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const postId = btn.dataset.postId;
                        const updateForm = btn.parentElement.querySelector('.update-form');
                        updateForm.style.display = updateForm.style.display === 'none' ? 'block' : 'none';
                    });
                });

                document.querySelectorAll('.submit-update').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const postId = btn.dataset.postId;
                        const updateContent = btn.parentElement.querySelector('.update-content').value;
                        const updatePhoto = btn.parentElement.querySelector('.update-photo').files[0];
                        const formData = new FormData();

                        if (updateContent) formData.append('content', updateContent);
                        if (updatePhoto) formData.append('photo', updatePhoto);

                        try {
                            const res = await fetch(`/api/posts/${postId}`, {
                                method: 'PUT',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: formData,
                            });
                            const data = await res.json();
                            if (res.ok) {
                                alert('Post updated successfully');
                                fetchAllPosts();
                            } else {
                                alert(data.error || 'Failed to update post');
                            }
                        } catch (err) {
                            console.error('Update error:', err);
                            alert('Error: Cannot reach server');
                        }
                    });
                });
            }
        } catch (err) {
            console.error('Fetch all posts error:', err);
        }
    }

    // Call fetch functions if relevant elements are on the page
    if (document.getElementById('post-form')) fetchPosts();
    if (document.getElementById('all-posts')) fetchAllPosts();
});