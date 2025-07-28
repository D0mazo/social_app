const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();
const { initDatabase } = require('./initDatabase');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(UploadsDir, { recursive: true });

// Middleware
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3000/app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPEG, PNG, and GIF files are allowed'));
        }
        cb(null, true);
    }
});

// SQLite database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Initialize database schema
(async () => {
    try {
        await initDatabase(db);
        console.log('Database schema initialized');
    } catch (err) {
        console.error('Database initialization failed:', err.message);
        process.exit(1);
    }
})();

// Input validation utilities
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUsername = (username) => /^[A-Za-z0-9]{3,20}$/.test(username);
const isValidPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

// JWT Auth Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}

// Admin Restriction Middleware
function restrictToAdmin(req, res, next) {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
}

// Get user profile
app.get('/api/user', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.get('SELECT id, username, email, bio, location, profilePic, isAdmin FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Fetch user profile error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch user profile' });
        }
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    });
});

// Update user profile
app.put('/api/user', authenticateToken, (req, res) => {
    const { username, email, bio, location } = req.body;
    const userId = req.user.userId;

    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required.' });
    }
    if (!isValidUsername(username)) {
        return res.status(400).json({ error: 'Username must be 3-20 characters, alphanumeric only' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    db.run(
        'UPDATE users SET username = ?, email = ?, bio = ?, location = ? WHERE id = ?',
        [username, email, bio || null, location || null, userId],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                console.error('Update user profile error:', err.message);
                return res.status(500).json({ error: 'Failed to update user profile' });
            }
            res.json({ message: 'Profile updated successfully' });
        }
    );
});

// Upload profile photo
app.post('/api/user/photo', authenticateToken, upload.single('photo'), (req, res) => {
    const userId = req.user.userId;
    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

    if (!profilePic) {
        return res.status(400).json({ error: 'No photo provided' });
    }

    db.get('SELECT profilePic FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Fetch user for photo deletion error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch user' });
        }
        if (user && user.profilePic) {
            const oldFilePath = path.join(__dirname, 'public', user.profilePic);
            fs.unlink(oldFilePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('Failed to delete old profile photo:', err.message);
                }
            });
        }

        db.run('UPDATE users SET profilePic = ? WHERE id = ?', [profilePic, userId], function (err) {
            if (err) {
                console.error('Update profile photo error:', err.message);
                return res.status(500).json({ error: 'Failed to update profile photo' });
            }
            res.json({ message: 'Profile photo uploaded successfully', profilePic });
        });
    });
});

// Signup route
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (!isValidUsername(username)) {
        return res.status(400).json({ error: 'Username must be 3-20 characters, alphanumeric only' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with a letter and a number' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 0], // No automatic admin assignment
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    console.error('Signup error:', err.message);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'User created successfully' });
            });
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Login DB error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username });
    });
});

// Create post
app.post('/api/posts', authenticateToken, upload.single('photo'), (req, res) => {
    const content = req.body.content || '';
    const type = req.file ? 'photo' : 'text';
    const postContent = req.file ? `/uploads/${req.file.filename}` : content;
    const userId = req.user.userId;

    if (!postContent) return res.status(400).json({ error: 'Post content is required.' });

    db.run('INSERT INTO posts (userId, type, content, createdAt) VALUES (?, ?, ?, ?)',
        [userId, type, postContent, new Date().toISOString()],
        function (err) {
            if (err) {
                console.error('Post creation error:', err.message);
                return res.status(500).json({ error: 'Failed to create post' });
            }
            res.status(201).json({ message: 'Post created successfully', id: this.lastID });
        });
});

// Get user's own posts
app.get('/api/posts', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all(`
        SELECT p.id, p.userId, p.type, p.content, p.createdAt, u.username 
        FROM posts p 
        JOIN users u ON p.userId = u.id 
        WHERE p.userId = ? 
        ORDER BY p.createdAt DESC`,
        [userId],
        (err, posts) => {
            if (err) {
                console.error('Fetch user posts error:', err.message);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            res.json(posts);
        });
});

