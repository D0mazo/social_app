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
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/app', express.static(path.join(__dirname, 'app')));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// SQLite database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) return console.error('Database connection failed:', err.message);
    console.log('Connected to SQLite database');
});

// Initialize database schema
initDatabase(db);

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

// Signup route
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ error: 'Username, email, and password are required.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const isAdmin = username === 'ADMIN' && password === 'ADMIN';
        db.run('INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, isAdmin],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    console.error('Signup error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'User created successfully' });
            });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required.' });

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Login DB error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Create post
app.post('/api/posts', authenticateToken, upload.single('photo'), (req, res) => {
    const content = req.body.content || '';
    const type = req.file ? 'photo' : 'text';
    const postContent = req.file ? `/uploads/${req.file.filename}` : content;
    const userId = req.user.userId;

    if (!postContent) return res.status(400).json({ error: 'Post content is required.' });

    db.run('INSERT INTO posts (userId, type, content) VALUES (?, ?, ?)',
        [userId, type, postContent],
        function (err) {
            if (err) {
                console.error('Post creation error:', err);
                return res.status(500).json({ error: 'Failed to create post' });
            }
            res.status(201).json({ message: 'Post created successfully' });
        });
});

// Get user's own posts
app.get('/api/posts', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all('SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (err, posts) => {
            if (err) {
                console.error('Fetch user posts error:', err);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            res.json(posts);
        });
});

// Get all posts
app.get('/api/all-posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY createdAt DESC', [], (err, posts) => {
        if (err) {
            console.error('Fetch all posts error:', err);
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

    db.run('INSERT INTO comments (postId, userId, content) VALUES (?, ?, ?)',
        [postId, userId, content],
        function (err) {
            if (err) {
                console.error('Comment creation error:', err);
                return res.status(500).json({ error: 'Failed to create comment' });
            }
            res.status(201).json({ message: 'Comment created successfully' });
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
                console.error('Fetch comments error:', err);
                return res.status(500).json({ error: 'Failed to fetch comments' });
            }
            res.json(comments);
        });
});

// Delete comment (admin only)
app.delete('/api/comments/:id', authenticateToken, restrictToAdmin, (req, res) => {
    const commentId = req.params.id;

    db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
        if (err) {
            console.error('Fetch comment error:', err);
            return res.status(500).json({ error: `Failed to fetch comment: ${err.message}` });
        }
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        db.run('DELETE FROM comments WHERE id = ?', [commentId], function (err) {
            if (err) {
                console.error('Delete comment error:', err);
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
            console.error('Fetch post error:', err);
            return res.status(500).json({ error: 'Failed to fetch post' });
        }
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Delete associated comments
        db.run('DELETE FROM comments WHERE postId = ?', [postId], (err) => {
            if (err) console.error('Delete comments error:', err);
        });

        db.run('DELETE FROM posts WHERE id = ?', [postId], function (err) {
            if (err) {
                console.error('Delete post error:', err);
                return res.status(500).json({ error: 'Failed to delete post' });
            }
            if (post.type === 'photo') {
                const filePath = path.join(__dirname, 'public', post.content);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Failed to delete photo file:', err);
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
    let type = content && !photo ? 'text' : photo ? 'photo' : null;
    let postContent = photo ? `/uploads/${photo.filename}` : content;

    if (!type) return res.status(400).json({ error: 'No content or photo provided' });

    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err) {
            console.error('Fetch post error:', err);
            return res.status(500).json({ error: 'Failed to fetch post' });
        }
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.type === 'photo' && photo) {
            const oldFilePath = path.join(__dirname, 'public', post.content);
            fs.unlink(oldFilePath, (err) => {
                if (err) console.error('Failed to delete old photo file:', err);
            });
        }

        db.run('UPDATE posts SET type = ?, content = ? WHERE id = ?',
            [type, postContent, postId],
            function (err) {
                if (err) {
                    console.error('Update post error:', err);
                    return res.status(500).json({ error: 'Failed to update post' });
                }
                res.json({ message: 'Post updated successfully' });
            });
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'signup.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'user.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});