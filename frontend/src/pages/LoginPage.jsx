// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import logo from '../assets/logo.png';
import google from '../assets/google.jpg';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
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
    const successMessage = params.get('message');

    if (token) {
      // This path is for successful Google LOGIN (existing user)
      localStorage.setItem('userToken', token);
      setMessage('Login successful via Google!');
      console.log('Google Login successful, token stored.');
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/tasks'); // Redirect to TaskboardPage after Google login
    } else if (successMessage === 'google_registration_success') {
      // Handle Google REGISTRATION success: Display message on login page
      setMessage('Google account registered successfully! Please log in.');
      window.history.replaceState({}, document.title, window.location.pathname);

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
        navigate('/tasks'); // Redirect to TaskboardPage after successful login
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
      <div className="container-fluid bg-light min-vh-100 d-flex justify-content-center align-items-center px-3"
          style={{ overflow: "hidden", paddingTop: "40px", paddingBottom: "40px"}}>
          <div className="bg-white p-4 rounded-4 shadow-lg w-100"
           style={{ maxWidth: "420px", minHeight:"auto" }}>
            <div className="text-center mb-4">
              <img src={logo} alt="Co-pilot Logo" className="mb-3" style={{ width: "50px" }} />
              <h4 className="fw-bold">Log In</h4>
              <p className="text-muted mb-0">Start streamlining your projects and collaboration.</p>
            </div>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mb-3 position-relative">
              <input type={showPassword ? "text" : "password"} className="form-control" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <span className="position-absolute top-50 end-0 translate-middle-y me-3" role="button" onClick={() => setShowPassword(!showPassword)}>👁</span>
            </div>

            {error && <p className="text-danger text-center">{error}</p>}
            {message && <p className="text-success text-center">{message}</p>}

            <button type="submit" className="btn btn-primary w-100 mb-3">Log In</button>
            <p className="text-center">
              <Link to="/forgot-password" className="text-primary text-decoration-none">Forgot Password?</Link>
              <p>Don't have an account? <Link to="/signup" className="text-primary text-decoration-none">Sign Up</Link></p>
            </p>
          </form>

          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1" />
            <span className="px-2 text-muted">OR</span>
            <hr className="flex-grow-1" />
          </div>

          <button className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center" onClick={handleGoogleLogin}>
                  <img src={google} alt="Google Icon" className="me-2" style={{ width: "20px", height: "20px" }} />
                  Continue with Google
          </button>
        </div>
      </div>
  );
}
