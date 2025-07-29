// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from './pages/DashboardPage.jsx';
import TeamViewPage from './pages/TeamViewPage.jsx';
import TaskboardPage from './pages/TaskboardPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';

import AppLayout from './components/AppLayout.jsx';
import { TaskProvider } from './contexts/TaskContext.jsx';

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
                {/* Wrap the main application routes with the TaskProvider.
                    This ensures that DashboardPage, TeamViewPage, TaskboardPage,
                    and UserProfilePage (and any components they render)
                    can access the TaskContext. */}
                <Route element={
                    <TaskProvider>
                        <AppLayout />
                    </TaskProvider>
                }>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/team" element={<TeamViewPage />} />
                    <Route path="/tasks" element={<TaskboardPage />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                </Route>

                {/* Redirect any unmatched routes.
                    Consider redirecting to /login if unauthenticated access
                    to other routes should lead to login. */}
                <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
        </Router>
    );
}

export default App;