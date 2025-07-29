//frontend/src/App.jsx

import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from './pages/DashboardPage.jsx';
import TeamViewPage from './pages/TeamViewPage.jsx';
import TaskboardPage from './pages/TaskboardPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css';


import AppLayout from './components/AppLayout.jsx';

function App() {
    return (
        <Router>
            <Routes>
                {/* Authentication Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Main Application Routes */}
                <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/team" element={<TeamViewPage />} />
                <Route path="/tasks" element={<TaskboardPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
                </Route>

            {/*Redirect any unmatched routes to login or a 404 page */}
            <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;