// src/components/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import Navbar from './Navbar'; // Import your Navbar component

function AppLayout() {
    return (
        <div className="app-layout">
            <Navbar /> {/* The Navbar will always be rendered here */}
            <main className="app-content">
                <Outlet /> {/* This is where the nested route components will be rendered */}
            </main>
        </div>
    );
}

export default AppLayout;