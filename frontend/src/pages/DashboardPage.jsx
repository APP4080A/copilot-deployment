// frontend/src/pages/DashboardPage.jsx
// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TaskContext } from '../contexts/TaskContext';

// Import the chart components
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function DashboardPage() {
    const { tasksData, loading, error } = useContext(TaskContext);
    const [teamMembersData, setTeamMembersData] = useState([]);
    const [taskStatusData, setTaskStatusData] = useState({ labels: [], datasets: [] });

    // Fetch team members from your backend API
    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const membersWithAvatars = data.map(user => ({
                ...user,
                name: user.username,
                avatar: `https://ui-avatars.com/api/?name=${user.username}&size=40&background=random&color=fff`,
            }));
            setTeamMembersData(membersWithAvatars);
        } catch (e) {
            console.error("Failed to fetch team members:", e);
        }
    };

    // New useEffect to fetch and process data for the chart
    useEffect(() => {
        const fetchChartData = () => {
            // Check if tasksData is available and not empty
            if (tasksData && tasksData.length > 0) {
                // Aggregate task counts by status
                const statusCounts = tasksData.reduce((acc, task) => {
                    const status = task.status || 'Other';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});

                const labels = Object.keys(statusCounts);
                const data = Object.values(statusCounts);

                // Define colors for each status
                const backgroundColors = labels.map(status => {
                    switch(status.toLowerCase()) {
                        case 'to do': return 'rgba(108, 117, 125, 0.6)'; // grey
                        case 'in progress': return 'rgba(13, 110, 253, 0.6)'; // blue
                        case 'done': return 'rgba(25, 135, 84, 0.6)'; // green
                        case 'blocked': return 'rgba(220, 53, 69, 0.6)'; // red
                        case 'review': return 'rgba(13, 202, 240, 0.6)'; // cyan
                        default: return 'rgba(108, 117, 125, 0.6)';
                    }
                });

                const borderColors = labels.map(status => {
                    switch(status.toLowerCase()) {
                        case 'to do': return 'rgba(108, 117, 125, 1)';
                        case 'in progress': return 'rgba(13, 110, 253, 1)';
                        case 'done': return 'rgba(25, 135, 84, 1)';
                        case 'blocked': return 'rgba(220, 53, 69, 1)';
                        case 'review': return 'rgba(13, 202, 240, 1)';
                        default: return 'rgba(108, 117, 125, 1)';
                    }
                });

                setTaskStatusData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Tasks by Status',
                            data: data,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
                            borderWidth: 1,
                        },
                    ],
                });
            }
        };

        fetchTeamMembers();
        fetchChartData();
    }, [tasksData]);

    const totalTasks = tasksData.length;
    const completedTasks = tasksData.filter(task => task.status === 'done').length;
    const overdueTasks = useMemo(() => {
        const today = new Date();
        return tasksData.filter(task => {
            const dueDate = new Date(task.due);
            return task.status !== 'done' && dueDate < today;
        }).length;
    }, [tasksData]);

    // Define options for the chart
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Task Status Breakdown',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
    };

    if (loading) {
        return <div className="text-center py-5">Loading dashboard data...</div>;
    }

    if (error) {
        return <div className="alert alert-danger text-center">{error}</div>;
    }

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <main className="container-fluid p-4">
                <header className="mb-4">
                    <h1 className="fw-bold text-primary">Dashboard</h1>
                    <p className="text-muted fs-5 mb-4" style={{ fontFamily: 'inherit' }}>A quick overview of your team's progress and upcoming tasks.</p>
                </header>

                <section className="mb-5">
                    <div className="row g-4">
                        <div className="col-12 col-sm-6 col-md-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="bg-primary text-white p-3 rounded-circle me-3">
                                        <i className="bi bi-list-task fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 className="card-title text-muted mb-0">Total Tasks</h5>
                                        <p className="card-text fs-2 fw-bold mb-0">{totalTasks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-md-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="bg-success text-white p-3 rounded-circle me-3">
                                        <i className="bi bi-check-circle fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 className="card-title text-muted mb-0">Tasks Completed</h5>
                                        <p className="card-text fs-2 fw-bold mb-0">{completedTasks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="bg-danger text-white p-3 rounded-circle me-3">
                                        <i className="bi bi-exclamation-triangle fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 className="card-title text-muted mb-0">Overdue Tasks</h5>
                                        <p className="card-text fs-2 fw-bold mb-0">{overdueTasks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="row g-4">
                    <div className="col-lg-7">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title fw-bold mb-0">Task Status Breakdown</h5>
                                </div>
                                <div className="chart-container" style={{ height: '300px' }}>
                                    {taskStatusData.datasets.length > 0 && <Bar data={taskStatusData} options={chartOptions} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-5">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title fw-bold mb-3">Quick Actions</h5>
                                <div className="list-group mb-4">
                                    <Link to="/team" className="list-group-item list-group-item-action">
                                        <i className="bi bi-people me-2 text-primary"></i>Manage Team Members
                                    </Link>
                                    <Link to="/tasks" className="list-group-item list-group-item-action">
                                        <i className="bi bi-plus-circle me-2 text-success"></i>Create a New Task
                                    </Link>
                                </div>
                                <h5 className="card-title fw-bold mt-4 mb-3">Team</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {teamMembersData.slice(0, 6).map(member => (
                                        <div key={member.id} className="d-flex align-items-center border rounded p-2 bg-light">
                                            <img src={member.avatar} alt={member.name} className="rounded-circle me-2" />
                                            <small className="fw-bold">{member.name}</small>
                                        </div>
                                    ))}
                                    {teamMembersData.length > 6 && (
                                        <Link to="/team" className="btn btn-sm btn-outline-primary align-self-center">
                                            +{teamMembersData.length - 6} more
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default DashboardPage;