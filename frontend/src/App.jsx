import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';

function App() {
    return (
        <Router>
            <Routes>
                {/* Route for the login page, accessible at the root URL */}
                <Route path="/" element={<Login />} />
                {/* Route for the signup page, accessible at /signup */}
                <Route path="/signup" element={<Signup />} />
                {/*
          TODO: Add a route for your dashboard here.
          Example: <Route path="/dashboard" element={<Dashboard />} />
          Remember to create a Dashboard.jsx component in src/pages/ and import it.
        */}
            </Routes>
        </Router>
    );
}

export default App;