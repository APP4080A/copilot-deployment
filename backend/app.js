const express = require('express');
const app = express(); 

require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
require('dotenv').config();


// IMPORTANT: In production, this should be a strong, random string loaded from environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'Test_APP4080A';

// --- Google OAuth Configuration ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '346346971642-sqn2mfp07hsmumth3re7rjpo5auh92pv.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
// Ensure this redirect URI matches what you configured in Google Cloud Console
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-auth-callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

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
                    // NEW: Verify task_assignees table schema
                    db.all("PRAGMA table_info(task_assignees)", (pragmaErr, columns) => {
                        if (pragmaErr) {
                            console.error('[DB Schema ERROR] Error getting task_assignees table info:', pragmaErr.message);
                        } else {
                            console.log('[DB Schema] Task Assignees table columns:', columns.map(col => col.name).join(', '));
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

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer TOKEN"

    if (token == null) {
        // Send a JSON error message when no token is provided
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Send a JSON error message when the token is invalid or expired
            return res.status(403).json({ message: 'Token is not valid, authorization denied.' });
        }
        req.userId = user.id; // Attach user ID to the request
        next();
    });
}

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

// Add this new endpoint directly after your existing /api/forgot-password
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        db.get('SELECT * FROM users WHERE passwordResetToken = ? AND passwordResetExpires > ?',
            [token, Date.now()],
            (err, user) => {
                if (err) {
                    console.error('[API Reset Password ERROR] Database error during password reset lookup:', err.message);
                    return res.status(500).json({ message: 'Server error.' });
                }
                if (!user) {
                    return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
                }
                db.run('UPDATE users SET password_hash = ?, passwordResetToken = NULL, passwordResetExpires = NULL WHERE id = ?',
                    [password_hash, user.id],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('[API Reset Password ERROR] Database error updating password:', updateErr.message);
                            return res.status(500).json({ message: 'Server error updating password.' });
                        }
                        console.log(`[API Reset Password] Password for user ${user.username} successfully reset.`);
                        res.status(200).json({ message: 'Your password has been successfully reset.' });
                    }
                );
            });
    } catch (hashError) {
        console.error('[API Reset Password ERROR] Error hashing new password:', hashError);
        res.status(500).json({ message: 'Server error.' });
    }
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
                // Modified query to fetch assignees for each task
                const tasksSql = `
                    SELECT
                        t.id, t.title, t.description, t.column_id, t.due_date, t.tags, t.position, t.priority, t.createdAt,
                        GROUP_CONCAT(u.username) AS assignees_names,
                        GROUP_CONCAT(u.id) AS assignees_ids
                    FROM tasks t
                             LEFT JOIN task_assignees ta ON t.id = ta.task_id
                             LEFT JOIN users u ON ta.user_id = u.id
                    WHERE t.column_id = ?
                    GROUP BY t.id
                    ORDER BY t.position ASC
                `;
                db.all(tasksSql, [col.id], (taskErr, tasks) => {
                    if (taskErr) {
                        console.error(`[API GET /api/board ERROR] Error fetching tasks for column ${col.id}:`, taskErr.message);
                        return reject(taskErr);
                    }
                    // Parse tags from JSON string back to array
                    const parsedTasks = tasks.map(task => ({
                        ...task,
                        tags: task.tags ? JSON.parse(task.tags) : [],
                        // Convert comma-separated assignees_names/ids back to arrays
                        assignees: task.assignees_names ? task.assignees_names.split(',') : [],
                        assignee_ids: task.assignees_ids ? task.assignees_ids.split(',').map(Number) : []
                    }));
                    boardData.columns[col.id] = parsedTasks;
                    resolve();
                });
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

