// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './styles/LoginPage.css'; // <-- Import the same CSS file
import logo from '../assets/logo.png'; // Assuming your logo is also used here

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError('No reset token found in the URL. Please use the link from your email.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/reset-password', {
                token,
                newPassword: password
            });
            setMessage(response.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        }
    };

    if (error && !token) { // Only show this error if there's no token
        return (
            <div className="login-container">
                <div className="login-box text-center">
                    <img src={logo} alt="Co-pilot Logo" className="login-icon" />
                    <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>
                    <Link to="/forgot-password" className="btn btn-link">Request a New Link</Link>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="login-container">
                <div className="login-box text-center">
                    <img src={logo} alt="Co-pilot Logo" className="login-icon" />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <img src={logo} alt="Co-pilot Logo" className="login-icon" />
                <h2>Reset Your Password</h2>
                {message && <p className="success-message" style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
                {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
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
                            placeholder="Confirm New Password"
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
                    <button type="submit" className="login-button">Reset Password</button>
                </form>
            </div>
        </div>
    );
}