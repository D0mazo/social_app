document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Sign-up form submitted');
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const messageDiv = document.getElementById('signup-message');
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        console.log('Sign-up response status:', response.status);
        const data = await response.json();
        console.log('Sign-up response data:', data);
        
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
        console.error('Sign-up error:', error);
        messageDiv.textContent = 'Error: Unable to connect to server';
        messageDiv.classList.add('error');
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.classList.remove('error');
        }, 3000);
    }
});