// Get all posts
app.get('/api/all-posts', (req, res) => {
    db.all(`
        SELECT p.id, p.userId, p.type, p.content, p.createdAt, u.username 
        FROM posts p 
        JOIN users u ON p.userId = u.id 
        ORDER BY p.createdAt DESC`,
        [],
        (err, posts) => {
            if (err) {
                console.error('Fetch all posts error:', err.message);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            res.json(posts);
        });
});

// Create comment
app.post('/api/comments', authenticateToken, (req, res) => {
    const { postId, content } = req.body;
    const userId = req.user.userId;

    if (!postId || !content) {
        return res.status(400).json({ error: 'Post ID and comment content are required.' });
    }

    db.get('SELECT id FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err) {
            console.error('Fetch post error:', err.message);
            return res.status(500).json({ error: 'Failed to validate post' });
        }
        if (!post) return res.status(404).json({ error: 'Post not found' });

        db.run('INSERT INTO comments (postId, userId, content, createdAt) VALUES (?, ?, ?, ?)',
            [postId, userId, content, new Date().toISOString()],
            function (err) {
                if (err) {
                    console.error('Comment creation error:', err.message);
                    return res.status(500).json({ error: 'Failed to create comment' });
                }
                res.status(201).json({ message: 'Comment created successfully', id: this.lastID });
            });
    });
});

// Get comments for a post
app.get('/api/posts/:id/comments', (req, res) => {
    const postId = req.params.id;
    db.all(`
        SELECT c.id, c.content, c.createdAt, u.username 
        FROM comments c 
        JOIN users u ON c.userId = u.id 
        WHERE c.postId = ? 
        ORDER BY c.createdAt DESC`,
        [postId],
        (err, comments) => {
            if (err) {
                console.error('Fetch comments error:', err.message);
                return res.status(500).json({ error: 'Failed to fetch comments' });
            }
            res.json(comments);
        });
});

// Delete comment (admin only)
app.delete('/api/comments/:id', authenticateToken, restrictToAdmin, (req, res) => {
    const commentId = req.params.id;

    db.get('SELECT id FROM comments WHERE id = ?', [commentId], (err, comment) => {
        if (err) {
            console.error('Fetch comment error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch comment' });
        }
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        db.run('DELETE FROM comments WHERE id = ?', [commentId], function (err) {
            if (err) {
                console.error('Delete comment error:', err.message);
                return res.status(500).json({ error: 'Failed to delete comment' });
            }
            res.json({ message: 'Comment deleted successfully' });
        });
    });
});

// Delete post (admin only)
app.delete('/api/posts/:id', authenticateToken, restrictToAdmin, (req, res) => {
    const postId = req.params.id;

    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err) {
            console.error('Fetch post error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch post' });
        }
        if (!post) return res.status(404).json({ error: 'Post not found' });

        db.run('DELETE FROM comments WHERE postId = ?', [postId], (err) => {
            if (err) {
                console.error('Delete comments error:', err.message);
            }
        });

        db.run('DELETE FROM posts WHERE id = ?', [postId], function (err) {
            if (err) {
                console.error('Delete post error:', err.message);
                return res.status(500).json({ error: 'Failed to delete post' });
            }
            if (post.type === 'photo') {
                const filePath = path.join(__dirname, 'public', post.content);
                fs.unlink(filePath, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.error('Failed to delete photo file:', err.message);
                    }
                });
            }
            res.json({ message: 'Post deleted successfully' });
        });
    });
});

// Update post (admin only)
app.put('/api/posts/:id', authenticateToken, restrictToAdmin, upload.single('photo'), (req, res) => {
    const postId = req.params.id;
    const content = req.body.content || '';
    const photo = req.file;
    const type = content && !photo ? 'text' : photo ? 'photo' : null;
    const postContent = photo ? `/uploads/${photo.filename}` : content;

    if (!type) return res.status(400).json({ error: 'No content or photo provided' });

    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err) {
            console.error('Fetch post error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch post' });
        }
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.type === 'photo' && photo) {
            const oldFilePath = path.join(__dirname, 'public', post.content);
            fs.unlink(oldFilePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('Failed to delete old photo file:', err.message);
                }
            });
        }

        db.run('UPDATE posts SET type = ?, content = ?, createdAt = ? WHERE id = ?',
            [type, postContent, new Date().toISOString(), postId],
            function (err) {
                if (err) {
                    console.error('Update post error:', err.message);
                    return res.status(500).json({ error: 'Failed to update post' });
                }
                res.json({ message: 'Post updated successfully' });
            });
    });
});

// Serve HTML pages
app.get(['/', '/signup', '/login', '/user', '/profile', '/all-posts'], (req, res) => {
    const fileName = req.path === '/' ? 'home.html' : `${req.path.slice(1)}.html`;
    res.sendFile(path.join(__dirname, 'public', fileName), (err) => {
        if (err) {
            console.error(`Error serving ${fileName}:`, err.message);
            res.status(404).json({ error: 'Page not found' });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});