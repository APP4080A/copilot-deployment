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
                return res.redirect(`http://localhost:3000/?error=server_error`);
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
                res.redirect(`http://localhost:3000/?token=${appToken}`);
            } else {
                // New user: Register them
                console.log(`[API Google Callback] New Google user: ${username} (${email})`);
                db.run(`INSERT INTO users (username, email, googleId, password_hash) VALUES (?, ?, ?, ?)`,
                    [username, email, googleId, null], // password_hash is null for Google users
                    function (insertErr) {
                        if (insertErr) {
                            console.error('[API Google Callback ERROR] Database error during new Google user insertion:', insertErr.message);
                            return res.redirect(`http://localhost:3000/?error=registration_failed`);
                        }
                        console.log(`[API Google Callback] Google user ${username} registered with ID: ${this.lastID}`);
                        // For new Google users, redirect to the login page with a success message, not a token.
                        return res.redirect(`http://localhost:3000/?message=google_registration_success`);
                    }
                );
                // Important: Return here to prevent further execution before db.run callback finishes
                return;
            }
        });

    } catch (error) {
        console.error('[API Google Callback ERROR] Google OAuth process error:', error);
        // Redirect to frontend with an error message
        res.redirect(`http://localhost:3000/?error=google_auth_failed`);
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