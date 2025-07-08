// ... (other imports and setup remain unchanged)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database setup (persistent storage)
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
                    return res.status(400).json({ error: 'Username already exists' });
                }
                res.status(201).json({ message: 'User created successfully' });
            });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ... (other routes remain unchanged)

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});