// src/pages/LandingPage.jsx

import React from 'react';
import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div className="container-fluid bg-light px-0 overflow-hidden">

            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
                <div className="container-fluid">
                    <span className="navbar-brand fw-bold">Co-Pilot</span>
                    <div className="d-flex">
                        <Link to="/signup" className="btn btn-primary me-2">Sign Up</Link>
                        <Link to="/login" className="btn btn-outline-secondary">Login</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="text-center py-5 text-white" style={{ background: "linear-gradient(to right, #e66465, #9198e5)", overflow: "hidden"}}>
                <div className="container-fluid">
                    <h1 className="display-5 fw-bold">Elevate Your Team's Productivity with Co-Pilot</h1>
                    <p className="lead mt-3 mb-4 text-dark">
                        Co-Pilot is the ultimate project management tool designed for modern teams.
                        Streamline workflows, enhance collaboration, and achieve your goals faster.
                    </p>
                    <div>
                        <Link to="/signup" className="btn btn-primary btn-lg me-3">Get Started – It’s Free</Link>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="container-fluid py-5">
                <h2 className="text-center fw-bold">Why Choose Co-Pilot?</h2>
                <p className="text-center text-muted mb-5">
                    Discover the powerful features that make Co-Pilot the preferred choice
                    for teams committed to efficiency and success.
                </p>
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {features.map((f, i) => (
                        <div className="col" key={i}>
                            <div className="card h-100 shadow-sm text-center p-4">
                                <div className="fs-2 mb-3">{f.icon}</div>
                                <h5 className="card-title fw-semibold">{f.title}</h5>
                                <p className="card-text text-muted">{f.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

const features = [
    {
        title: "Effortless Task Management",
        description: "Organize, prioritize, and track all your tasks with intuitive tools. Never miss a deadline again.",
        icon: "🗒️",
    },
    {
        title: "Seamless Team Collaboration",
        description: "Communicate, share files, and collaborate in real-time with your team members.",
        icon: "👥",
    },
    {
        title: "Insightful Performance Analytics",
        description: "Gain deep insights into project progress and team performance with dashboards.",
        icon: "📈",
    },
    {
        title: "Integrated Scheduling",
        description: "Plan and manage project timelines, meetings, and deadlines in one calendar view.",
        icon: "📅",
    },
    {
        title: "Customizable Workflows",
        description: "Adapt Co-Pilot to your unique processes with flexible and configurable workflows.",
        icon: "⚙️",
    },
    {
        title: "AI-Powered Suggestions",
        description: "Leverage intelligent recommendations for task assignments and resource allocation.",
        icon: "🤖",
    },
    {
        title: "Robust Security",
        description: "Your data is protected with industry-leading security protocols and standards.",
        icon: "🔒",
    },
    {
        title: "Contextual Communication",
        description: "Discuss tasks and projects directly where the work happens, reducing context switching.",
        icon: "💬",
    },
    {
        title: "Smart Notifications",
        description: "Stay informed without the noise, receive only the alerts that matter most to your workflow.",
        icon: "🔔",
    }
];