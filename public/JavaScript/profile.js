import { checkAuth, setupLogout } from '/JavaScript/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize authentication and logout
    checkAuth();
    setupLogout();

    // Display logged-in user's name
    const username = localStorage.getItem('username') || 'Guest';
    const userDisplay = document.getElementById('logged-in-user');
    if (userDisplay) {
        userDisplay.textContent = `Logged in as: ${username}`;
    }

    // Fetch and display user profile
    try {
        const res = await fetch('/api/user', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('userNameS').textContent = data.username;
            document.getElementById('userEmailS').textContent = data.email;
            document.getElementById('userBioS').textContent = data.bio || 'No bio provided';
            document.getElementById('userLocationS').textContent = data.location || 'No location provided';
            if (data.profilePic) {
                document.getElementById('profilePic').src = data.profilePic;
            }
        } else {
            window.location.href = '/login';
        }
    } catch (err) {
        console.error('Fetch user error:', err);
        window.location.href = '/login';
    }
});

function editProfile() {
    const name = prompt("Enter new name:", document.getElementById("userNameS").textContent);
    const email = prompt("Enter new email:", document.getElementById("userEmailS").textContent);
    const bio = prompt("Enter new bio:", document.getElementById("userBioS").textContent.replace('No bio provided', ''));
    const location = prompt("Enter new location:", document.getElementById("userLocationS").textContent.replace('No location provided', ''));
    const msg = document.getElementById('profileMessage');

    if (name && email) {
        fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ username: name, email, bio, location }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to update profile');
                return res.json();
            })
            .then(data => {
                document.getElementById('userNameS').textContent = name;
                document.getElementById('userEmailS').textContent = email;
                document.getElementById('userBioS').textContent = bio || 'No bio provided';
                document.getElementById('userLocationS').textContent = location || 'No location provided';
                localStorage.setItem('username', name); // Update stored username
                const userDisplay = document.getElementById('logged-in-user');
                if (userDisplay) userDisplay.textContent = `Logged in as: ${name}`;
                msg.textContent = data.message;
                msg.classList.add('success');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error', 'success');
                }, 3000);
            })
            .catch(err => {
                console.error('Update profile error:', err);
                msg.textContent = 'Error: Cannot reach server';
                msg.classList.add('error');
                setTimeout(() => {
                    msg.textContent = '';
                    msg.classList.remove('error');
                }, 3000);
            });
    } else {
        msg.textContent = 'Username and email are required';
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
    }
}

function uploadProfilePhoto() {
    const photo = document.getElementById('profilePhoto').files[0];
    const msg = document.getElementById('profileMessage');
    if (!photo) {
        msg.textContent = 'Please select an image';
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
        return;
    }

    const formData = new FormData();
    formData.append('photo', photo);

    fetch('/api/user/photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
    })
        .then(res => {
            if (!res.ok) throw new Error('Failed to upload photo');
            return res.json();
        })
        .then(data => {
            document.getElementById('profilePic').src = data.profilePic;
            msg.textContent = data.message;
            msg.classList.add('success');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error', 'success');
            }, 3000);
        })
        .catch(err => {
            console.error('Upload photo error:', err);
            msg.textContent = 'Error: Cannot reach server';
            msg.classList.add('error');
            setTimeout(() => {
                msg.textContent = '';
                msg.classList.remove('error');
            }, 3000);
        });
}

export { editProfile, uploadProfilePhoto };