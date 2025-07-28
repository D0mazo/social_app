function initDatabase(db) {
    db.serialize(() => {
        // Create users table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                isAdmin BOOLEAN DEFAULT 0
            )
        `, (err) => {
            if (err) console.error('Error creating users table:', err.message);
        });

        // Add new columns to users table if they don't exist
        const migrations = [
            'ALTER TABLE users ADD COLUMN bio TEXT',
            'ALTER TABLE users ADD COLUMN location TEXT',
            'ALTER TABLE users ADD COLUMN profilePic TEXT'
        ];

        migrations.forEach((query) => {
            db.run(query, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error(`Migration error for query ${query}:`, err.message);
                }
            });
        });

        // Create posts table
        db.run(`
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error('Error creating posts table:', err.message);
        });

        // Create comments table
        db.run(`
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                postId INTEGER,
                userId INTEGER,
                content TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (postId) REFERENCES posts(id),
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error('Error creating comments table:', err.message);
        });
    });
}

module.exports = { initDatabase };