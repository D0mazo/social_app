let token = localStorage.getItem('token');

if (token) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('post-section').style.display = 'block';
    fetchPosts();
}

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Sign-up form submitted'); // Debug log
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const messageDiv = document.getElementById('signup-message');
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        console.log('Sign-up response status:', response.status); // Debug log
        const data = await response.json();
        console.log('Sign-up response data:', data); // Debug log
        
        if (response.ok) {
            messageDiv.textContent = data.message || 'User created successfully';
            messageDiv.classList.add('success');
            document.getElementById('signup-form').reset();
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            messageDiv.textContent = data.error || 'Sign-up failed';
            messageDiv.classList.add('error');
        }
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.classList.remove('success', 'error');
        }, 3000);
    } catch (error) {
        console.error('Sign-up error:', error); // Debug log
        messageDiv.textContent = 'Error: Unable to connect to server';
        messageDiv.classList.add('error');
        setTimeout(() => {
            messageDivMit.textContent = '';
            messageDiv.classList.remove('error');
        }, 3000);
    }
});

document.getElementById('logout-button')?.addEventListener('click', () => {
    console.log('Logout clicked'); // Debug log
    localStorage.removeItem('token');
    token = null;
    window.location.href = '/login';
});

document.getElementById('post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Post form submitted'); // Debug log
    const content = document.getElementById('post-content').value;
    const messageDiv = document.getElementById('post-message');
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        
        console.log('Post response status:', response.status); // Debug log
        const data = await response.json();
        console.log('Post response data:', data); // Debug log
        
        if (response.ok) {
            messageDiv.textContent = data.message || 'Post created successfully';
            messageDiv.classList.add('success');
            document.getElementById('post-content').value = '';
            fetchPosts();
        } else {
            messageDiv.textContent = data.error || 'Failed to create post';
            messageDiv.classList.add('error');
        }
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.classList.remove('success', 'error');
        }, 3000);
    } catch (error) {
        console.error('Post error:', error); // Debug log
        messageDiv.textContent = 'Error: Unable to connect to server';
        messageDiv.classList.add('error');
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.classList.remove('error');
        }, 3000);
    }
});

async function fetchPosts() {
    try {
        const response = await fetch('/api/posts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Fetch posts response status:', response.status); // Debug log
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }
        const posts = await response.json();
        console.log('Fetch posts data:', posts); // Debug log
        const postsDiv = document.getElementById('posts');
        postsDiv.innerHTML = '';
        if (posts.length === 0) {
            postsDiv.innerHTML = '<p>No posts yet. Share something!</p>';
        } else {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = `
                    <p>${post.content}</p>
                    <small>Posted on ${new Date(post.createdAt).toLocaleString()}</small>
                `;
                postsDiv.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Fetch posts error:', error); // Debug log
        const messageDiv = document.getElementById('post-message');
        messageDiv.textContent = 'Error: Unable to fetch posts';
        messageDiv.classList.add('error');
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.classList.remove('error');
        }, 3000);
    }
}