import { token, isAdminUser } from './JavaScript/auth.js';
import { fetchComments } from './JavaScript/comments.js';

async function fetchPosts() {
    try {
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

        for (const p of posts) {
            const comments = await fetchComments(p.id);
            const div = document.createElement('div');
            div.className = 'post';
            div.dataset.postId = p.id;
            let postContent = p.type === 'photo'
                ? `<img src="${p.content}" class="post-image"><small>Posted on ${new Date(p.createdAt).toLocaleString()}</small>`
                : `<p>${p.content}</p><small>Posted on ${new Date(p.createdAt).toLocaleString()}</small>`;

            if (token) {
                postContent += `
                    <form class="comment-form" data-post-id="${p.id}">
                        <textarea class="comment-content" placeholder="Add a comment..." rows="2"></textarea>
                        <button type="submit" class="submit-comment">Comment</button>
                    </form>`;
            }

            postContent += `<div class="comments">`;
            if (comments.length === 0) {
                postContent += `<p class="no-comments">No comments yet.</p>`;
            } else {
                postContent += comments.map(c => `
                    <div class="comment" data-comment-id="${c.id}">
                        <p>${c.content}</p>
                        <small>By ${c.username} on ${new Date(c.createdAt).toLocaleString()}</small>
                        ${isAdmin ? `<button class="delete-comment" data-comment-id="${c.id}">Delete Comment</button>` : ''}
                    </div>
                `).join('');
            }
            postContent += `</div>`;

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
        }

        setupPostEventListeners(isAdmin);
        setupCommentEventListeners();
    } catch (err) {
        console.error('Fetch posts error:', err);
    }
}

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

        for (const p of posts) {
            const comments = await fetchComments(p.id);
            const div = document.createElement('div');
            div.className = 'post';
            div.dataset.postId = p.id;
            let postContent = p.type === 'photo'
                ? `<img src="${p.content}" class="post-image"><small>By User ${p.userId} on ${new Date(p.createdAt).toLocaleString()}</small>`
                : `<p>${p.content}</p><small>By User ${p.userId} on ${new Date(p.createdAt).toLocaleString()}</small>`;

            if (token) {
                postContent += `
                    <form class="comment-form" data-post-id="${p.id}">
                        <textarea class="comment-content" placeholder="Add a comment..." rows="2"></textarea>
                        <button type="submit" class="submit-comment">Comment</button>
                    </form>`;
            }

            postContent += `<div class="comments">`;
            if (comments.length === 0) {
                postContent += `<p class="no-comments">No comments yet.</p>`;
            } else {
                postContent += comments.map(c => `
                    <div class="comment" data-comment-id="${c.id}">
                        <p>${c.content}</p>
                        <small>By ${c.username} on ${new Date(c.createdAt).toLocaleString()}</small>
                        ${isAdmin ? `<button class="delete-comment" data-comment-id="${c.id}">Delete Comment</button>` : ''}
                    </div>
                `).join('');
            }
            postContent += `</div>`;

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
        }

        setupPostEventListeners(isAdmin);
        setupCommentEventListeners();
    } catch (err) {
        console.error('Fetch all posts error:', err);
    }
}

function setupPostEventListeners(isAdmin) {
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
                        window.location.pathname === '/user' ? fetchPosts() : fetchAllPosts();
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
                        window.location.pathname === '/user' ? fetchPosts() : fetchAllPosts();
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
}

function setupCommentEventListeners() {
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const postId = form.dataset.postId;
            const content = form.querySelector('.comment-content').value;
            if (!content) {
                alert('Comment cannot be empty');
                return;
            }

            try {
                const res = await fetch('/api/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ postId, content }),
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Comment added successfully');
                    form.reset();
                    window.location.pathname === '/user' ? fetchPosts() : fetchAllPosts();
                } else {
                    alert(data.error || 'Failed to add comment');
                }
            } catch (err) {
                console.error('Comment error:', err);
                alert('Error: Cannot reach server');
            }
        });
    });
}

export { fetchPosts, fetchAllPosts };