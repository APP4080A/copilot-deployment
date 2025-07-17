import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from './pages/DashboardPage.jsx';
import TeamViewPage from './pages/TeamViewPage.jsx';
import TaskboardPage from './pages/TaskboardPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';

function App() {
    return (
        <Router>
            <Routes>
                {/* Authentication Routes */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Main Application Routes */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/team" element={<TeamViewPage />} />
                <Route path="/tasks" element={<TaskboardPage />} />
                <Route path="/profile" element={<UserProfilePage />} />

            </Routes>
        </Router>
    );
}

export default App;