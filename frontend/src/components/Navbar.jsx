// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

import userAvatar from '../assets/useravatar.jpg';
import { useSearch } from '../contexts/SearchContext';

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, loading } = useUser();

    // Use the global search context
    const { searchTerm, setSearchTerm } = useSearch();

    // Function to handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Function to handle search button click or Enter key press
    const handleSearchSubmit = () => {
        console.log("Global search term updated to:", searchTerm);
    };

    // Function to handle Enter key press in the search input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    const handleLogout = () => {
        // Remove the user's token from local storage
        localStorage.removeItem('userToken');
        // Redirect the user to the login page
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm p-3 sticky-top">
            <div className="container-fluid">
                {/* Navbar Brand/Logo */}
                <Link to="/dashboard" className="navbar-brand d-flex align-items-center">
                    <img
                        src="https://img.icons8.com/arcade/64/c-key.png"
                        alt="Co-Pilot Logo"
                        className="me-2"
                        style={{ width: '32px', height: '32px' }}
                    />
                    <span className="fw-bold fs-5 text-dark">Co-Pilot</span>
                </Link>

                {/* Toggler for mobile view */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Collapse - contains nav links, search, and user avatar */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    {/* Navigation Links */}
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0"> {/* me-auto pushes other items to the right */}
                        <li className="nav-item">
                            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active text-primary fw-bold' : 'text-dark'}`}>
                                Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/team" className={`nav-link ${location.pathname === '/team' ? 'active text-primary fw-bold' : 'text-dark'}`}>
                                Team
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/tasks" className={`nav-link ${location.pathname === '/tasks' ? 'active text-primary fw-bold' : 'text-dark'}`}>
                                Task Board
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active text-primary fw-bold' : 'text-dark'}`}>
                                Profile
                            </Link>
                        </li>
                    </ul>

                    {/* Search Bar and User Avatar - aligned to the right */}
                    <div className="d-flex align-items-center ms-lg-auto"> {/* ms-lg-auto pushes this group to the far right on large screens */}
                        <div className="input-group me-3"> {/* me-3 for spacing */}
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search tasks, teams, users…"
                                aria-label="Search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyPress={handleKeyPress}
                            />
                            <button className="btn btn-outline-secondary" type="button" onClick={handleSearchSubmit}>
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                        {/* User Avatar */}
                        <div className="dropdown">
                            <a className="d-block link-dark text-decoration-none dropdown-toggle" href="#" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                                {loading ? (
                                    <div className="rounded-circle bg-secondary" style={{ width: '40px', height: '40px' }}></div>
                                ) : (
                                    <img src={user?.avatar || userAvatar} alt="User Avatar" width="40" height="40" className="rounded-circle" />
                                )}
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end text-small shadow" aria-labelledby="dropdownUser">
                                <li><Link className="dropdown-item" to="/profile#account-settings">Settings</Link></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item" onClick={handleLogout}>Sign out</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;