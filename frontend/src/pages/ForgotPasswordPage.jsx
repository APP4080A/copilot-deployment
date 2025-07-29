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
        <div className="container-fluid bg-light min-vh-100 d-flex justify-content-center align-items-center px-3"
            style={{ overflow: "hidden", paddingTop: "40px", paddingBottom: "40px"}}>
            <div className="bg-white p-4 rounded-4 shadow-lg w-100"
             style={{ maxWidth: "420px", minHeight:"auto" }}>
              <div className="text-center mb-4">
                <img src={logo} alt="Co-pilot Logo" className="mb-3" style={{ width: "50px" }} />
                <h2 className="fw-bold">Forgot your password?</h2>
                <p className="text-muted mb-0">Enter your email address below and we'll send you a link to reset your password.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input type="email" className="form-control" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required />
                    </div>

                    {error && <p className="text-danger text-center">{error}</p>}
                    {message && <p className="text-success text-center">{message}</p>}

                    <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <div className="text-center">
                        <p><Link to="/login" className="text-primary text-decoration-none">Back to Login</Link></p>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
}
