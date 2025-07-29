require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer'); // Import nodemailer

const app = express();
const PORT = 5000;
// IMPORTANT: In production, this should be a strong, random string loaded from environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'Test_APP4080A';

// --- Google OAuth Configuration ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '346346971642-sqn2mfp07hsmumth3re7rjpo5auh92pv.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
// Ensure this redirect URI matches what you configured in Google Cloud Console
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-auth-callback';

const oAuth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);
// --- End Google OAuth Configuration ---


// --- Nodemailer Transporter Setup for Ethereal Email (for testing) ---
let transporter; // Declare transporter globally

// Create a test account with Ethereal.email
nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('[Nodemailer ERROR] Failed to create a testing account with Ethereal:', err.message);
        console.warn('Email sending will not work. Please check your network connection or try again.');
        // Fallback or exit if Ethereal account cannot be created
        return;
    }

    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass,
        },
        tls: {
            rejectUnauthorized: false // Allow self-signed certs for Ethereal
        }
    });

    console.log('[Nodemailer] Ethereal test account created.');
    console.log('[Nodemailer] Ethereal SMTP URL:', nodemailer.getTestMessageUrl(account)); // Log the Ethereal inbox URL

    // Verify transporter configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.error('[Nodemailer ERROR] Transporter verification failed:', error);
            console.warn('Email sending might not work. Please check Ethereal setup.');
        } else {
            console.log('[Nodemailer] Server is ready to take our messages via Ethereal.');
        }
    });
});
// --- End Nodemailer Transporter Setup ---


// --- SQLite Database Setup ---
const dbPath = path.join(__dirname, 'db', 'copilot.db');
const dbDir = path.dirname(dbPath);
const initSqlPath = path.join(__dirname, 'db', 'init.sql'); // Corrected path to init.sql

// Ensure the database directory exists
if (!fs.existsSync(dbDir)) {
    console.log(`[DB Setup] Database directory '${dbDir}' does not exist. Creating it...`);
    try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`[DB Setup] Database directory '${dbDir}' created successfully.`);
    } catch (mkdirErr) {
        console.error(`[DB Setup ERROR] Error creating database directory '${dbDir}':`, mkdirErr.message);
        process.exit(1); // Exit if directory cannot be created
    }
} else {
    console.log(`[DB Setup] Database directory '${dbDir}' already exists.`);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DB Connect ERROR] Error opening database:', err.message);
        console.error('[DB Connect ERROR] Database path attempted:', dbPath);
        process.exit(1); // Exit if DB connection fails
    } else {
        console.log('[DB Connect] Connected to the SQLite database:', dbPath);

        // Read and execute init.sql to create tables
        try {
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            db.exec(initSql, function (execErr) {
                if (execErr) {
                    console.error('[DB Init ERROR] Error executing init.sql:', execErr.message);
                    console.error('[DB Init ERROR] SQL executed:', initSql);
                } else {
                    console.log('[DB Init] init.sql executed successfully. Tables checked/created.');
                    // NEW: Verify users table schema after init.sql execution
                    db.all("PRAGMA table_info(users)", (pragmaErr, columns) => {
                        if (pragmaErr) {
                            console.error('[DB Schema ERROR] Error getting users table info:', pragmaErr.message);
                        } else {
                            console.log('[DB Schema] Users table columns:', columns.map(col => col.name).join(', '));
                            if (!columns.some(col => col.name === 'passwordResetToken') || !columns.some(col => col.name === 'passwordResetExpires')) {
                                console.warn('[DB Schema WARNING] passwordResetToken or passwordResetExpires columns are missing from users table!');
                            }
                        }
                    });
                    // NEW: Verify tasks table schema
                    db.all("PRAGMA table_info(tasks)", (pragmaErr, columns) => {
                        if (pragmaErr) {
                            console.error('[DB Schema ERROR] Error getting tasks table info:', pragmaErr.message);
                        } else {
                            console.log('[DB Schema] Tasks table columns:', columns.map(col => col.name).join(', '));
                        }
                    });
                }
            });
        } catch (readErr) {
            console.error('[DB Init ERROR] Error reading init.sql file:', readErr.message);
            process.exit(1); // Exit if init.sql cannot be read
        }
    }
});
// --- End SQLite Database Setup ---


// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- API Endpoints ---

/**
 * Handles user registration.
 * Expects: { username, email, password } in the request body.
 * Responds with success message or error (e.g., username already exists).
 */
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    try {
        // Check if a user with the given username or email already exists
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
            if (err) {
                console.error('[API Register ERROR] Database error during registration check:', err.message);
                return res.status(500).json({ message: 'Server error.' });
            }
            if (row) {
                if (row.username === username) {
                    return res.status(409).json({ message: 'Username already exists.' });
                }
                if (row.email === email) {
                    return res.status(409).json({ message: 'Email already exists.' });
                }
            }

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            db.run(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
                [username, email, password_hash],
                function (insertErr) {
                    if (insertErr) {
                        console.error('[API Register ERROR] Database error during user insertion:', insertErr.message);
                        return res.status(500).json({ message: 'Server error during registration.' });
                    }
                    console.log(`[API Register] User ${username} registered with ID: ${this.lastID}`);
                    res.status(201).json({ message: 'User registered successfully!', userId: this.lastID });
                }
            );
        });

    } catch (error) {
        console.error('[API Register ERROR] Registration process error:', error);
        res.status(500).json({ message: 'Server error during registration process.' });
    }
});


/**
 * Handles user login.
 * Expects: { username, password } in the request body.
 * Responds with a JWT token upon successful login.
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                console.error('[API Login ERROR] Database error during login check:', err.message);
                return res.status(500).json({ message: 'Server error.' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // For users registered via Google, password_hash might be null or empty
            if (!user.password_hash) {
                return res.status(401).json({ message: 'This account was registered via Google. Please use "Continue with Google" to log in.' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).json({ message: 'Login successful!', token });
        });

    } catch (error) {
        console.error('[API Login ERROR] Login process error:', error);
        res.status(500).json({ message: 'Server error during login process.' });
    }
});

/**
 * Initiates the Google OAuth flow.
 * Frontend will redirect to this endpoint, which then redirects to Google.
 * This endpoint is not directly called by the frontend's "Continue with Google" button.
 * Instead, the frontend constructs the Google auth URL and redirects the user.
 * This placeholder is just to illustrate the flow.
 */
app.get('/api/google-login', (req, res) => {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Request a refresh token
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
        prompt: 'consent' // Forces consent screen every time, useful for testing
    });

    res.json({ authUrl: authorizeUrl });
});


/**
 * Google OAuth Callback Endpoint.
 * This is the URI Google redirects to after user authentication.
 * It receives the authorization code and exchanges it for tokens.
 */
