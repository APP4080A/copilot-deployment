-- init.sql

-- Users Table
CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     username TEXT UNIQUE NOT NULL,
                                     email TEXT UNIQUE,
                                     password_hash TEXT,
                                     googleId TEXT UNIQUE,
                                     passwordResetToken TEXT UNIQUE,
                                     passwordResetExpires DATETIME,
                                     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

---

-- Columns Table
-- This table will store the properties of each board column (e.g., "Todo", "In Progress")
CREATE TABLE IF NOT EXISTS columns (
                                       id TEXT PRIMARY KEY NOT NULL, -- Use TEXT for client-generated IDs (e.g., 'todo', 'inprogress', or UUIDs if you generate them for columns)
                                       title TEXT NOT NULL,
                                       position INTEGER NOT NULL UNIQUE -- To store the display order of columns
);

---

-- Tasks Table (Updated)
--
CREATE TABLE IF NOT EXISTS tasks (
                                     id TEXT PRIMARY KEY NOT NULL, -- Use TEXT for client-generated UUIDs
                                     title TEXT NOT NULL,
                                     description TEXT,             -- Keep description for future use if needed
                                     column_id TEXT NOT NULL,      -- Foreign key to link to the 'columns' table
                                     due_date TEXT,                -- 'YYYY-MM-DD' format (e.g., '2025-06-17')
                                     tags TEXT,                    -- Store as JSON string (e.g., '["Marketing", "Copywriting"]')
                                     assignee TEXT,                -- Store assignee name as text for now, can be linked to users later
                                     position INTEGER NOT NULL,    -- To store the display order of tasks within their column
                                     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                     FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE -- If column is deleted, delete its tasks
    -- FOREIGN KEY (assigned_to) REFERENCES users(id) -- If you want to link assignee to user ID, currently using TEXT assignee
);

---

-- Optional: Initial Data for Columns (Seed Data)
-- This populates the board with default columns on first run
INSERT OR IGNORE INTO columns (id, title, position) VALUES
                                                        ('todo', 'To Do', 0),
                                                        ('inprogress', 'In Progress', 1),
                                                        ('review', 'Review', 2),
                                                        ('blocked', 'Blocked', 3),
                                                        ('done', 'Done', 4);