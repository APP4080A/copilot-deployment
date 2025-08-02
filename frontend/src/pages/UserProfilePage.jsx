// src/pages/UserProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function UserProfilePage() {
    const { user, loading, fetchUserProfile, setUser } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [message, setMessage] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarMessage, setAvatarMessage] = useState(null);

    // New state for password change modal
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [passwordMessage, setPasswordMessage] = useState(null);

    const navigate = useNavigate();

    // Placeholder data for fields not yet handled by the backend
    const placeholderData = {
        role: "User", // Default role
        joinDate: "N/A", // Will be updated if backend provides it
        linkedAccounts: {
            google: null,
            slack: null,
            jira: null,
        },
        privacySettings: {
            dataSharing: false,
            personalizedAds: false,
        }
    };

    useEffect(() => {
        if (user) {
            setEditFormData({
                username: user.username,
                email: user.email,
                privacySettings: user.privacySettings || placeholderData.privacySettings,
            });
        }
    }, [user, loading]);

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        navigate('/login');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('userToken');
        if (!token) {
            setMessage({ type: 'danger', text: 'Authentication token not found. Please log in.' });
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: editFormData.username,
                    email: editFormData.email
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser({ ...user, ...updatedUser }); // Update the user context
                setIsEditing(false);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile.');
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'danger', text: `Failed to update profile: ${error.message}` });
        } finally {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditFormData({
                username: user.username,
                email: user.email,
                privacySettings: user.privacySettings || placeholderData.privacySettings,
            }); // Populate form with current user data
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setEditFormData(prevData => ({
                ...prevData,
                privacySettings: {
                    ...prevData.privacySettings,
                    [name]: checked
                }
            }));
        } else {
            setEditFormData({ ...editFormData, [name]: value });
        }
    };

    // New handler functions for password and 2FA
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);
        const { currentPassword, newPassword, confirmNewPassword } = passwordFormData;

        if (newPassword !== confirmNewPassword) {
            setPasswordMessage({ type: 'danger', text: 'New passwords do not match.' });
            return;
        }
        if (currentPassword === newPassword) {
            setPasswordMessage({ type: 'danger', text: 'New password cannot be the same as the current password.' });
            return;
        }

        const token = localStorage.getItem('userToken');
        try {
            const response = await fetch('http://localhost:5000/api/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();
            if (response.ok) {
                setPasswordMessage({ type: 'success', text: data.message || 'Password updated successfully!' });
                setIsPasswordModalOpen(false); // Close the modal on success
            } else {
                setPasswordMessage({ type: 'danger', text: data.message || 'Failed to change password.' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setPasswordMessage({ type: 'danger', text: 'Network error. Please try again.' });
        } finally {
            setTimeout(() => setPasswordMessage(null), 5000);
        }
    };

    const handlePasswordChangeToggle = () => {
        setIsPasswordModalOpen(!isPasswordModalOpen);
        setPasswordFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setPasswordMessage(null);
    };

    const handleResetPasswordViaEmail = async () => {
        // This will call the backend to send a password reset email
        try {
            const email = user.email;
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
            } else {
                setMessage({ type: 'danger', text: data.message || 'Failed to send reset link.' });
            }
        } catch (error) {
            setMessage({ type: 'danger', text: 'Network error, failed to send reset link.' });
        } finally {
            setTimeout(() => setMessage(null), 5000);
        }
    };

    // Placeholder functions for 2FA
    const handleEnable2FA = () => {
        setMessage({ type: 'info', text: 'Enabling 2FA functionality is not yet implemented.' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDisable2FA = () => {
        setMessage({ type: 'info', text: 'Disabling 2FA functionality is not yet implemented.' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleManageRecoveryCodes = () => {
        setMessage({ type: 'info', text: 'Managing recovery codes functionality is not yet implemented.' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteAccount = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            setMessage({ type: 'danger', text: 'Authentication token not found. Please log in.' });
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                localStorage.removeItem('userToken');
                navigate('/login');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete account.');
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            setMessage({ type: 'danger', text: `Failed to delete account: ${error.message}` });
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    const handleAvatarChange = async (e) => {
        e.preventDefault();
        if (!avatarFile) {
            setAvatarMessage({ type: 'danger', text: 'Please select a file to upload.' });
            return;
        }

        const token = localStorage.getItem('userToken');
        if (!token) {
            setAvatarMessage({ type: 'danger', text: 'Authentication token not found. Please log in.' });
            return;
        }

        const formData = new FormData();
        formData.append('avatar', avatarFile);

        try {
            const response = await fetch('http://localhost:5000/api/profile/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(prevUser => ({ ...prevUser, avatar: updatedUser.avatar }));
                setAvatarMessage({ type: 'success', text: 'Avatar updated successfully!' });
                const modalElement = document.getElementById('avatarUpdateModal');
                const modal = window.bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            } else {
                let errorText = 'Failed to upload avatar: An unexpected error occurred.';
                // Read the response body once, based on its content type
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorText = errorData.message || 'Failed to upload avatar: An unexpected JSON error occurred.';
                } else {
                    const responseText = await response.text();
                    errorText = `Failed to upload avatar: Server responded with an unexpected format. Response was: "${responseText.substring(0, 100)}..."`;
                }
                throw new Error(errorText);
            }
        } catch (error) {
            console.error("Error updating avatar:", error);
            setAvatarMessage({ type: 'danger', text: error.message });
        } finally {
            setTimeout(() => setAvatarMessage(null), 5000);
        }
    };

    if (loading || !user) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light p-4">
                <div className="card shadow p-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 pb-5">
            <main className="container pt-5">
                {message && (
                    <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3`}
                         role="alert">
                        {message.text}
                    </div>
                )}
                {passwordMessage && (
                    <div
                        className={`alert alert-${passwordMessage.type === 'success' ? 'success' : 'danger'} rounded-3`}
                        role="alert">
                        {passwordMessage.text}
                    </div>
                )}
                <div className="card shadow mb-5 p-4 p-md-5 text-center">
                    <div className="position-relative d-inline-block mx-auto mb-3">
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&size=100&background=random&color=fff`}
                            alt="User avatar"
                            className="rounded-circle mx-auto mb-4 border border-5 border-primary"
                            style={{width: '120px', height: '120px', objectFit: 'cover'}}
                        />
                        <button className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0"
                                data-bs-toggle="modal" data-bs-target="#avatarUpdateModal"
                                title="Update Avatar"
                                style={{width: '32px', height: '32px', padding: '0'}}>
                            <i className="bi bi-camera-fill"></i>
                        </button>
                    </div>
                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label visually-hidden">Username</label>
                                <input
                                    type="text"
                                    className="form-control text-center fs-4 fw-bold"
                                    id="username"
                                    name="username"
                                    value={editFormData.username}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label visually-hidden">Email</label>
                                <input
                                    type="email"
                                    className="form-control text-center"
                                    id="email"
                                    name="email"
                                    value={editFormData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="d-flex justify-content-center gap-2">
                                <button type="submit" className="btn btn-primary fw-medium px-4 py-2">Save</button>
                                <button type="button" className="btn btn-secondary fw-medium px-4 py-2"
                                        onClick={handleEditToggle}>Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h1 className="h4 card-title fw-bold text-dark mb-1">{user.username}</h1>
                            <p className="lead text-primary fw-semibold mb-4">{user.email}</p>
                            <div
                                className="d-flex justify-content-center align-items-center text-muted flex-wrap gap-4 mb-4">
                                <div className="d-flex align-items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="16" height="16"
                                         fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                                        <path fillRule="evenodd"
                                              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                                    </svg>
                                    <span>Role: {user.role}</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="16" height="16"
                                         fill="currentColor" viewBox="0 0 16 16">
                                        <path
                                            d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z"/>
                                    </svg>
                                    <span>Joined: {user.joinDate}</span>
                                </div>
                            </div>
                            <button
                                className="btn fw-medium px-4 py-2"
                                style={{backgroundColor: 'white', color: 'black', border: '1px solid #dee2e6'}}
                                onClick={handleEditToggle}
                            >
                                Edit Profile
                            </button>
                        </>
                    )}
                </div>

                {/* Middle Sections – Privacy and Linked Accounts side-by-side */}
                <div className="row g-4 mb-4">
                    {/* Privacy Settings */}
                    <div className="col-lg-6">
                        <div className="card shadow p-4 h-100">
                            <h2 className="h5 card-title fw-bold text-dark mb-4 d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="24" height="24"
                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                Privacy Settings
                            </h2>
                            <div className="row g-4">
                                <div className="col-12">
                                    <div
                                        className="form-check p-3 border rounded-3 bg-light d-flex align-items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="dataSharing"
                                            name="dataSharing"
                                            checked={editFormData.privacySettings?.dataSharing}
                                            onChange={handleChange}
                                            className="form-check-input mt-1 flex-shrink-0"
                                        />
                                        <label htmlFor="dataSharing" className="form-check-label d-block w-100">
                                            <span className="fw-medium text-dark d-block">Allow data sharing with third-party partners.</span>
                                            <p className="text-muted mb-0 d-block">This may enable integrations with
                                                other services.</p>
                                        </label>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div
                                        className="form-check p-3 border rounded-3 bg-light d-flex align-items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="personalizedAds"
                                            name="personalizedAds"
                                            checked={editFormData.privacySettings?.personalizedAds}
                                            onChange={handleChange}
                                            className="form-check-input mt-1 flex-shrink-0"
                                        />
                                        <label htmlFor="personalizedAds" className="form-check-label d-block w-100">
                                            <span className="fw-medium text-dark d-block">Receive personalized advertisements.</span>
                                            <p className="text-muted mb-0 d-block">Opting in allows us to show you
                                                relevant content.</p>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linked Accounts */}
                    <div className="col-lg-6">
                        <div className="card shadow p-4 h-100">
                            <h2 className="h5 card-title fw-bold text-dark mb-4 d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="24" height="24"
                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                </svg>
                                Linked Accounts
                            </h2>
                            <div className="row g-3">
                                <div className="col-md-12">
                                    <div
                                        className="card bg-light p-3 d-flex flex-row justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            {/* Google "G" icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                 viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2"
                                                 strokeLinecap="round" strokeLinejoin="round">
                                                <path
                                                    d="M12 10.9v2.8h5.6c-.3 1.8-1.2 2.8-3.3 2.8-2.6 0-4.7-2.1-4.7-4.7s2.1-4.7 4.7-4.7c1.4 0 2.4.6 3.2 1.4l2.1-2.1c-1.4-1.3-3.2-2.1-5.3-2.1-4.4 0-8 3.6-8 8s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5-.1-1-.2-1.5H12z"/>
                                            </svg>
                                            <div>
                                                <span className="fw-semibold text-dark text-capitalize">Google</span>
                                                <p className="small text-muted mb-0">{user.linkedAccounts.google || 'Not Linked'}</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-sm" style={{
                                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                            color: '#dc3545',
                                            borderColor: '#dc3545'
                                        }}>
                                            Disconnect
                                        </button>
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div
                                        className="card bg-light p-3 d-flex flex-row justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            {/* Slack chat icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                 viewBox="0 0 24 24" fill="none" stroke="#4A154B" strokeWidth="2"
                                                 strokeLinecap="round" strokeLinejoin="round">
                                                <path
                                                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                            <div>
                                                <span className="fw-semibold text-dark text-capitalize">Slack</span>
                                                <p className="small text-muted mb-0">{user.linkedAccounts.slack || 'Not Linked'}</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-sm" style={{
                                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                            color: '#dc3545',
                                            borderColor: '#dc3545'
                                        }}>
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-12">
                                    <div
                                        className="card bg-light p-3 d-flex flex-row justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            {/* Jira briefcase icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                                                 viewBox="0 0 24 24" stroke="#0052CC" strokeWidth="2"
                                                 strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                <rect x="2" y="6" width="20" height="14" rx="2"></rect>
                                                <path d="M12 12h.01"></path>
                                            </svg>
                                            <div>
                                                <span className="fw-semibold text-dark text-capitalize">Jira</span>
                                                <p className="small text-muted mb-0">{user.linkedAccounts.jira || 'Not Linked'}</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-sm" style={{
                                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                            color: '#dc3545',
                                            borderColor: '#dc3545'
                                        }}>
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - Account Settings (full width) */}
                <div className="row g-4">
                    <div className="col-12">
                        <div className="card shadow p-4">
                            <h2 id="account-settings" className="h5 card-title fw-bold text-dark mb-4">Account
                                Settings</h2>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item dropdown py-3 border-bottom-1">
                                    <button
                                        className="btn btn-link dropdown-toggle text-dark fw-medium p-0 text-decoration-none d-flex align-items-center justify-content-between w-100 text-start"
                                        type="button" id="changePasswordDropdown" data-bs-toggle="dropdown"
                                        aria-expanded="false">
                                        <div className="d-flex align-items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="24"
                                                 height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v3h8z"/>
                                            </svg>
                                            <span>Change Password</span>
                                        </div>
                                    </button>
                                    <ul className="dropdown-menu" aria-labelledby="changePasswordDropdown">
                                        <li>
                                            <button className="dropdown-item"
                                                    onClick={handleResetPasswordViaEmail}>Reset Password via Email
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item" data-bs-toggle="modal"
                                                    data-bs-target="#changePasswordModal">Change Password Manually
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-group-item dropdown py-3 border-bottom-1">
                                    <button
                                        className="btn btn-link dropdown-toggle text-dark fw-medium p-0 text-decoration-none d-flex align-items-center justify-content-between w-100 text-start"
                                        type="button" id="twoFactorAuthDropdown" data-bs-toggle="dropdown"
                                        aria-expanded="false">
                                        <div className="d-flex align-items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="24"
                                                 height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M15 7a2 2 0 012 2v5.5a3.5 3.5 0 01-7 0V9a2 2 0 012-2zM12 11v6m0 0a2 2 0 100 4 2 2 0 000-4z"/>
                                            </svg>
                                            <span>Two-Factor Authentication</span>
                                        </div>
                                    </button>
                                    <ul className="dropdown-menu" aria-labelledby="twoFactorAuthDropdown">
                                        <li>
                                            <button className="dropdown-item" onClick={handleEnable2FA}>Enable 2FA
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item" onClick={handleDisable2FA}>Disable 2FA
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item" onClick={handleManageRecoveryCodes}>Manage
                                                Recovery Codes
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-group-item py-3">
                                    <button
                                        className="btn btn-link text-danger fw-medium p-0 text-decoration-none d-flex align-items-center justify-content-between w-100 text-start"
                                        type="button" onClick={handleDeleteAccount}>
                                        <div className="d-flex align-items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="24"
                                                 height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                            <span>Delete Account</span>
                                        </div>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
            {/* Delete Account Modal */}
            <div className={`modal fade${isDeleteModalOpen ? ' show d-block' : ''}`} tabIndex="-1" role="dialog"
                 style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title text-dark">Confirm Account Deletion</h5>
                            <button type="button" className="btn-close" onClick={handleCloseDeleteModal}></button>
                        </div>
                        <div className="modal-body text-dark">
                            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                            <p>All of your data will be permanently removed.</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary"
                                    onClick={handleCloseDeleteModal}>Cancel
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>Delete My
                                Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade" id="changePasswordModal" tabIndex="-1"
                 aria-labelledby="changePasswordModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title text-dark" id="changePasswordModalLabel">Change Password</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"
                                    aria-label="Close"></button>
                        </div>
                        <form onSubmit={handlePasswordChange}>
                            <div className="modal-body">
                                {passwordMessage && (
                                    <div
                                        className={`alert alert-${passwordMessage.type === 'success' ? 'success' : 'danger'}`}
                                        role="alert">
                                        {passwordMessage.text}
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label htmlFor="currentPasswordInput" className="form-label">Current
                                        Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="currentPasswordInput"
                                        name="currentPassword"
                                        value={passwordFormData.currentPassword}
                                        onChange={(e) => setPasswordFormData({
                                            ...passwordFormData,
                                            currentPassword: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="newPasswordInput" className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="newPasswordInput"
                                        name="newPassword"
                                        value={passwordFormData.newPassword}
                                        onChange={(e) => setPasswordFormData({
                                            ...passwordFormData,
                                            newPassword: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="confirmNewPasswordInput" className="form-label">Confirm New
                                        Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="confirmNewPasswordInput"
                                        name="confirmNewPassword"
                                        value={passwordFormData.confirmNewPassword}
                                        onChange={(e) => setPasswordFormData({
                                            ...passwordFormData,
                                            confirmNewPassword: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary"
                                        data-bs-dismiss="modal">Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Change Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* NEW AVATAR UPLOAD MODAL */}
            <div className="modal fade" id="avatarUpdateModal" tabIndex="-1" aria-labelledby="avatarUpdateModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="avatarUpdateModalLabel">Update Profile Picture</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"
                                    id="avatar-modal-close"></button>
                        </div>
                        <form onSubmit={handleAvatarChange}>
                            <div className="modal-body">
                                {avatarMessage && (
                                    <div
                                        className={`alert alert-${avatarMessage.type === 'success' ? 'success' : 'danger'}`}
                                        role="alert">
                                        {avatarMessage.text}
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label htmlFor="avatarFile" className="form-label">Choose new avatar</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="avatarFile"
                                        accept="image/*"
                                        onChange={(e) => setAvatarFile(e.target.files[0])}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}