const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.static('public'));

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

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            type TEXT,
            content TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id)
        )
    `);
});

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

// Signup route
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Username already exists' });
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

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Create post (text or photo)
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

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
