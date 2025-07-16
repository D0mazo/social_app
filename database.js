const initDatabase = (db) => {
    db.serialize(() => {
        // Create users table with bio, location, and profilePic
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT,
                bio TEXT,
                location TEXT,
                profilePic TEXT,
                isAdmin BOOLEAN DEFAULT FALSE
            )
        `, (err) => {
            if (err) {
                console.error('Error creating users table:', err);
                return;
            }
            console.log('Users table created or already exists');
        });

        // Create posts table
        db.run(`
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                type TEXT,
                content TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating posts table:', err);
                return;
            }
            console.log('Posts table created or already exists');
        });

        // Create comments table
        db.run(`
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                postId INTEGER,
                userId INTEGER,
                content TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (postId) REFERENCES posts(id),
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating comments table:', err);
                return;
            }
            console.log('Comments table created or already exists');
        });
    });
};

module.exports = { initDatabase };