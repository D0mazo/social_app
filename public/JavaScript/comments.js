import { fetchPosts } from '/JavaScript/posts.js';

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

async function fetchComments(postId) {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comments`);
        if (!res.ok) throw new Error('Failed to fetch comments');
        return await res.json();
    } catch (err) {
        console.error(`Fetch comments error for post ${postId}:`, err);
        return [];
    }
}

function setupCommentDeletion({ containerId, endpoint }) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Element #${containerId} not found`);
        return;
    }

    container.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('delete-comment')) return;

        const commentId = e.target.dataset.commentId;
        const token = localStorage.getItem('token');

        if (!token) {
            showNotification('Please log in to delete comments');
            window.location.href = `${BASE_URL}/login`;
            return;
        }

        try {
            const res = await fetch(`${API_URL}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                showNotification('Session expired. Please log in again.');
                window.location.href = `${BASE_URL}/login`;
                return;
            }
            if (res.ok) {
                showNotification('Comment deleted successfully', 'success');
                fetchPosts({ endpoint, containerId, showUsername: endpoint === 'all-posts' });
            } else {
                const data = await res.json();
                showNotification(data.error || 'Failed to delete comment');
            }
        } catch (err) {
            console.error('Delete comment error:', err);
            showNotification('Error: Cannot reach server');
        }
    });
}

export { fetchComments, setupCommentDeletion };