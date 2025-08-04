// src/pages/LoginPage.jsx

import React, { useState, useEffect } from "react";
import "./styles/LoginPage.css";
import logo from '../assets/logo.png';
import google from '../assets/google.jpg';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location object

  // This useEffect hook handles the Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleToken = params.get('token');
    const registrationMessage = params.get('message');
    const authError = params.get('error');

    if (googleToken) {
      // If a token is in the URL, it means the Google login was successful
      localStorage.setItem('userToken', googleToken);
      console.log('Google login successful, token stored:', googleToken);
      navigate('/tasks'); // Redirect to tasks page
    } else if (registrationMessage === 'google_registration_success') {
      // Handle successful registration, maybe show a message
      setError('Registration with Google was successful! Please try logging in again.');
      // Clear the message from the URL
      navigate(location.pathname, { replace: true });
    } else if (authError) {
      // Handle errors from the Google callback
      setError('Google authentication failed. Please try again.');
      // Clear the error from the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]); // Rerun this effect when location changes

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

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
        localStorage.setItem('userToken', data.token);
        console.log('Login successful, token stored:', data.token);
        navigate('/tasks');
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
          {/* Your logo and header content */}
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

            <button type="submit" className="login-button">Login</button>
            <div className="login-footer">
              <Link to="/forgot-password" style={{ color: '#007bff', textDecoration: 'none' }}>Forgot Password?</Link>
              <p>Don't have an account? <Link to="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>Sign Up</Link></p>
            </div>
          </form>
          <div className="divider">
            <hr /> <span>OR</span> <hr />
          </div>
          <button className="google-login" onClick={handleGoogleLogin}>
            {/* Your Google icon */}
            Continue with Google
          </button>
        </div>
      </div>
  );
}