// Fetches all tasks in a flat list, useful for Team View or global search.
// Maps DB fields (column_id, assigned_to) to frontend fields (status, assignees)
app.get('/api/tasks', (req, res) => {
    // Modified query to fetch all tasks with their assignees
    const sql = `
        SELECT
            t.id, t.title, t.description, t.column_id, t.priority, t.due_date, t.tags, t.createdAt,
            GROUP_CONCAT(u.username) AS assignees_names,
            GROUP_CONCAT(u.id) AS assignees_ids
        FROM tasks t
                 LEFT JOIN task_assignees ta ON t.id = ta.task_id
                 LEFT JOIN users u ON ta.user_id = u.id
        GROUP BY t.id
        ORDER BY t.createdAt DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const formattedTasks = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.column_id, // Map column_id from DB to status for frontend
            priority: row.priority,
            due: row.due_date, // Map due_date from DB to due for frontend
            tags: row.tags ? JSON.parse(row.tags) : [],
            createdAt: row.createdAt, // Ensure createdAt is mapped
            // Convert comma-separated assignees_names/ids back to arrays
            assignees: row.assignees_names ? row.assignees_names.split(',') : [],
            assignee_ids: row.assignees_ids ? row.assignees_ids.split(',').map(Number) : []
        }));
        res.json(formattedTasks);
    });
});


// Expects: { columnId, title, description, due, tags, assignee_ids, priority }
app.post('/api/tasks', (req, res) => {
    const { columnId, title, description, due, tags, assignee_ids, priority } = req.body; // Expect assignee_ids array
    const taskId = uuidv4();
    const createdAt = new Date().toISOString().split('T')[0];

    if (!columnId || !title) {
        return res.status(400).json({ message: 'Column ID and task title are required.' });
    }

    db.serialize(() => { // Use serialize for sequential DB operations
        db.run('BEGIN TRANSACTION;');

        db.get("SELECT MAX(position) as max_position FROM tasks WHERE column_id = ?", [columnId], (err, row) => {
            if (err) {
                console.error('[API POST /api/tasks ERROR] Error getting max position:', err.message);
                db.run('ROLLBACK;');
                return res.status(500).json({ message: 'Error adding task.' });
            }

            const newPosition = (row.max_position || -1) + 1;
            const tagsJson = JSON.stringify(tags || []);

            // Insert into tasks table (without assignee column)
            db.run(
                `INSERT INTO tasks (id, title, description, column_id, due_date, tags, position, priority, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [taskId, title.trim(), description || '', columnId, due || null, tagsJson, newPosition, priority || 'Low', createdAt],
                function (insertErr) {
                    if (insertErr) {
                        console.error('[API POST /api/tasks ERROR] Error inserting new task:', insertErr.message);
                        db.run('ROLLBACK;');
                        return res.status(500).json({ message: 'Error adding task.' });
                    }

                    // Insert into task_assignees table for each assignee
                    if (assignee_ids && assignee_ids.length > 0) {
                        const assigneesPromises = assignee_ids.map(userId => {
                            return new Promise((resolve, reject) => {
                                db.run(`INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)`, [taskId, userId], function(assigneeErr) {
                                    if (assigneeErr) {
                                        console.error(`[API POST /api/tasks ERROR] Error assigning user ${userId} to task ${taskId}:`, assigneeErr.message);
                                        return reject(assigneeErr);
                                    }
                                    resolve();
                                });
                            });
                        });

                        Promise.all(assigneesPromises)
                            .then(() => {
                                db.run('COMMIT;', (commitErr) => {
                                    if (commitErr) {
                                        console.error('[API POST /api/tasks ERROR] Error committing transaction after task and assignees insertion:', commitErr.message);
                                        return res.status(500).json({ message: 'Error committing task and assignees.' });
                                    }
                                    // Fetch assigned user names to return in response
                                    db.all(`SELECT username FROM users WHERE id IN (${assignee_ids.join(',')})`, [], (fetchErr, users) => {
                                        if (fetchErr) {
                                            console.error('[API POST /api/tasks ERROR] Error fetching assignee names:', fetchErr.message);
                                            // Still return success, but with potentially incomplete assignee info
                                            return res.status(201).json({ message: 'Task added successfully, but assignee names could not be fetched.', task: { id: taskId, title: title.trim(), description: description || '', status: columnId, due: due || 'TBD', tags: tags || [], assignees: [], assignee_ids: assignee_ids, priority: priority || 'Low', createdAt: createdAt } });
                                        }
                                        const assigneesNames = users.map(u => u.username);
                                        const newTask = {
                                            id: taskId,
                                            title: title.trim(),
                                            description: description || '',
                                            status: columnId,
                                            due: due || 'TBD',
                                            tags: tags || [],
                                            assignees: assigneesNames, // Return array of names
                                            assignee_ids: assignee_ids, // Return array of IDs
                                            priority: priority || 'Low',
                                            createdAt: createdAt
                                        };
                                        res.status(201).json({ message: 'Task added successfully!', task: newTask });
                                    });
                                });
                            })
                            .catch(error => {
                                db.run('ROLLBACK;');
                                res.status(500).json({ message: 'Error adding task assignees.', error: error.message });
                            });
                    } else {
                        // If no assignees, just commit the task insertion
                        db.run('COMMIT;', (commitErr) => {
                            if (commitErr) {
                                console.error('[API POST /api/tasks ERROR] Error committing transaction after task insertion (no assignees):', commitErr.message);
                                return res.status(500).json({ message: 'Error committing task.' });
                            }
                            const newTask = {
                                id: taskId,
                                title: title.trim(),
                                description: description || '',
                                status: columnId,
                                due: due || 'TBD',
                                tags: tags || [],
                                assignees: [], // No assignees
                                assignee_ids: [], // No assignees
                                priority: priority || 'Low',
                                createdAt: createdAt
                            };
                            res.status(201).json({ message: 'Task added successfully!', task: newTask });
                        });
                    }
                }
            );
        });
    });
});


