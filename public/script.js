let token = localStorage.getItem('token');

if (token) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('post-section').style.display = 'block';
    fetchPosts();
}

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    
    const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    alert(data.message || data.error);
});

document.getElementById('logout-button')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    token = null;
    window.location.href = '/login';
});

document.getElementById('post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('post-content').value;
    
    const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    alert(data.message || data.error);
    if (response.ok) {
        document.getElementById('post-content').value = '';
        fetchPosts();
    }
});

async function fetchPosts() {
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
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <p>${post.content}</p>
            <small>${new Date(post.createdAt).toLocaleString()}</small>
        `;
        postsDiv.appendChild(postElement);
    });
}