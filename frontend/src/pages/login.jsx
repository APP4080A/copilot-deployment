import React, { useState, useEffect } from "react";
import "./login.css";
import logo from '../assets/logo.png';
import google from '../assets/google.jpg';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Effect to handle redirects from Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const authError = params.get('error');
    const successMessage = params.get('message'); // Get the 'message' parameter

    if (token) {
      // This path is for successful Google LOGIN (existing user)
      localStorage.setItem('userToken', token);
      setMessage('Login successful via Google!');
      console.log('Google Login successful, token stored.');
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/dashboard'); // Redirect to dashboard
    } else if (successMessage === 'google_registration_success') {
      // Handle Google REGISTRATION success: Display message on login page
      setMessage('Google account registered successfully! Please log in.');
      window.history.replaceState({}, document.title, window.location.pathname);
      // No navigation needed here, as the user is already on the login page
    } else if (authError) {
      // This path is for any Google OAuth errors
      setError(`Google login failed: ${authError.replace(/_/g, ' ')}`);
      console.error('Google login error:', authError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        localStorage.setItem('userToken', data.token);
        console.log('Login successful, token stored:', data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please try again.');
        console.error('Login failed:', data.message);
      }
    } catch (err) {
      setError('Could not connect to the server. Please ensure the backend is running.');
      console.error('Network error or server down:', err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/google-login');
      const data = await response.json();
      if (data.authUrl) {
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
          <h2>Log In</h2>
          <p>Start streamlining your projects and collaboration.</p>
          <form onSubmit={handleLogin}>
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

            {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            {message && <p className="success-message" style={{ color: 'green', marginTop: '10px' }}>{message}</p>}

            <button type="submit" className="login-button">Login</button>
            <div className="login-footer">
              <a href="#">Forgot Password?</a>
              <p>Don't have an account? <Link to="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>Sign Up</Link></p>
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
