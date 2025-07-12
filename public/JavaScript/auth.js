
let token = localStorage.getItem('token');

function checkAuth() {
    if (!token && window.location.pathname === '/user') {
        window.location.href = '/login';
    }
}

async function isAdminUser() {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.isAdmin || false;
    } catch (err) {
        console.error('Error decoding token:', err);
        return false;
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Logout clicked');
            localStorage.removeItem('token');
            window.location.href = '/login';
        });
    }
}

export { token, checkAuth, isAdminUser, setupLogout };
