// frontend/src/components/Navbar.jsx
import React, { useState, useContext } from 'react'; // Import useContext
import { Link, useLocation } from 'react-router-dom';


// Import the user avatar image directly
import userAvatar from '../assets/useravatar.jpg'; // Adjust path if assets is not directly in 'src'
import { TaskContext } from '../contexts/TaskContext'; // Import TaskContext

function Navbar() {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState(''); // State for the search input
    const { setGlobalSearchTerm } = useContext(TaskContext); // Get the setter for global search term from context

    // Function to handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Function to handle search button click or Enter key press
    const handleSearchSubmit = () => {
        // Update the global search term in the context
        setGlobalSearchTerm(searchTerm);
        console.log("Searching for:", searchTerm);
        // In a real application, you might also navigate to a specific page
        // if the search is meant to initiate a new view (e.g., /search-results?q=searchTerm)
    };

    // Handle Enter key press in the search input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    return (
        // Use Bootstrap's responsive navbar classes
        // navbar-expand-lg makes it collapse on screens smaller than 'lg'
        // bg-white and shadow-sm for styling
        // p-3 for padding, sticky-top to keep it at the top
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm p-3 sticky-top">
            <div className="container-fluid"> {/* Use container-fluid for full width */}
                {/* Navbar Brand/Logo */}
                <Link to="/dashboard" className="navbar-brand d-flex align-items-center">
                    {/* Placeholder for your actual logo. Can be an img or SVG. */}
                    <div className="me-2" style={{ width: '32px', height: '32px', backgroundColor: '#6941C6', borderRadius: '50%' }}></div>
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
                                value={searchTerm} // Controlled component
                                onChange={handleSearchChange} // Update state on change
                                onKeyPress={handleKeyPress} // Handle Enter key
                            />
                            <button className="btn btn-outline-secondary" type="button" onClick={handleSearchSubmit}>
                                <i className="bi bi-search"></i> {/* Bootstrap search icon */}
                            </button>
                        </div>
                        {/* User Avatar */}
                        <div className="dropdown">
                            <a className="d-block link-dark text-decoration-none dropdown-toggle" href="#" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                                {/* Use the imported image variable here */}
                                <img src={userAvatar} alt="User Avatar" width="40" height="40" className="rounded-circle" />
                            </a>
                            <ul className="dropdown-menu text-small shadow" aria-labelledby="dropdownUser">
                                <li><Link className="dropdown-item" to="/profile">Settings</Link></li>
                                <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><Link className="dropdown-item" to="/logout">Sign out</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;