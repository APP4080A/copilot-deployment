-- init.sql

-- Users Table
-- This table will store the properties of each User
CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     username TEXT UNIQUE NOT NULL,
                                     email TEXT UNIQUE,
                                     password_hash TEXT,
                                     googleId TEXT UNIQUE,
                                     passwordResetToken TEXT UNIQUE,
                                     passwordResetExpires DATETIME,
                                     role TEXT DEFAULT 'Member',
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

-- Tasks Table (Updated - removed assignee column)
CREATE TABLE IF NOT EXISTS tasks (
                                     id TEXT PRIMARY KEY NOT NULL, -- Use TEXT for client-generated UUIDs
                                     title TEXT NOT NULL,
                                     description TEXT DEFAULT 'No description provided', -- Added default for description
                                     column_id TEXT NOT NULL,      -- Foreign key to link to the 'columns' table
                                     due_date TEXT,                -- 'YYYY-DD-MM' format (e.g., '2025-06-17')
                                     tags TEXT,                    -- Store as JSON string (e.g., '["Marketing", "Copywriting"]')
                                     position INTEGER NOT NULL,    -- To store the display order of tasks within their column
                                     priority TEXT DEFAULT 'Low',  -- Added 'priority' column with a default 'Low'
                                     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                                     FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

---

-- New Junction Table for Task Assignees
CREATE TABLE IF NOT EXISTS task_assignees (
                                              task_id TEXT NOT NULL,
                                              user_id INTEGER NOT NULL,
                                              PRIMARY KEY (task_id, user_id), -- Composite primary key to ensure unique task-user pairs
                                              FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                                              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

---

-- Initial Data for Users (Seed Data)
INSERT OR IGNORE INTO users (username, email, role, createdAt) VALUES
                                                                   ('Ann Wambui', 'ann.wambui@example.com', 'Frontend Developer', '2024-01-10'),
                                                                   ('Brian Mwangi', 'brian.mwangi@example.com', 'Backend Developer', '2024-01-15'),
                                                                   ('Caroline Njeri', 'caroline.njeri@example.com', 'UI/UX Designer', '2024-01-20'),
                                                                   ('Daniel Ochieng', 'daniel.ochieng@example.com', 'QA Specialist', '2024-01-25'),
                                                                   ('Emily Chebet', 'emily.chebet@example.com', 'Frontend Developer', '2024-02-01'),
                                                                   ('Francis Kamau', 'francis.kamau@example.com', 'Backend Developer', '2024-02-05'),
                                                                   ('Grace Akinyi', 'grace.akinyi@example.com', 'UI/UX Designer', '2024-02-10'),
                                                                   ('Hassan Ali', 'hassan.ali@example.com', 'QA Specialist', '2024-02-15'),
                                                                   ('Irene Mumbi', 'irene.mumbi@example.com', 'Project Manager', '2024-02-20'),
                                                                   ('James Kimani', 'james.kimani@example.com', 'Lead Developer', '2024-02-25');

---

-- Initial Data for Columns (Seed Data)
INSERT OR IGNORE INTO columns (id, title, position) VALUES
                                                        ('todo', 'To Do', 0),
                                                        ('inprogress', 'In Progress', 1),
                                                        ('review', 'Review', 2),
                                                        ('blocked', 'Blocked', 3),
                                                        ('done', 'Done', 4);

---

-- Initial Data for Tasks (Seed Data - assignee removed)
INSERT OR IGNORE INTO tasks (id, title, description, column_id, due_date, tags, position, priority, createdAt) VALUES
                                                                                                                   ('task-1', 'Implement User Authentication Module', 'Develop secure user login, registration, and password reset functionalities. Ensure proper hashing and JWT token management.', 'todo', '2025-08-15', '["Security", "Backend"]', 0, 'High', '2025-07-20'),
                                                                                                                   ('task-2', 'Develop Product Catalog API', 'Build RESTful API endpoints for retrieving, adding, updating, and deleting product information. Include filtering and sorting options.', 'todo', '2025-08-22', '["API", "Backend"]', 1, 'Medium', '2025-07-21'),
                                                                                                                   ('task-3', 'Design Dashboard UI Components', 'Create wireframes and high-fidelity mockups for new dashboard widgets, focusing on user experience and data visualization.', 'todo', '2025-08-10', '["Design", "UI/UX"]', 2, 'High', '2025-07-22'),
                                                                                                                   ('task-4', 'Fix Critical Payment Gateway Bug', 'Investigate and resolve the issue where the total price in the shopping cart is incorrectly calculated when discounts are applied.', 'inprogress', '2025-08-05', '["Bug Fix", "Payment"]', 0, 'High', '2025-07-23'),
                                                                                                                   ('task-5', 'Write Unit Tests for Frontend Forms', 'Write comprehensive unit tests for all user input forms, ensuring validation and submission logic is robust.', 'inprogress', '2025-08-18', '["Testing", "Frontend"]', 1, 'Medium', '2025-07-24'),
                                                                                                                   ('task-6', 'Integrate Third-Party Analytics', 'Set up and configure Google Analytics 4 (GA4) or similar service to track user behavior and application performance.', 'review', '2025-08-25', '["Analytics", "Integration"]', 0, 'Low', '2025-07-25'),
                                                                                                                   ('task-7', 'Optimize Homepage Image Loading', 'Implement lazy loading, image compression, and responsive image techniques to reduce page load times for the homepage.', 'review', '2025-08-12', '["Performance", "Frontend"]', 1, 'Medium', '2025-07-26'),
                                                                                                                   ('task-8', 'Refactor Legacy Codebase', 'Rewrite outdated code modules using modern JavaScript features (ES6+) and best practices to improve readability and maintainability.', 'blocked', '2025-08-30', '["Refactoring", "Code Quality"]', 0, 'High', '2025-07-27'),
                                                                                                                   ('task-9', 'Conduct Security Audit', 'Perform a thorough security review of how user data is stored, transmitted, and accessed to identify and mitigate vulnerabilities.', 'done', '2025-07-29', '["Security", "Audit"]', 0, 'High', '2025-07-28'),
                                                                                                                   ('task-10', 'Deploy Production Build', 'Finalize and deploy the application to the production server after all tests pass.', 'done', '2025-07-28', '["Deployment", "DevOps"]', 1, 'High', '2025-07-29');

---

-- Initial Data for Task Assignees (Seed Data - linking tasks to multiple users)
-- Example: task-1 assigned to Ann Wambui (user ID 1) and Brian Mwangi (user ID 2)
INSERT OR IGNORE INTO task_assignees (task_id, user_id) VALUES
                                                            ('task-1', (SELECT id FROM users WHERE username = 'Ann Wambui')),
                                                            ('task-1', (SELECT id FROM users WHERE username = 'Brian Mwangi')),
                                                            ('task-2', (SELECT id FROM users WHERE username = 'Brian Mwangi')),
                                                            ('task-2', (SELECT id FROM users WHERE username = 'James Kimani')),
                                                            ('task-3', (SELECT id FROM users WHERE username = 'Caroline Njeri')),
                                                            ('task-4', (SELECT id FROM users WHERE username = 'Daniel Ochieng')),
                                                            ('task-5', (SELECT id FROM users WHERE username = 'Emily Chebet')),
                                                            ('task-5', (SELECT id FROM users WHERE username = 'Ann Wambui')),
                                                            ('task-6', (SELECT id FROM users WHERE username = 'Francis Kamau')),
                                                            ('task-7', (SELECT id FROM users WHERE username = 'Grace Akinyi')),
                                                            ('task-8', (SELECT id FROM users WHERE username = 'Hassan Ali')),
                                                            ('task-8', (SELECT id FROM users WHERE username = 'Daniel Ochieng')),
                                                            ('task-9', (SELECT id FROM users WHERE username = 'Irene Mumbi')),
                                                            ('task-10', (SELECT id FROM users WHERE username = 'James Kimani'));