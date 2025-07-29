import React, { useState } from "react";
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // New state for loading indicator

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true); // Set loading to true when submission starts

        if (!email) {
            setError('Please enter your email address.');
            setIsLoading(false); // Stop loading if validation fails
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail(''); // Clear the input field on success
            } else {
                setError(data.message || 'An unexpected error occurred.');
            }
        } catch (err) {
            console.error('Error during password reset request:', err);
            setError('Failed to connect to the server. Please try again later.');
        } finally {
            setIsLoading(false); // Always set loading to false when request finishes
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <img src={logo} alt="Co-pilot Logo" className="login-icon" />
                <h2>Forgot Password?</h2>
                <p>Enter your email address below and we'll send you a link to reset your password.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading} // Disable input while loading
                    />

                    {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    {message && <p className="success-message" style={{ color: 'green', marginTop: '10px' }}>{message}</p>}

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <div className="login-footer">
                        <p><Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Back to Login</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
}