app.get('/api/google-auth-callback', async (req, res) => {
    const { code } = req.query; // Get the authorization code from Google's redirect

    if (!code) {
        console.error('[API Google Callback ERROR] No authorization code received from Google.');
        return res.status(400).send('Authorization code missing.');
    }

    try {
        // Exchange the authorization code for access and ID tokens
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens); // Set credentials for future API calls (optional for just verification)

        // Verify the ID token to get user profile information
        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleId = payload['sub']; // Google User ID
        const email = payload['email'];
        const username = payload['name'] || payload['email'].split('@')[0]; // Use name or part of email as username

        // Check if user already exists in your database by googleId or email
        db.get('SELECT * FROM users WHERE googleId = ? OR email = ?', [googleId, email], async (err, user) => {
            if (err) {
                console.error('[API Google Callback ERROR] Database error during Google login/registration check:', err.message);
                // Redirect to frontend with an error message
                // CHANGE THIS LINE:
                return res.redirect(`http://localhost:3000/login?error=server_error`);
            }

            let appToken;
            if (user) {
                // User exists: Log them in
                console.log(`[API Google Callback] User ${user.username} logged in via Google.`);
                appToken = jwt.sign(
                    { id: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                // If user existed and logged in, redirect to frontend with token
                // CHANGE THIS LINE:
                res.redirect(`http://localhost:3000/login?token=${appToken}`);
            } else {
                // New user: Register them
                console.log(`[API Google Callback] New Google user: ${username} (${email})`);
                db.run(`INSERT INTO users (username, email, googleId, password_hash) VALUES (?, ?, ?, ?)`,
                    [username, email, googleId, null], // password_hash is null for Google users
                    function (insertErr) {
                        if (insertErr) {
                            console.error('[API Google Callback ERROR] Database error during new Google user insertion:', insertErr.message);
                            // CHANGE THIS LINE:
                            return res.redirect(`http://localhost:3000/login?error=registration_failed`);
                        }
                        console.log(`[API Google Callback] Google user ${username} registered with ID: ${this.lastID}`);
                        // For new Google users, redirect to the login page with a success message, not a token.
                        // CHANGE THIS LINE:
                        return res.redirect(`http://localhost:3000/login?message=google_registration_success`);
                    }
                );
                // Important: Return here to prevent further execution before db.run callback finishes
                return;
            }
        });

    } catch (error) {
        console.error('[API Google Callback ERROR] Google OAuth process error:', error);
        // Redirect to frontend with an error message
        // CHANGE THIS LINE:
        res.redirect(`http://localhost:3000/login?error=google_auth_failed`);
    }
});
/**
 * Handles the request for a password reset link.
 * Expects: { email } in the request body.
 * Generates a token, stores it, and sends an email with the reset link.
 */
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('[API Forgot Password ERROR] Database error during forgot password lookup:', err.message);
            return res.status(500).json({ message: 'Server error.' });
        }

        // Always send a generic success message to prevent email enumeration attacks
        if (!user) {
            console.log(`[API Forgot Password] Attempted password reset for non-existent email: ${email}`);
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Generate a unique token
        const token = crypto.randomBytes(20).toString('hex');
        // Set token expiry (e.g., 1 hour from now)
        const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour in milliseconds

        db.run(`UPDATE users SET passwordResetToken = ?, passwordResetExpires = ? WHERE id = ?`,
            [token, expires, user.id],
            function (updateErr) {
                if (updateErr) {
                    console.error('[API Forgot Password ERROR] Database error updating password reset token:', updateErr.message);
                    return res.status(500).json({ message: 'Server error updating reset token.' });
                }

                const resetLink = `http://localhost:3000/reset-password?token=${token}`; // Frontend reset page URL
                console.log(`[API Forgot Password] Generated reset link for ${email}: ${resetLink}`);

                // Ensure transporter is initialized before sending mail
                if (!transporter) {
                    console.error('[Nodemailer ERROR] Ethereal transporter not initialized. Cannot send email.');
                    return res.status(500).json({ message: 'Email service not ready. Please try again later.' });
                }

                // Send the email
                const mailOptions = {
                    from: '"Co-pilot App" <no-reply@copilot.com>', // Sender address (can be anything for Ethereal)
                    to: user.email, // Recipient address
                    subject: 'Password Reset Request',
                    html: `
                <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>This link will expire in 1 hour.</p>
            `,
                };

                transporter.sendMail(mailOptions, (mailErr, info) => {
                    if (mailErr) {
                        console.error('[Nodemailer ERROR] Error sending password reset email to', user.email, ':', mailErr.message);
                        // Even if email fails, still return success to prevent enumeration
                        return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
                    }
                    console.log('[Nodemailer] Password reset email sent to %s: %s', user.email, info.messageId);
                    // Log the Ethereal preview URL so you can easily check the email
                    console.log('[Nodemailer] Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
                });
            }
        );
    });
});

/**
 * Example of a protected API route.
 * Requires a valid JWT in the 'Authorization' header (e.g., "Bearer YOUR_TOKEN").
 */
app.get('/api/protected', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        res.status(200).json({ message: `Welcome, ${req.user.username}! This is protected data.` });
    } catch (error) {
        console.error('[API Protected ERROR] Token verification failed:', error.message);
        res.status(403).json({ message: 'Token is not valid, authorization denied.' });
    }
});

