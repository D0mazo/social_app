/**
 * Initializes the SQLite database with users, posts, and comments tables,
 * including migrations and indexes.
 * @param {sqlite3.Database} db - SQLite database instance
 * @returns {Promise<void>} Resolves when initialization is complete, rejects on error
 */
function initDatabase(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    isAdmin INTEGER DEFAULT 0,
                    bio TEXT,
                    location TEXT,
                    profilePic TEXT
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating users table:', err.message);
                    reject(err);
                    return;
                }
                console.log('Users table created or already exists');
            });

            // Check existing columns in users table for migrations
            db.all(`PRAGMA table_info(users)`, (err, columns) => {
                if (err) {
                    console.error('Error checking users table schema:', err.message);
                    reject(err);
                    return;
                }

                const columnNames = columns.map(col => col.name);
                const migrations = [
                    { column: 'bio', query: 'ALTER TABLE users ADD COLUMN bio TEXT' },
                    { column: 'location', query: 'ALTER TABLE users ADD COLUMN location TEXT' },
                    { column: 'profilePic', query: 'ALTER TABLE users ADD COLUMN profilePic TEXT' }
                ];

                migrations.forEach(({ column, query }) => {
                    if (!columnNames.includes(column)) {
                        db.run(query, (err) => {
                            if (err) {
                                console.error(`Migration error for ${column}:`, err.message);
                                reject(err);
                                return;
                            }
                            console.log(`Added ${column} column to users table`);
                        });
                    } else {
                        console.log(`${column} column already exists in users table`);
                    }
                });
            });

            // Create posts table
            db.run(`
                CREATE TABLE IF NOT EXISTS posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    type TEXT NOT NULL CHECK (type IN ('text', 'photo')),
                    content TEXT NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating posts table:', err.message);
                    reject(err);
                    return;
                }
                console.log('Posts table created or already exists');
            });

            // Create comments table
            db.run(`
                CREATE TABLE IF NOT EXISTS comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    postId INTEGER NOT NULL,
                    userId INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
                    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating comments table:', err.message);
                    reject(err);
                    return;
                }
                console.log('Comments table created or already exists');
            });

            // Create indexes for performance
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_posts_userId ON posts(userId)',
                'CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId)',
                'CREATE INDEX IF NOT EXISTS idx_comments_userId ON comments(userId)'
            ];

            indexes.forEach((query, index) => {
                db.run(query, (err) => {
                    if (err) {
                        console.error(`Error creating index ${index + 1}:`, err.message);
                        reject(err);
                        return;
                    }
                    console.log(`Index ${index + 1} created or already exists`);
                });
            });

            // Resolve when all queries are complete
            db.run('SELECT 1', (err) => {
                if (err) {
                    console.error('Database initialization failed:', err.message);
                    reject(err);
                } else {
                    console.log('Database initialized successfully');
                    resolve();
                }
            });
        });
    });
}

module.exports = { initDatabase };