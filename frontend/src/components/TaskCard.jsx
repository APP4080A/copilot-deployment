// src/components/TaskCard.jsx

import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const TaskCard = ({ task }) => {
    if (!task) {
        return null;
    }

    const getPriorityBadgeClass = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning text-dark';
            case 'low': return 'bg-success';
            default: return 'bg-secondary';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Completed': return 'border-success';
            case 'In Progress': return 'border-warning';
            case 'To Do': return 'border-primary';
            default: return 'border-light';
        }
    };

    return (
        <div className={`card shadow-sm h-100 ${getStatusClass(task.status)}`}>
            <div className="card-body d-flex flex-column">
                <h5 className="card-title text-truncate">
                    <Link to={`/tasks/${task.id}`} className="text-decoration-none text-dark">
                        {task.title}
                    </Link>
                </h5>
                <p className="card-text text-muted small flex-grow-1">{task.description}</p>
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className={`badge rounded-pill ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                    </span>
                    <span className="text-muted small">
                        Due: {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'N/A'}
                    </span>
                </div>
            </div>
            <div className="card-footer bg-white border-top-0 d-flex flex-wrap justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <span className="text-muted small me-2">Assignees:</span>
                    <span className="fw-bold">{task.assignees ? task.assignees.join(', ') : 'Unassigned'}</span>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