// Fetches all columns and their tasks, including their order.
app.get('/api/board', (req, res) => {
    const boardData = {
        columnOrder: [],
        columns: {}
    };

    // First, fetch columns in their correct order
    db.all("SELECT id, title, position FROM columns ORDER BY position ASC", [], (err, columns) => {
        if (err) {
            console.error('[API GET /api/board ERROR] Error fetching columns:', err.message);
            return res.status(500).json({ message: 'Error fetching board columns.' });
        }

        if (columns.length === 0) {
            return res.status(200).json(boardData); // Return empty board if no columns
        }

        boardData.columnOrder = columns.map(col => col.id);

        // Prepare a promise for each column's tasks
        const taskPromises = columns.map(col => {
            return new Promise((resolve, reject) => {
                db.all(
                    "SELECT id, title, description, column_id, due_date, tags, assignee, position FROM tasks WHERE column_id = ? ORDER BY position ASC",
                    [col.id],
                    (taskErr, tasks) => {
                        if (taskErr) {
                            console.error(`[API GET /api/board ERROR] Error fetching tasks for column ${col.id}:`, taskErr.message);
                            return reject(taskErr);
                        }
                        // Parse tags from JSON string back to array
                        const parsedTasks = tasks.map(task => ({
                            ...task,
                            tags: task.tags ? JSON.parse(task.tags) : []
                        }));
                        boardData.columns[col.id] = parsedTasks;
                        resolve();
                    }
                );
            });
        });

        // Wait for all task fetches to complete
        Promise.all(taskPromises)
            .then(() => {
                res.status(200).json(boardData);
            })
            .catch(error => {
                res.status(500).json({ message: 'Error fetching board tasks.', error: error.message });
            });
    });
});



