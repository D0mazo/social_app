import { checkAuth, setupLogout } from '/JavaScript/auth.js';

// Base URL for API calls
const BASE_URL = 'http://localhost:3000'; // Change this to your real backend URL if needed
const API_URL = `${BASE_URL}/api`;

// Utility to validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

document.addEventListener('DOMContentLoaded', async () => {
    let user;
    try {
        user = await checkAuth();
        if (!user) return; // Redirect handled by checkAuth
        setupLogout();
    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = `${BASE_URL}/login`;
        return;
    }

    const userDisplay = document.getElementById('logged-in-user');
    if (userDisplay) {
        userDisplay.textContent = `Logged in as: ${user.username || 'Guest'}`;
    } else {
        console.warn('Element #logged-in-user not found');
    }

    try {
        const res = await fetch(`${API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        if (res.ok) {
            const fields = [
                { id: 'userNameS', value: data.username, fallback: 'No username' },
                { id: 'userEmailS', value: data.email, fallback: 'No email' },
                { id: 'userBioS', value: data.bio, fallback: 'No bio provided' },
                { id: 'userLocationS', value: data.location, fallback: 'No location provided' },
            ];
            fields.forEach(({ id, value, fallback }) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value || fallback;
                } else {
                    console.warn(`Element #${id} not found`);
                }
            });
            const profilePic = document.getElementById('profilePic');
            if (data.profilePic && profilePic) {
                profilePic.src = data.profilePic;
            } else if (!profilePic) {
                console.warn('Element #profilePic not found');
            }
        } else {
            window.location.href = `${BASE_URL}/login`;
        }
    } catch (err) {
        console.error('Fetch user error:', err);
        window.location.href = `${BASE_URL}/login`;
    }
});

async function editProfile() {
    const form = document.getElementById('edit-profile-form');
    const msg = document.getElementById('profileMessage');
    if (!form || !msg) {
        console.error('Profile form or message element not found');
        return;
    }

    const username = form.querySelector('#profileUsername')?.value;
    const email = form.querySelector('#profileEmail')?.value;
    const bio = form.querySelector('#profileBio')?.value;
    const location = form.querySelector('#profileLocation')?.value;

    if (!username || !email) {
        msg.textContent = 'Username and email are required';
        msg.classList.remove('success');
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
        return;
    }

    if (!isValidEmail(email)) {
        msg.textContent = 'Invalid email format';
        msg.classList.remove('success');
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ username, email, bio, location }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update profile');

        const fields = [
            { id: 'userNameS', value: username, fallback: 'No username' },
            { id: 'userEmailS', value: email, fallback: 'No email' },
            { id: 'userBioS', value: bio, fallback: 'No bio provided' },
            { id: 'userLocationS', value: location, fallback: 'No location provided' },
        ];
        fields.forEach(({ id, value, fallback }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || fallback;
            }
        });
        localStorage.setItem('username', username);
        const userDisplay = document.getElementById('logged-in-user');
        if (userDisplay) {
            userDisplay.textContent = `Logged in as: ${username}`;
        }
        msg.textContent = data.message || 'Profile updated successfully';
        msg.classList.remove('error');
        msg.classList.add('success');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('success');
        }, 3000);
    } catch (err) {
        console.error('Update profile error:', err);
        msg.textContent = err.message || 'Error: Cannot reach server';
        msg.classList.remove('success');
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
    }
}

async function uploadProfilePhoto() {
    const profilePhotoInput = document.getElementById('profilePhoto');
    const msg = document.getElementById('profileMessage');
    if (!profilePhotoInput || !msg) {
        console.error('Profile photo input or message element not found');
        return;
    }

    const photo = profilePhotoInput.files[0];
    if (!photo) {
        msg.textContent = 'Please select an image';
        msg.classList.remove('success');
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!allowedTypes.includes(photo.type)) {
        msg.textContent = 'Only JPEG, PNG, or GIF files are allowed';
        msg.classList.remove('success');
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
        return;
    }
    if (photo.size > maxSize) {
        msg.textContent = 'File size exceeds 5MB limit';
        msg.classList.remove('success');
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
        return;
    }

    const formData = new FormData();
    formData.append('photo', photo);

    try {
        const res = await fetch(`${API_URL}/user/photo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

        const profilePic = document.getElementById('profilePic');
        if (profilePic) {
            profilePic.src = data.profilePic;
        } else {
            console.warn('Element #profilePic not found');
        }
        msg.textContent = data.message || 'Profile photo uploaded successfully';
        msg.classList.remove('error');
        msg.classList.add('success');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('success');
        }, 3000);
    } catch (err) {
        console.error('Upload photo error:', err);
        msg.textContent = err.message || 'Error: Cannot reach server';
        msg.classList.remove('success');
        msg.classList.add('error');
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('error');
        }, 3000);
    }
}

export { editProfile, uploadProfilePhoto };