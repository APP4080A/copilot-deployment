import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18+
import App from './App.jsx'; // FIX: Added .jsx extension
import './index.css'; // Optional: for global styles
import 'bootstrap/dist/css/bootstrap.min.css';

// Get the root DOM element where your React app will be mounted
const rootElement = document.getElementById('root');

// Create a React root and render your App component into it
ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
