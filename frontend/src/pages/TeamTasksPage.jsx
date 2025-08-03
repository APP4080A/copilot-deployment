import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import TaskCard from '../components/TaskCard';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';

const TeamTasksPage = () => {
    const { user } = useUser();
    const [teamTasks, setTeamTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeamTasks = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/team-tasks');
                if (!response.ok) {
                    throw new Error('Failed to fetch team tasks.');
                }
                const data = await response.json();
                setTeamTasks(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeamTasks();
    }, []);

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <div className="text-center text-danger mt-5">Error: {error}</div>;
    }

    // Sort tasks by createdAt date
    const sortedTasks = [...teamTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">All Team Tasks</h2>
                    <Link to="/team" className="btn btn-outline-secondary">
                        <i className="bi bi-arrow-left me-2"></i>Back to Team View
                    </Link>
                </div>
                {sortedTasks.length === 0 ? (
                    <div className="alert alert-info">
                        No team tasks have been created yet.
                    </div>
                ) : (
                    <div className="row g-4">
                        {sortedTasks.map(task => (
                            <div key={task.id} className="col-12 col-md-6 col-lg-4">
                                <TaskCard
                                    task={task}
                                    onTaskUpdated={() => { /* Not needed for this page but good practice */ }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamTasksPage;