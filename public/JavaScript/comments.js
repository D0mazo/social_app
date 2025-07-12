import { token } from '/JavaScript/auth.js';
import { fetchPosts, fetchAllPosts } from '/JavaScript/posts.js';

async function fetchComments(postId) {
    try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (!res.ok) throw new Error('Failed to fetch comments');
        return await res.json();
    } catch (err) {
        console.error('Fetch comments error:', err);
        return [];
    }
}

function setupCommentDeletion() {
    document.querySelectorAll('.delete-comment').forEach(btn => {
        btn.addEventListener('click', async () => {
            const commentId = btn.dataset.commentId;
            try {
                const res = await fetch(`/api/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    alert('Comment deleted successfully');
                    window.location.pathname === '/user' ? fetchPosts() : fetchAllPosts();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to delete comment');
                }
            } catch (err) {
                console.error('Delete comment error:', err);
                alert('Error: Cannot reach server');
            }
        });
    });
}

export { fetchComments, setupCommentDeletion };