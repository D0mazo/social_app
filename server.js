const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
require('dotenv').config();
const app = express();

// Middleware
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
const upload = multer({ storage: storage });

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Database error:', err.message);
    }
    console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        type TEXT,
        content TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`);
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Routes
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
            [username, hashedPassword], 
            function(err) {
                if (err) {
                    console.error('Sign-up error:', err);
                    return res.status(400).json({ error: 'Username already exists' });
                }
                res.status(201).json({ message: 'User created successfully' });
            });
    } catch (error) {
        console.error('Sign-up error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        try {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });
});

app.post('/api/posts', authenticateToken, upload.single('photo'), async (req, res) => {
    const { content } = req.body;
    const userId = req.user.userId;
    const type = req.file ? 'photo' : 'text';
    const postContent = req.file ? `/uploads/${req.file.filename}` : content;
    
    try {
        db.run('INSERT INTO posts (userId, type, content) VALUES (?, ?, ?)', 
            [userId, type, postContent], 
            function(err) {
                if (err) {
                    console.error('Post error:', err);
                    return res.status(500).json({ error: 'Failed to create post' });
                }
                res.status(201).json({ message: 'Post created successfully' });
            });
    } catch (error) {
        console.error('Post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/posts', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all('SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC', 
        [userId], 
        (err, posts) => {
            if (err) {
                console.error('Fetch posts error:', err);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            res.json(posts);
        });
});

app.get('/api/all-posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY createdAt DESC', 
        [], 
        (err, posts) => {
            if (err) {
                console.error('Fetch all posts error:', err);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            res.json(posts);
        });
});

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Serve HTML
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

app.listen(3000, () => {
    console.log('Server running on port 3000');
});