// Expects: { columnId, title, due, tags, assignee }
app.post('/api/tasks', (req, res) => {
    const { columnId, title, due, tags, assignee } = req.body; // Tags should be an array from frontend
    const taskId = uuidv4(); // Generate UUID on backend for tasks for consistency

    if (!columnId || !title) {
        return res.status(400).json({ message: 'Column ID and task title are required.' });
    }

    // Get the highest position in the column to add the new task at the end
    db.get("SELECT MAX(position) as max_position FROM tasks WHERE column_id = ?", [columnId], (err, row) => {
        if (err) {
            console.error('[API POST /api/tasks ERROR] Error getting max position:', err.message);
            return res.status(500).json({ message: 'Error adding task.' });
        }

        const newPosition = (row.max_position || -1) + 1; // Start from 0 if no tasks exist

        // Convert tags array to JSON string for storage
        const tagsJson = JSON.stringify(tags || []);

        db.run(
            `INSERT INTO tasks (id, title, column_id, due_date, tags, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [taskId, title.trim(), columnId, due || null, tagsJson, assignee || 'Unassigned', newPosition],
            function (insertErr) {
                if (insertErr) {
                    console.error('[API POST /api/tasks ERROR] Error inserting new task:', insertErr.message);
                    return res.status(500).json({ message: 'Error adding task.' });
                }
                const newTask = {
                    id: taskId,
                    title: title.trim(),
                    column_id: columnId,
                    due_date: due || 'TBD',
                    tags: tags || [],
                    assignee: assignee || 'Unassigned',
                    position: newPosition
                };
                res.status(201).json({ message: 'Task added successfully!', task: newTask });
            }
        );
    });
});


// Expects: { title, due, tags, assignee } in body
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, due, tags, assignee } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Task title is required.' });
    }

    // Convert tags array to JSON string for storage
    const tagsJson = JSON.stringify(tags || []);

    db.run(
        `UPDATE tasks SET title = ?, due_date = ?, tags = ?, assignee = ? WHERE id = ?`,
        [title.trim(), due || null, tagsJson, assignee || 'Unassigned', id],
        function (updateErr) {
            if (updateErr) {
                console.error(`[API PUT /api/tasks/${id} ERROR] Error updating task:`, updateErr.message);
                return res.status(500).json({ message: 'Error updating task.' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Task not found.' });
            }
            res.status(200).json({ message: 'Task updated successfully!' });
        }
    );
});


// Expects: { sourceColumnId, destColumnId, newIndex } in body
app.put('/api/tasks/:id/move', (req, res) => {
    const { id: taskId } = req.params;
    const { sourceColumnId, destColumnId, newIndex } = req.body;

    if (!sourceColumnId || !destColumnId || newIndex === undefined) {
        return res.status(400).json({ message: 'Source column, destination column, and new index are required.' });
    }

    db.serialize(() => { // Use serialize for sequential DB operations
        db.run('BEGIN TRANSACTION;');

        // Step 1: Remove task from its original position and shift others in source column
        db.run(
            `UPDATE tasks SET position = position - 1 WHERE column_id = ? AND position > (SELECT position FROM tasks WHERE id = ?)`,
            [sourceColumnId, taskId],
            (err) => {
                if (err) {
                    console.error('[API PUT /api/tasks/move ERROR] Error shifting tasks in source column:', err.message);
                    db.run('ROLLBACK;');
                    return res.status(500).json({ message: 'Error moving task.' });
                }

                // Step 2: Make space for the task in the destination column
                db.run(
                    `UPDATE tasks SET position = position + 1 WHERE column_id = ? AND position >= ?`,
                    [destColumnId, newIndex],
                    (err) => {
                        if (err) {
                            console.error('[API PUT /api/tasks/move ERROR] Error shifting tasks in destination column:', err.message);
                            db.run('ROLLBACK;');
                            return res.status(500).json({ message: 'Error moving task.' });
                        }

                        // Step 3: Update the moved task's column and position
                        db.run(
                            `UPDATE tasks SET column_id = ?, position = ? WHERE id = ?`,
                            [destColumnId, newIndex, taskId],
                            function (err) {
                                if (err) {
                                    console.error('[API PUT /api/tasks/move ERROR] Error updating moved task:', err.message);
                                    db.run('ROLLBACK;');
                                    return res.status(500).json({ message: 'Error moving task.' });
                                }
                                if (this.changes === 0) {
                                    db.run('ROLLBACK;');
                                    return res.status(404).json({ message: 'Task not found for move operation.' });
                                }
                                db.run('COMMIT;', (commitErr) => {
                                    if (commitErr) {
                                        console.error('[API PUT /api/tasks/move ERROR] Error committing transaction:', commitErr.message);
                                        return res.status(500).json({ message: 'Error committing task move.' });
                                    }
                                    res.status(200).json({ message: 'Task moved successfully!' });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});


app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    let columnIdOfDeletedTask = null; // To store column_id for position update

    // First, get the task to know its column and position
    db.get("SELECT column_id, position FROM tasks WHERE id = ?", [id], (err, task) => {
        if (err) {
            console.error(`[API DELETE /api/tasks/${id} ERROR] Error fetching task for deletion check:`, err.message);
            return res.status(500).json({ message: 'Error deleting task.' });
        }
        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        columnIdOfDeletedTask = task.column_id;
        const deletedPosition = task.position;

        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');

            // Delete the task
            db.run(`DELETE FROM tasks WHERE id = ?`, [id], function (deleteErr) {
                if (deleteErr) {
                    console.error(`[API DELETE /api/tasks/${id} ERROR] Error deleting task:`, deleteErr.message);
                    db.run('ROLLBACK;');
                    return res.status(500).json({ message: 'Error deleting task.' });
                }
                if (this.changes === 0) {
                    db.run('ROLLBACK;');
                    return res.status(404).json({ message: 'Task not found during deletion.' });
                }

                // Shift positions of remaining tasks in the same column
                db.run(
                    `UPDATE tasks SET position = position - 1 WHERE column_id = ? AND position > ?`,
                    [columnIdOfDeletedTask, deletedPosition],
                    (shiftErr) => {
                        if (shiftErr) {
                            console.error(`[API DELETE /api/tasks/${id} ERROR] Error shifting positions after deletion:`, shiftErr.message);
                            db.run('ROLLBACK;');
                            return res.status(500).json({ message: 'Error shifting task positions.' });
                        }

                        db.run('COMMIT;', (commitErr) => {
                            if (commitErr) {
                                console.error('[API DELETE /api/tasks/id ERROR] Error committing transaction after task deletion:', commitErr.message);
                                return res.status(500).json({ message: 'Error committing task deletion.' });
                            }
                            res.status(200).json({ message: 'Task deleted successfully!' });
                        });
                    }
                );
            });
        });
    });
});


// Expects: { title } in body
app.post('/api/columns', (req, res) => {
    const { title } = req.body;
    const columnId = title.trim().toLowerCase().replace(/\s+/g, '-'); // Generate ID from title

    if (!title) {
        return res.status(400).json({ message: 'Column title is required.' });
    }

    // Check for duplicate column ID (or title, if IDs are generated from titles)
    db.get("SELECT id FROM columns WHERE id = ?", [columnId], (err, row) => {
        if (err) {
            console.error('[API POST /api/columns ERROR] Error checking duplicate column:', err.message);
            return res.status(500).json({ message: 'Error adding column.' });
        }
        if (row) {
            return res.status(409).json({ message: 'A column with this title already exists.' });
        }

        // Get the highest position to add the new column at the end
        db.get("SELECT MAX(position) as max_position FROM columns", [], (err, row) => {
            if (err) {
                console.error('[API POST /api/columns ERROR] Error getting max column position:', err.message);
                return res.status(500).json({ message: 'Error adding column.' });
            }

            const newPosition = (row.max_position || -1) + 1;

            db.run(
                `INSERT INTO columns (id, title, position) VALUES (?, ?, ?)`,
                [columnId, title.trim(), newPosition],
                function (insertErr) {
                    if (insertErr) {
                        console.error('[API POST /api/columns ERROR] Error inserting new column:', insertErr.message);
                        return res.status(500).json({ message: 'Error adding column.' });
                    }
                    const newColumn = { id: columnId, title: title.trim(), position: newPosition, tasks: [] };
                    res.status(201).json({ message: 'Column added successfully!', column: newColumn });
                }
            );
        });
    });
});


// Expects: { columnOrder: ["col1", "col2", ...] } in body
app.put('/api/columns/order', (req, res) => {
    const { columnOrder } = req.body;

    if (!Array.isArray(columnOrder)) {
        return res.status(400).json({ message: 'columnOrder must be an array.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        const updatePromises = columnOrder.map((columnId, index) => {
            return new Promise((resolve, reject) => {
                db.run(`UPDATE columns SET position = ? WHERE id = ?`, [index, columnId], function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });

        Promise.all(updatePromises)
            .then(() => {
                db.run('COMMIT;', (commitErr) => {
                    if (commitErr) {
                        console.error('[API PUT /api/columns/order ERROR] Error committing transaction:', commitErr.message);
                        return res.status(500).json({ message: 'Error updating column order.' });
                    }
                    res.status(200).json({ message: 'Column order updated successfully!' });
                });
            })
            .catch(error => {
                console.error('[API PUT /api/columns/order ERROR] Error updating column positions:', error.message);
                db.run('ROLLBACK;');
                res.status(500).json({ message: 'Error updating column order.', error: error.message });
            });
    });
});


app.delete('/api/columns/:id', (req, res) => {
    const { id: columnId } = req.params;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        // Delete the column (this will also delete associated tasks due to ON DELETE CASCADE)
        db.run(`DELETE FROM columns WHERE id = ?`, [columnId], function (err) {
            if (err) {
                console.error(`[API DELETE /api/columns/${columnId} ERROR] Error deleting column:`, err.message);
                db.run('ROLLBACK;');
                return res.status(500).json({ message: 'Error deleting column.' });
            }
            if (this.changes === 0) {
                db.run('ROLLBACK;');
                return res.status(404).json({ message: 'Column not found.' });
            }

            // Update positions of remaining columns
            db.run(
                `UPDATE columns SET position = position - 1 WHERE position > (SELECT position FROM (SELECT position FROM columns WHERE id = ?) temp_col)`,
                [columnId], // Subquery to get the position of the deleted column
                (shiftErr) => {
                    if (shiftErr) {
                        console.error(`[API DELETE /api/columns/${columnId} ERROR] Error shifting column positions:`, shiftErr.message);
                        db.run('ROLLBACK;');
                        return res.status(500).json({ message: 'Error shifting column positions.' });
                    }
                    db.run('COMMIT;', (commitErr) => {
                        if (commitErr) {
                            console.error('[API DELETE /api/columns/id ERROR] Error committing transaction after column deletion:', commitErr.message);
                            return res.status(500).json({ message: 'Error committing column deletion.' });
                        }
                        res.status(200).json({ message: 'Column deleted successfully!' });
                    });
                }
            );
        });
    });
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Closed the SQLite database connection.');
        process.exit(0);
    });
});