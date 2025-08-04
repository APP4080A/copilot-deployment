CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     username TEXT UNIQUE NOT NULL,       -- Username should be NOT NULL for traditional login
                                     email TEXT UNIQUE,                  -- Email should be UNIQUE for Google login, and can be NULL for username-only users
                                     password_hash TEXT,                 -- password_hash can be NULL for Google-registered users
                                     googleId TEXT UNIQUE,               -- Column for Google User ID
                                     passwordResetToken TEXT UNIQUE,    -- Column for reset token
                                     passwordResetExpires DATETIME,    -- Column for token expiry
                                     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     title TEXT,
                                     description TEXT,
                                     status TEXT,
                                     priority TEXT,
                                     due_date TEXT,
                                     assigned_to INTEGER,
                                     FOREIGN KEY (assigned_to) REFERENCES users(id)
);