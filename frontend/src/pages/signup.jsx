import React, { useState, useEffect } from "react";
import "./login.css";
import logo from '../assets/logo.png';
import google from '../assets/google.jpg';
import { Link, useNavigate } from 'react-router-dom';


export default function Signup() {
  // State to toggle password visibility for both password fields
  const [showPassword, setShowPassword] = useState(false);
  // States for all input fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // State to display error messages
  const [error, setError] = useState('');
  // State to display success messages
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Effect to handle redirects from Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const authError = params.get('error');
    const successMessage = params.get('message'); // Get the 'message' parameter

    if (token) {
      // This path is for successful Google LOGIN (existing user)
      localStorage.setItem('userToken', token);
      setMessage('Signup/Login successful via Google!');
      console.log('Google Signup/Login successful, token stored.');
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/dashboard'); // Redirect to dashboard
    } else if (successMessage === 'google_registration_success') {
      // Handle Google REGISTRATION success
      setMessage('Google account registered successfully! Please log in.');
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/'); // Redirect to the login page
    } else if (authError) {
      // This path is for any Google OAuth errors
      setError(`Google signup/login failed: ${authError.replace(/_/g, ' ')}`);
      console.error('Google signup/login error:', authError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate]);


  /**
   * Handles the signup form submission.
   * Performs client-side validation (e.g., all fields filled, passwords match, valid email)
   * and sends registration data to the backend.
   * @param {Event} e - The form submission event.
   */
  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError('');       // Clear previous errors
    setMessage('');     // Clear previous messages

    // Client-side validation: Check if all fields are filled
    if (!fullName || !email || !username || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    // Client-side validation: Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Basic client-side email format validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      // Send a POST request to the backend registration endpoint
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send username, email, and password.
        // Note: 'fullName' is collected but not sent to the backend's current DB schema.
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      // Check if the HTTP response status is successful
      if (response.ok) {
        setMessage(data.message); // Display success message from backend
        console.log('Signup successful:', data.message);
        // Optionally redirect to login page after successful signup
        // navigate('/'); // Example: Redirect to login page
      } else {
        // Display error message from backend (e.g., "Username already exists")
        setError(data.message || 'Signup failed. Please try again.');
        console.error('Signup failed:', data.message);
      }
    } catch (err) {
      // Handle network errors
      setError('Could not connect to the server. Please ensure the backend is running.');
      console.error('Network error or server down:', err);
    }
  };

  // Function to initiate Google login/signup flow
  const handleGoogleLogin = async () => {
    try {
      // Fetch the Google authorization URL from your backend
      const response = await fetch('http://localhost:5000/api/google-login');
      const data = await response.json();
      if (data.authUrl) {
        // Redirect the user's browser to Google's authentication page
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get Google authentication URL from backend.');
      }
    } catch (err) {
      setError('Could not initiate Google login. Server might be down.');
      console.error('Google login initiation error:', err);
    }
  };

  return (
      <div className="login-container">
        <div className="login-box">
          <img src={logo} alt="Co-pilot Logo" className="login-icon" />
          <h2>Create Your Co-pilot Account</h2>
          <p>Start streamlining your projects and collaboration.</p>
          <form onSubmit={handleSignup}>
            <input
                type="text"
                placeholder="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
            />
            <input
                type="email" // Use type="email" for better browser validation and mobile keyboard
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="text"
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <div className="password-wrapper">
              <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />
              <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
              >
              👁
            </span>
            </div>
            <div className="password-wrapper">
              <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
              >
              👁
            </span>
            </div>

            {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            {message && <p className="success-message" style={{ color: 'green', marginTop: '10px' }}>{message}</p>}

            <button type="submit" className="login-button">Sign Up</button>
            <div className="login-footer">
              <p>Already have an account? <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Log In</Link></p>
            </div>
          </form>
          <div className="divider">
            <hr /> <span>OR</span> <hr />
          </div>
          <button className="google-login" onClick={handleGoogleLogin}>
            <img src={google} alt="Google Icon" className="google-icon" />
            Continue with Google
          </button>
        </div>
      </div>
  );
}