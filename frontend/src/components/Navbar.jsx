// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './../pages/styles/Navbar.css';
function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <div className="navbar-logo"></div>
                <span className="navbar-name">Co-Pilot</span>
            </div>
            <ul className="navbar-nav-links">
                <li>
                    <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        Dashboard
                    </Link>
                </li>
                <li>
                    <Link to="/team" className={`nav-link ${location.pathname === '/team' ? 'active' : ''}`}>
                        Team
                    </Link>
                </li>
                <li>
                    <Link to="/tasks" className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}>
                        Task Board
                    </Link>
                </li>
                <li>
                    <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                        Profile
                    </Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;