// Expects: { title, description, due, tags, assignee_ids, priority } in body
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, due, tags, assignee_ids, priority } = req.body; // Expect assignee_ids array

    if (!title) {
        return res.status(400).json({ message: 'Task title is required.' });
    }

    const tagsJson = JSON.stringify(tags || []);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        db.run(
            `UPDATE tasks SET title = ?, description = ?, due_date = ?, tags = ?, priority = ? WHERE id = ?`,
            [title.trim(), description || '', due || null, tagsJson, priority || 'Low', id],
            function (updateErr) {
                if (updateErr) {
                    console.error(`[API PUT /api/tasks/${id} ERROR] Error updating task details:`, updateErr.message);
                    db.run('ROLLBACK;');
                    return res.status(500).json({ message: 'Error updating task.' });
                }
                if (this.changes === 0) {
                    // Task not found or no changes to main task details
                    // Still proceed to update assignees if task found
                }

                // Update assignees: Delete existing and insert new ones
                db.run(`DELETE FROM task_assignees WHERE task_id = ?`, [id], (deleteAssigneesErr) => {
                    if (deleteAssigneesErr) {
                        console.error(`[API PUT /api/tasks/${id} ERROR] Error deleting old assignees:`, deleteAssigneesErr.message);
                        db.run('ROLLBACK;');
                        return res.status(500).json({ message: 'Error updating task assignees.' });
                    }

                    if (assignee_ids && assignee_ids.length > 0) {
                        const assigneesPromises = assignee_ids.map(userId => {
                            return new Promise((resolve, reject) => {
                                db.run(`INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)`, [id, userId], function(assigneeErr) {
                                    if (assigneeErr) {
                                        console.error(`[API PUT /api/tasks/${id} ERROR] Error assigning user ${userId} to task ${id}:`, assigneeErr.message);
                                        return reject(assigneeErr);
                                    }
                                    resolve();
                                });
                            });
                        });

                        Promise.all(assigneesPromises)
                            .then(() => {
                                db.run('COMMIT;', (commitErr) => {
                                    if (commitErr) {
                                        console.error('[API PUT /api/tasks/id ERROR] Error committing transaction after task and assignees update:', commitErr.message);
                                        return res.status(500).json({ message: 'Error committing task and assignees update.' });
                                    }
                                    res.status(200).json({ message: 'Task and assignees updated successfully!' });
                                });
                            })
                            .catch(error => {
                                db.run('ROLLBACK;');
                                res.status(500).json({ message: 'Error updating task assignees.', error: error.message });
                            });
                    } else {
                        // No assignees provided, just commit the main task update (and assignees were already deleted)
                        db.run('COMMIT;', (commitErr) => {
                            if (commitErr) {
                                console.error('[API PUT /api/tasks/id ERROR] Error committing transaction after task update (no assignees):', commitErr.message);
                                return res.status(500).json({ message: 'Error committing task update.' });
                            }
                            res.status(200).json({ message: 'Task updated successfully!' });
                        });
                    }
                });
            }
        );
    });
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

            // Delete assignees for the task first (due to ON DELETE CASCADE this might not be strictly needed but good practice)
            db.run(`DELETE FROM task_assignees WHERE task_id = ?`, [id], (deleteAssigneesErr) => {
                if (deleteAssigneesErr) {
                    console.error(`[API DELETE /api/tasks/${id} ERROR] Error deleting task assignees:`, deleteAssigneesErr.message);
                    db.run('ROLLBACK;');
                    return res.status(500).json({ message: 'Error deleting task assignees.' });
                }

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

// --- User Management Endpoints ---

// GET a single user's details by ID
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id, username, email, createdAt FROM users WHERE id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error(`[API GET /api/users/${id} ERROR] Error fetching user:`, err.message);
            return res.status(500).json({ message: 'Error fetching user details.' });
        }
        if (!row) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(row);
    });
});

