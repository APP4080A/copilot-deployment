// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './../pages/styles/Navbar.css';
function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
        <div className="container-fluid justify-content-between">
            <span className="navbar-brand fw-bold">Co-Pilot</span>

            <div className="mx-auto">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0 d-flex flex-row gap-4">
                    <li className="nav-item"><a className="nav-link" href="team">Team</a></li>
                    <li className="nav-item"><a className="nav-link active" href="tasks">Task Board</a></li>
                    <li className="nav-item"><a className="nav-link" href="profile">Profile</a></li>
                </ul>
            </div>

            <form className="d-flex">
                <input
                className="form-control me-2"
                type="search"
                placeholder="Search tasks..."
                aria-label="Search"
                 />
            </form>

            <Link to="/" className="ms-3" title="Logout">
                <i className="fas fa-power-off text-dark"></i>
            </Link>
        </div>
        </nav>

    );
}

export default Navbar;