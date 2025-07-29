// src/pages/SignupPage.jsx
import React, { useState, useEffect } from "react";
import logo from '../assets/logo.png';
import google from '../assets/google.jpg';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setMessage('Signup/Login successful via Google!');
      console.log('Google Signup/Login successful, token stored.');
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/tasks'); // Redirect to TaskboardPage after Google login
    } else if (successMessage === 'google_registration_success') {
      // Handle Google REGISTRATION success: Display message and redirect to log in
      setMessage('Google account registered successfully! Please log in.');
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/'); // Redirect to the login page after Google registration
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
        // Note: 'fullName' is collected but not sent to the backend's current DB schema.
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      // Check if the HTTP response status is successful
      if (response.ok) {
        setMessage(data.message); // Display success message from backend
        console.log('Signup successful:', data.message);
        console.log('Attempting to navigate to login page...'); // Added console log for debugging

        setTimeout(() => {
          navigate('/');
          console.log('Navigation to login page initiated.');
        }, 100); // Small delay
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
  <div className="container-fluid bg-light min-vh-100 d-flex justify-content-center align-items-center px-3"
    style={{ overflow: "hidden", paddingTop: "40px", paddingBottom: "40px"}}>
    <div className="bg-white p-4 rounded-4 shadow-lg w-100"
     style={{ maxWidth: "420px", minHeight:"auto" }}>
      <div className="text-center mb-4">
        <img src={logo} alt="Co-pilot Logo" className="mb-3" style={{ width: "50px" }} />
        <h4 className="fw-bold">Create Your Co-pilot Account</h4>
        <p className="text-muted mb-0">Start streamlining your projects and collaboration.</p>
      </div>

      <form onSubmit={handleSignup}>
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <input type="email" className="form-control" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="mb-3 position-relative">
          <input type={showPassword ? "text" : "password"} className="form-control" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <span className="position-absolute top-50 end-0 translate-middle-y me-3" role="button" onClick={() => setShowPassword(!showPassword)}>👁</span>
        </div>
        <div className="mb-3 position-relative">
          <input type={showPassword ? "text" : "password"} className="form-control" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <span className="position-absolute top-50 end-0 translate-middle-y me-3" role="button" onClick={() => setShowPassword(!showPassword)}>👁</span>
        </div>

        {error && <p className="text-danger text-center">{error}</p>}
        {message && <p className="text-success text-center">{message}</p>}

        <button type="submit" className="btn btn-primary w-100 mb-3">Sign Up</button>
        <p className="text-center">
          Already have an account? <Link to="/login" className="text-primary text-decoration-none">Log In</Link>
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