// PUT (Edit) a user's details by ID
// Expects: { username, email, role } in body
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, email, role } = req.body;

    if (!username || !email || !role) {
        return res.status(400).json({ message: 'Username, email, and role are required.' });
    }

    const sql = `UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?`;
    db.run(sql, [username, email, role, id], function(err) {
        if (err) {
            console.error(`[API PUT /api/users/${id} ERROR] Error updating user:`, err.message);
            return res.status(500).json({ message: 'Error updating user.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }
        res.status(200).json({ message: 'User updated successfully!' });
    });
});

// DELETE a user by ID
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    // A crucial step: Decide how to handle tasks assigned to this user.
    // We will update their `assignee` to 'Unassigned' to avoid data integrity issues.
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        // Step 1: Update tasks assigned to this user
        // This logic needs to be updated for multi-assignee.
        // Instead of setting to 'Unassigned', we should remove the user from task_assignees.
        // For now, we'll just delete the user, and the ON DELETE CASCADE on task_assignees will handle it.
        // If you want to reassign tasks, that would be a more complex logic.

        // Step 2: Delete the user
        db.run(`DELETE FROM users WHERE id = ?`, [id], function(deleteErr) {
            if (deleteErr) {
                console.error(`[API DELETE /api/users/${id} ERROR] Error deleting user:`, deleteErr.message);
                db.run('ROLLBACK;');
                return res.status(500).json({ message: 'Error deleting user.' });
            }
            if (this.changes === 0) {
                db.run('ROLLBACK;');
                return res.status(404).json({ message: 'User not found.' });
            }

            db.run('COMMIT;', (commitErr) => {
                if (commitErr) {
                    console.error('[API DELETE /api/users/id ERROR] Error committing transaction after user deletion:', commitErr.message);
                    return res.status(500).json({ message: 'Error committing user deletion.' });
                }
                res.status(200).json({ message: 'User deleted successfully!' });
            });
        });
    });
});

// GET all users (team members)
app.get('/api/users', (req, res) => {
    const sql = "SELECT id, username, email, role, createdAt, avatar FROM users";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('[API GET /api/users ERROR] Error fetching users:', err.message);
            return res.status(500).json({ message: 'Error fetching team members.' });
        }
        res.status(200).json(rows);
    });
});

// GET /api/profile - Get the authenticated user's profile
app.get('/api/profile', authenticateToken, (req, res) => {
    // --- ADDED DEBUGGING LOGS ---
    console.log('[API GET /api/profile] Received request for user ID:', req.userId);
    // ----------------------------

    const sql = "SELECT id, username, email, role, avatar, googleId FROM users WHERE id = ?";
    db.get(sql, [req.userId], (err, row) => {
        if (err) {
            console.error('[API GET /api/profile ERROR]', err.message);
            return res.status(500).json({ message: 'Error fetching user profile.' });
        }
        if (!row) {
            // --- ADDED DEBUGGING LOGS ---
            console.warn(`[API GET /api/profile WARNING] User with ID ${req.userId} not found in database.`);
            // ----------------------------
            return res.status(404).json({ message: 'User not found.' });
        }

        // Add a placeholder for linked accounts to match the frontend UI
        const profileData = {
            ...row,
            linkedAccounts: {
                google: row.googleId ? row.email : null,
                slack: null,
                jira: null,
            }
        };

        // --- ADDED DEBUGGING LOGS ---
        console.log('[API GET /api/profile] Successfully fetched profile data:', profileData);
        // ----------------------------
        res.status(200).json(profileData);
    });
});


