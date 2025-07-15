require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'our_very_strong_random_secret_key_here'; // **CHANGE THIS IN PRODUCTION**

// --- Google OAuth Configuration ---
const GOOGLE_CLIENT_ID = '346346971642-sqn2mfp07hsmumth3re7rjpo5auh92pv.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/google-auth-callback';

const oAuth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);
// --- End Google OAuth Configuration ---


// --- SQLite Database Setup ---
const db = new sqlite3.Database('./db/copilot.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database: ./db/copilot.db');

        // Updated 'users' table to include googleId for OAuth users
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      googleId TEXT UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (createUsersErr) => {
            if (createUsersErr) {
                console.error('Error creating users table:', createUsersErr.message);
            } else {
                console.log('Users table checked/created.');
            }
        });

        // Create 'tasks' table based on init.sql schema
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      status TEXT,
      priority TEXT,
      due_date TEXT,
      assigned_to INTEGER,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )`, (createTasksErr) => {
            if (createTasksErr) {
                console.error('Error creating tasks table:', createTasksErr.message);
            } else {
                console.log('Tasks table checked/created.');
            }
        });
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
                console.error('Database error during registration check:', err.message);
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
                        console.error('Database error during user insertion:', insertErr.message);
                        return res.status(500).json({ message: 'Server error during registration.' });
                    }
                    console.log(`User ${username} registered with ID: ${this.lastID}`);
                    res.status(201).json({ message: 'User registered successfully!', userId: this.lastID });
                }
            );
        });

    } catch (error) {
        console.error('Registration process error:', error);
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
                console.error('Database error during login check:', err.message);
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
        console.error('Login process error:', error);
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
    // In a real app, you'd typically have the frontend redirect directly
    // to this authorizeUrl, not have the backend do a redirect.
    // This endpoint is more for demonstrating how to generate the URL.
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
        console.error('No authorization code received from Google.');
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
                console.error('Database error during Google login/registration check:', err.message);
                // Redirect to frontend with an error message
                return res.redirect(`http://localhost:3000/?error=server_error`);
            }

            let appToken;
            if (user) {
                // User exists: Log them in
                console.log(`User ${user.username} logged in via Google.`);
                appToken = jwt.sign(
                    { id: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                // If user existed and logged in, redirect to frontend with token
                res.redirect(`http://localhost:3000/?token=${appToken}`);
            } else {
                // New user: Register them
                console.log(`New Google user: ${username} (${email})`);
                db.run(`INSERT INTO users (username, email, googleId, password_hash) VALUES (?, ?, ?, ?)`,
                    [username, email, googleId, null], // password_hash is null for Google users
                    function (insertErr) {
                        if (insertErr) {
                            console.error('Database error during new Google user insertion:', insertErr.message);
                            return res.redirect(`http://localhost:3000/?error=registration_failed`);
                        }
                        console.log(`Google user ${username} registered with ID: ${this.lastID}`);
                        // FIX: For new Google users, redirect to the login page with a success message, not a token.
                        return res.redirect(`http://localhost:3000/?message=google_registration_success`);
                    }
                );
                // Important: Return here to prevent further execution before db.run callback finishes
                return;
            }
        });

    } catch (error) {
        console.error('Google OAuth process error:', error);
        // Redirect to frontend with an error message
        res.redirect(`http://localhost:3000/?error=google_auth_failed`);
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
        console.error('Token verification failed:', error.message);
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