import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from './pages/DashboardPage.jsx';
import TeamTasksPage from './pages/TeamTasksPage';
import TeamViewPage from './pages/TeamViewPage.jsx';
import TaskboardPage from './pages/TaskboardPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';

import AppLayout from './components/AppLayout.jsx';
import { TaskProvider } from './contexts/TaskContext.jsx';
import { SearchProvider } from './contexts/SearchContext.jsx';
import { UserProvider } from './contexts/UserContext.jsx';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('userToken');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default function App() {
    return (
        <Router>
            <Routes>
                {/* Public Authentication Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Main Application Routes (Protected) */}
                <Route element={
                    <ProtectedRoute>
                        <UserProvider>
                            <TaskProvider>
                                <SearchProvider>
                                    <AppLayout />
                                </SearchProvider>
                            </TaskProvider>
                        </UserProvider>
                    </ProtectedRoute>
                }>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/team" element={<TeamViewPage />} />
                    <Route path="/tasks" element={<TaskboardPage />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route path="/team-tasks" element={<TeamTasksPage />} />
                </Route>

                {/* Redirect any unmatched routes. */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
