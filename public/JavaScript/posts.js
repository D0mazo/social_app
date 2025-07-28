import { isAdminUser } from '/JavaScript/auth.js';
import { fetchComments, setupCommentDeletion } from '/JavaScript/comments.js';

// Base URL for API calls
const BASE_URL = process.env.BASE_URL || '';
const API_URL = `${BASE_URL}/api`;

// Utility to show notifications
function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function fetchPosts({ endpoint, containerId, showUsername = false }) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Element #${containerId} not found`);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please log in to view posts');
            window.location.href = `${BASE_URL}/login`;
            return;
        }

        const isAdmin = await isAdminUser().catch(err => {
            console.error('Error checking admin status:', err);
            return false;
        });

        const res = await fetch(`${API_URL}/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            showNotification('Session expired. Please log in again.');
            window.location.href = `${BASE_URL}/login`;
            return;
        }
        if (!res.ok) throw new Error('Failed to fetch posts');

        const posts = await res.json();
        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<p>No posts yet. Share something!</p>';
            return;
        }

        for (const p of posts) {
            let comments = [];
            try {
                comments = await fetchComments(p.id);
            } catch (err) {
                console.error(`Error fetching comments for post ${p.id}:`, err);
            }

            const div = document.createElement('div');
            div.className = 'post';
            div.dataset.postId = p.id;

            let postContent = p.type === 'photo'
                ? `<img src="${p.content}" class="post-image" alt="Post image">`
                : `<p>${p.content}</p>`;
            postContent += `<small>${showUsername ? `By User ${p.username} ` : ''}on ${new Date(p.createdAt).toLocaleString()}</small>`;

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
                            <input type="file" class="update-photo" accept="image/jpeg,image/png,image/gif">
                            <button class="submit-update" data-post-id="${p.id}">Submit Update</button>
                        </div>
                    </div>`;
            }

            div.innerHTML = postContent;
            container.appendChild(div);
        }

        setupPostEventListeners(isAdmin, endpoint);
        setupCommentEventListeners(endpoint);
        if (isAdmin) setupCommentDeletion({ containerId, endpoint });
    } catch (err) {
        console.error(`Fetch posts error (${endpoint}):`, err);
        showNotification('Failed to load posts');
    }
}

function setupPostEventListeners(isAdmin, endpoint) {
    if (!isAdmin) return;

    document.querySelectorAll('.delete-button').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postId = btn.dataset.postId;
            try {
                const res = await fetch(`${API_URL}/posts/${postId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                });
                if (res.ok) {
                    showNotification('Post deleted successfully', 'success');
                    fetchPosts({ endpoint, containerId: endpoint === 'posts' ? 'posts' : 'all-posts', showUsername: endpoint === 'all-posts' });
                } else {
                    const data = await res.json();
                    showNotification(data.error || 'Failed to delete post');
                }
            } catch (err) {
                console.error('Delete error:', err);
                showNotification('Error: Cannot reach server');
            }
        });
    });

    document.querySelectorAll('.update-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const updateForm = btn.parentElement.querySelector('.update-form');
            updateForm.style.display = updateForm.style.display === 'none' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.submit-update').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postId = btn.dataset.postId;
            const updateContent = btn.parentElement.querySelector('.update-content').value;
            const updatePhoto = btn.parentElement.querySelector('.update-photo').files[0];

            if (!updateContent && !updatePhoto) {
                showNotification('Content or photo is required');
                return;
            }

            if (updatePhoto) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (!allowedTypes.includes(updatePhoto.type)) {
                    showNotification('Only JPEG, PNG, or GIF files are allowed');
                    return;
                }
                if (updatePhoto.size > maxSize) {
                    showNotification('File size exceeds 5MB limit');
                    return;
                }
            }

            const formData = new FormData();
            if (updateContent) formData.append('content', updateContent);
            if (updatePhoto) formData.append('photo', updatePhoto);

            try {
                const res = await fetch(`${API_URL}/posts/${postId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: formData,
                });
                const data = await res.json();
                if (res.ok) {
                    showNotification('Post updated successfully', 'success');
                    fetchPosts({ endpoint, containerId: endpoint === 'posts' ? 'posts' : 'all-posts', showUsername: endpoint === 'all-posts' });
                } else {
                    showNotification(data.error || 'Failed to update post');
                }
            } catch (err) {
                console.error('Update error:', err);
                showNotification('Error: Cannot reach server');
            }
        });
    });
}

function setupCommentEventListeners(endpoint) {
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const postId = form.dataset.postId;
            const content = form.querySelector('.comment-content').value;
            if (!content) {
                showNotification('Comment cannot be empty');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ postId, content }),
                });
                const data = await res.json();
                if (res.ok) {
                    showNotification('Comment added successfully', 'success');
                    form.reset();
                    fetchPosts({ endpoint, containerId: endpoint === 'posts' ? 'posts' : 'all-posts', showUsername: endpoint === 'all-posts' });
                } else {
                    showNotification(data.error || 'Failed to add comment');
                }
            } catch (err) {
                console.error('Comment error:', err);
                showNotification('Error: Cannot reach server');
            }
        });
    });
}

async function fetchAllPosts() {
    await fetchPosts({ endpoint: 'all-posts', containerId: 'all-posts', showUsername: true });
}

export { fetchPosts, fetchAllPosts };