// PUT /api/profile - Update the authenticated user's profile
app.put('/api/profile', authenticateToken, (req, res) => {
    const { username, email, avatar } = req.body;

    // Check for a token to ensure the user is authenticated
    if (!req.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const sql = "UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?";
    db.run(sql, [username, email, avatar, req.userId], function(err) {
        if (err) {
            console.error('[API PUT /api/profile ERROR]', err.message);
            return res.status(500).json({ message: 'Error updating user profile.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        // Fetch the updated profile to send back to the client
        db.get("SELECT id, username, email, role, avatar FROM users WHERE id = ?", [req.userId], (err, row) => {
            if (err || !row) {
                return res.status(500).json({ message: 'Error fetching updated profile.' });
            }
            res.status(200).json(row);
        });
    });
});

// Add this new endpoint
app.put('/api/profile/password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!req.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    db.get('SELECT password_hash FROM users WHERE id = ?', [req.userId], async (err, user) => {
        if (err) {
            console.error('[API PUT /api/profile/password ERROR] Database error:', err.message);
            return res.status(500).json({ message: 'Server error.' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        try {
            const salt = await bcrypt.genSalt(10);
            const newPassword_hash = await bcrypt.hash(newPassword, salt);
            db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newPassword_hash, req.userId], function(updateErr) {
                if (updateErr) {
                    console.error('[API PUT /api/profile/password ERROR] Failed to update password:', updateErr.message);
                    return res.status(500).json({ message: 'Error updating password.' });
                }
                console.log(`[API PUT /api/profile/password] Password for user ${req.userId} successfully changed.`);
                res.status(200).json({ message: 'Password changed successfully.' });
            });
        } catch (hashError) {
            console.error('[API PUT /api/profile/password ERROR] Error hashing new password:', hashError);
            res.status(500).json({ message: 'Server error during password update.' });
        }
    });
});

// Add a new POST route to create a user
app.post('/api/users', (req, res) => {
    const { username, email, role } = req.body;
    // Check for required fields
    if (!email || !username || !role) {
        return res.status(400).json({ message: 'Username, email, and role are required.' });
    }

    const defaultAvatar = `https://ui-avatars.com/api/?name=${username}&size=40&background=random&color=fff`;
    const sql = `
        INSERT INTO users (username, email, role, avatar)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [username, email, role, defaultAvatar], function(err) {
        if (err) {
            console.error('Error creating new user:', err.message);
            return res.status(500).json({ message: 'Error creating new user.' });
        }

        // Return the newly created user's data
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: this.lastID,
                username: username,
                email: email,
                role: role,
                avatar: defaultAvatar
            }
        });
    });
});

// New route to get all team tasks (tasks with multiple assignees)
app.get('/api/team-tasks', (req, res) => {
    const sql = `
        SELECT 
            t.id, t.title, t.description, t.column_id, t.due_date, t.tags, t.priority, t.createdAt,
            GROUP_CONCAT(u.username) AS assignees
        FROM tasks t
        JOIN task_assignees ta ON t.id = ta.task_id
        JOIN users u ON ta.user_id = u.id
        GROUP BY t.id
        HAVING COUNT(ta.user_id) > 1
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching team tasks:', err.message);
            return res.status(500).json({ message: 'Error fetching team tasks.' });
        }
        res.json(rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags),
            assignees: row.assignees.split(',')
        })));
    });
});

// --- File Upload Configuration and Route ---

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    console.log(`[File Upload Setup] 'uploads' directory does not exist. Creating it...`);
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`[File Upload Setup] 'uploads' directory created successfully.`);
    } catch (mkdirErr) {
        console.error(`[File Upload ERROR] Error creating 'uploads' directory:`, mkdirErr.message);
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create a unique file name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('avatar'); // 'avatar' is the name of the form field

/**
 * Route to handle user avatar uploads.
 * Requires a valid JWT and a file with the field name 'avatar'.
 */
app.post('/api/profile/avatar', authenticateToken, (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('[API Avatar Upload ERROR] Multer error:', err.message);
            return res.status(400).json({ message: err.message });
        } else if (err) {
            console.error('[API Avatar Upload ERROR] Unknown upload error:', err.message);
            return res.status(500).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file was uploaded.' });
        }

        // Your `authenticateToken` middleware stores the user ID in `req.userId`
        const userId = req.userId;
        const newAvatarUrl = `/uploads/${req.file.filename}`;

        const sql = 'UPDATE users SET avatar = ? WHERE id = ?';
        db.run(sql, [newAvatarUrl, userId], function (dbErr) {
            if (dbErr) {
                console.error('Database error during avatar update:', dbErr);
                // Delete the uploaded file if the database update fails
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Failed to delete uploaded file:', unlinkErr);
                });
                return res.status(500).json({ message: 'Failed to update avatar in the database.' });
            }

            // Respond with the new avatar URL
            res.json({
                message: 'Avatar updated successfully',
                avatar: newAvatarUrl,
            });
        });
    });
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Closed the SQLite database connection.');
        process.exit(0);
    });
});

module.exports = app;
