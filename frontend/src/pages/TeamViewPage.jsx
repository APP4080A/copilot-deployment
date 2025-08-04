// src/pages/TeamViewPage.jsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TaskContext } from '../contexts/TaskContext';
import { useSearch } from '../contexts/SearchContext';
import Modal from 'react-modal';


Modal.setAppElement('#root');

// Helper component for highlighting text based on a search term
const HighlightText = ({ text, highlight }) => {
    if (!highlight) {
        return <span>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => (
                <span
                    key={i}
                    style={
                        part.toLowerCase() === highlight.toLowerCase()
                            ? { backgroundColor: '#ffff00', fontWeight: 'bold' }
                            : {}
                    }
                >
                    {part}
                </span>
            ))}
        </span>
    );
};

// Helper component for displaying individual task cards in the Team Tasks section
function TeamTaskCard({ task, searchTerm }) {
    if (!task) {
        return null;
    }

    const getPriorityBadgeClass = (priority) => {
        if (typeof priority !== 'string') return 'bg-secondary';
        switch (priority.toLowerCase()) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning text-dark';
            case 'low': return 'bg-info';
            default: return 'bg-secondary';
        }
    };

    const getStatusBadgeClass = (status) => {
        if (typeof status !== 'string') return 'bg-secondary';
        switch (status.toLowerCase()) {
            case 'to do': return 'bg-secondary';
            case 'in progress': return 'bg-primary';
            case 'done': return 'bg-success';
            case 'blocked': return 'bg-danger';
            case 'review': return 'bg-info';
            default: return 'bg-secondary';
        }
    };

    return (
        <div className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
                <h5 className="card-title fw-bold mb-1">
                    <HighlightText text={task.title} highlight={searchTerm} />
                </h5>
                <p className="card-text text-muted small mb-2 flex-grow-1 text-truncate" style={{ maxHeight: '3em', overflow: 'hidden' }}>
                    <HighlightText text={task.description} highlight={searchTerm} />
                </p>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small"><i className="bi bi-calendar me-1"></i>{task.due}</span>
                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{task.priority} Priority</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>{task.status}</span>
                    {task.assignees && task.assignees.length > 0 && (
                        <div className="d-flex align-items-center flex-shrink-0 ms-1">
                            {/* Display first two assignees, or more if space allows */}
                            {task.assignees.slice(0, 2).map((assigneeName, index) => (
                                <img
                                    key={index}
                                    src={`https://ui-avatars.com/api/?name=${assigneeName}&size=27&background=random&color=fff`}
                                    alt={assigneeName}
                                    className="rounded-circle me-1"
                                    style={{ width: '27px', height: '27px' }}
                                    title={assigneeName}
                                />
                            ))}
                            {task.assignees.length > 2 && (
                                <span className="text-muted small ms-1">+{task.assignees.length - 2}</span>
                            )}
                            <span className="text-muted small text-truncate ms-1" style={{ maxWidth: '80px' }}>
                                {task.assignees.join(', ')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Custom styles for the modals
const customModalStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '500px',
        padding: '2rem',
        borderRadius: '8px',
        border: 'none',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
    }
};

export default function TeamViewPage() {
    const [teamMembersData, setTeamMembersData] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Select Role...');
    const [inviteMessage, setInviteMessage] = useState(null);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [memberFilterRole, setMemberFilterRole] = useState('All Roles');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editedMember, setEditedMember] = useState({});

    // State for new multi-assignee task form
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskDue, setNewTaskDue] = useState('');
    const [newTaskTags, setNewTaskTags] = useState('');
    const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState([]); // Array of user IDs
    const [newTaskPriority, setNewTaskPriority] = useState('Low');
    const [newTaskMessage, setNewTaskMessage] = useState(null); // Message for new task form
    const [isCreateTeamTaskModalOpen, setIsCreateTeamTaskModalOpen] = useState(false); // New state for modal

    // Use the global search term from context
    const { searchTerm: globalSearchTerm } = useSearch();
    const { addTask, tasksData } = useContext(TaskContext); // Destructure addTask

    // Fetch team members from the backend
    const fetchTeamMembers = () => {
        fetch('http://localhost:5000/api/users')
            .then(res => res.json())
            .then(data => {
                const membersWithRoles = data.map(user => ({
                    ...user,
                    role: user.role || 'Member',
                    status: 'Active',
                    avatar: `https://ui-avatars.com/api/?name=${user.username}&size=40&background=random&color=fff`,
                }));
                setTeamMembersData(membersWithRoles);
            })
            .catch(error => console.error('Error fetching team members:', error));
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const getMemberStatusBadgeClass = (status) => {
        switch (status) {
            case 'Active': return 'bg-success';
            case 'Pending': return 'bg-warning text-dark';
            case 'Inactive': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    // --- Functional handlers for member actions ---
    const handleViewMember = (member) => {
        setSelectedMember(member);
        setIsViewModalOpen(true);
    };

    const handleEditMember = (member) => {
        setSelectedMember(member);
        setEditedMember({ ...member }); // Create a copy for editing
        setIsEditModalOpen(true);
    };

    const handleUpdateMember = (e) => {
        e.preventDefault();
        fetch(`http://localhost:5000/api/users/${editedMember.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: editedMember.username,
                email: editedMember.email,
                role: editedMember.role
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log(data.message); // For debugging
                setIsEditModalOpen(false);
                fetchTeamMembers(); // Re-fetch to update the list
            })
            .catch(error => console.error('Error updating member:', error));
    };

    const handleDeleteMember = (member) => {
        if (window.confirm(`Are you sure you want to delete ${member.username}? All of their tasks will have this assignee removed.`)) {
            fetch(`http://localhost:5000/api/users/${member.id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    console.log(data.message); // For debugging
                    fetchTeamMembers(); // Re-fetch to update the list
                })
                .catch(error => console.error('Error deleting member:', error));
        }
    };
    // ----------------------------------------------------

    const filteredTeamMembers = teamMembersData.filter(member => {
        const localSearchMatches = member.username.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(memberSearchTerm.toLowerCase());
        const matchesRole = memberFilterRole === 'All Roles' || member.role === memberFilterRole;
        return localSearchMatches && matchesRole;
    });

    const handleSendInvitation = async (e) => {
        e.preventDefault();
        if (!inviteEmail || inviteRole === 'Select Role...') {
            setInviteMessage({ type: 'danger', text: 'Please enter an email and select a role.' });
            return;
        }

        const newMemberData = {
            username: inviteEmail.split('@')[0],
            email: inviteEmail,
            role: inviteRole,
        };

        try {
            const response = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMemberData),
            });

            const result = await response.json();

            if (response.ok) {
                // If successful, update local state with the new member from the server response (which includes an ID)
                const newMember = { ...result.user, status: 'Pending', avatar: `https://ui-avatars.com/api/?name=${result.user.username}&size=40&background=random&color=fff` };
                setTeamMembersData(prevMembers => [...prevMembers, newMember]);
                setInviteMessage({ type: 'success', text: `Invitation sent to ${newMember.email}!` });
            } else {
                throw new Error(result.message || 'Failed to send invitation.');
            }

        } catch (error) {
            console.error('Error sending invitation:', error);
            setInviteMessage({ type: 'danger', text: error.message });
        } finally {
            setInviteEmail('');
            setInviteRole('Select Role...');
            setTimeout(() => setInviteMessage(null), 5000);
        }
    };

    // Handle multi-select for assignees
    const handleAssigneeSelectChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedIds = selectedOptions.map(option => parseInt(option.value, 10));
        setNewTaskAssigneeIds(selectedIds);
    };

    // Handle adding a new multi-assignee task
    const handleAddTeamTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || newTaskAssigneeIds.length === 0) {
            setNewTaskMessage({ type: 'danger', text: 'Task title and at least one assignee are required.' });
            return;
        }
        if (newTaskAssigneeIds.length < 2) { // Enforce at least 2 assignees for "team task"
            setNewTaskMessage({ type: 'danger', text: 'Team tasks require at least two assignees.' });
            return;
        }

        try {
            await addTask('todo', { // Default to 'todo' column
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                due: newTaskDue,
                tags: newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
                assignee_ids: newTaskAssigneeIds,
                priority: newTaskPriority
            });
            setNewTaskMessage({ type: 'success', text: 'Team task added successfully!' });
            // Clear form fields and close modal
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskDue('');
            setNewTaskTags('');
            setNewTaskAssigneeIds([]);
            setNewTaskPriority('Low');
            setIsCreateTeamTaskModalOpen(false); // Close modal on success
        } catch (error) {
            console.error("Error adding team task:", error);
            setNewTaskMessage({ type: 'danger', text: `Failed to add team task: ${error.message}` });
        } finally {
            setTimeout(() => setNewTaskMessage(null), 3000);
        }
    };


    // Memoize the filtered tasks based on the global searchTerm
    const filteredTasksByGlobalSearch = useMemo(() => {
        if (!globalSearchTerm) {
            return tasksData;
        }
        const lowercasedSearchTerm = globalSearchTerm.toLowerCase();
        return tasksData.filter(task =>
            task.title.toLowerCase().includes(lowercasedSearchTerm) ||
            (task.description && task.description.toLowerCase().includes(lowercasedSearchTerm)) ||
            (task.assignees && task.assignees.some(assignee => assignee.toLowerCase().includes(lowercasedSearchTerm))) ||
            (task.tags && task.tags.some(tag => tag.toLowerCase().includes(lowercasedSearchTerm)))
        );
    }, [tasksData, globalSearchTerm]);

    const totalTasks = filteredTasksByGlobalSearch.length;
    const remainingTasks = filteredTasksByGlobalSearch.filter(task => task.status !== 'done' && task.status !== 'blocked').length;
    const tasksCompleted = filteredTasksByGlobalSearch.filter(task => task.status === 'done').length;
    const newInvitesCount = teamMembersData.filter(member => member.status === 'Pending').length;
    const allRoles = ["All Roles", "Project Manager", "Lead Developer", "UI/UX Designer", "QA Specialist", "Frontend Developer", "Backend Developer"];

    // Filter tasks to show only those with 2 or more assignees from the global search results
    const teamTasks = filteredTasksByGlobalSearch.filter(task => task.assignees && task.assignees.length >= 2);

    // Create an array of 4 slots to ensure a consistent layout
    const taskSlots = useMemo(() => {
        const sortedTasks = teamTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
        const slots = [...sortedTasks];
        while (slots.length < 4) {
            slots.push(null); // Use null to represent an empty slot
        }
        return slots;
    }, [teamTasks]);


    return (
        <div className="d-flex flex-column min-vh-100 bg-light" style={{minWidth: '1240px'}}>
            <main className="flex-grow-1 p-4" style={{minWidth: '1000px'}}>

                <section className="mb-4">
                    <h2 className="mb-3 text-primary">Team Overview</h2>
                    <div className="row g-4">
                        <div className="col-12 col-sm-6 col-md-3">
                            <div className="card text-center p-3 shadow-sm h-100">
                                <h5 className="card-title text-muted fw-normal">Total Members</h5>
                                <p className="display-4 fw-bold text-primary mb-0">{teamMembersData.length}</p>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                            <div className="card text-center p-3 shadow-sm h-100">
                                <h5 className="card-title text-muted fw-normal">Remaining Tasks</h5>
                                <p className="display-4 fw-bold text-warning mb-0">{remainingTasks}</p>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                            <div className="card text-center p-3 shadow-sm h-100">
                                <h5 className="card-title text-muted fw-normal">Tasks Completed</h5>
                                <p className="display-4 fw-bold text-success mb-0">{tasksCompleted}</p>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                            <div className="card text-center p-3 shadow-sm h-100">
                                <h5 className="card-title text-muted fw-normal">New Invites</h5>
                                <p className="display-4 fw-bold text-info mb-0">{newInvitesCount}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-4">
                    <div style={{
                        backgroundColor: 'white',
                        padding: '32px',
                        borderRadius: '10px',
                        boxShadow: '0 0 12px rgba(0, 0, 0, 0.05)',
                        width: '100%',
                        fontFamily: 'Inter, sans-serif',
                        margin: '0 auto',
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '4px',
                        }}>Invite New Members</h2>

                        <p style={{
                            fontSize: '14px',
                            color: '#777',
                            marginBottom: '24px',
                        }}>Send invitations to new team members via email.</p>

                        {inviteMessage && (
                            <div className={`alert alert-${inviteMessage.type} alert-dismissible fade show`}
                                 role="alert">
                                {inviteMessage.text}
                                <button type="button" className="btn-close" onClick={() => setInviteMessage(null)}
                                        aria-label="Close"></button>
                            </div>
                        )}

                        <form onSubmit={handleSendInvitation} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gridTemplateRows: 'auto auto',
                            gap: '16px',
                            alignItems: 'end',
                        }}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <label htmlFor="inviteEmailInput"
                                       style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Email
                                    Address</label>
                                <input
                                    type="email"
                                    id="inviteEmailInput"
                                    placeholder="Enter recipient's email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                    style={{
                                        padding: '12px 14px',
                                        fontSize: '14px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        backgroundColor: 'white',
                                        color: 'black',
                                    }}
                                />
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <label htmlFor="inviteRoleSelect"
                                       style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Role</label>
                                <select
                                    id="inviteRoleSelect"
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    required
                                    style={{
                                        padding: '12px 14px',
                                        fontSize: '14px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        backgroundColor: 'white',
                                        color: 'black',
                                    }}
                                >
                                    <option defaultValue>Select Role...</option>
                                    <option>Project Manager</option>
                                    <option>Lead Developer</option>
                                    <option>UI/UX Designer</option>
                                    <option>QA Specialist</option>
                                    <option>Frontend Developer</option>
                                    <option>Backend Developer</option>
                                </select>
                            </div>

                            <div style={{
                                gridColumn: '2 / 3',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'flex-end'
                            }}>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#6c63ff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        fontSize: '14px',
                                    }}
                                >
                                    + Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <section className="mb-4">
                    <div className="card shadow-sm p-4">
                        <h3 className="mb-3">Team Members</h3>
                        <div className="d-flex flex-column flex-md-row justify-content-between mb-3 gap-2">
                            <input
                                type="text"
                                className="form-control me-md-2"
                                style={{maxWidth: '300px'}}
                                placeholder="Search members..."
                                value={memberSearchTerm}
                                onChange={(e) => setMemberSearchTerm(e.target.value)}
                            />
                            <select
                                className="form-select w-auto"
                                value={memberFilterRole}
                                onChange={(e) => setMemberFilterRole(e.target.value)}
                            >
                                {allRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                <tr>
                                    <th scope="col">Member</th>
                                    <th scope="col">Role</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredTeamMembers.length > 0 ? (
                                    filteredTeamMembers.map(member => (
                                        <tr key={member.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img src={member.avatar} alt={`${member.username} Avatar`}
                                                         className="rounded-circle me-2"
                                                         style={{width: '40px', height: '40px'}}/>
                                                    <div>
                                                        <div className="fw-bold">{member.username}</div>
                                                        <div className="text-muted small">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{member.role}</td>
                                            <td><span
                                                className={`badge ${getMemberStatusBadgeClass(member.status)}`}>{member.status}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button onClick={() => handleViewMember(member)}
                                                            className="btn btn-sm btn-outline-secondary" title="View"><i
                                                        className="bi bi-eye"></i></button>
                                                    <button onClick={() => handleEditMember(member)}
                                                            className="btn btn-sm btn-outline-primary" title="Edit"><i
                                                        className="bi bi-pencil"></i></button>
                                                    <button onClick={() => handleDeleteMember(member)}
                                                            className="btn btn-sm btn-outline-danger" title="Delete"><i
                                                        className="bi bi-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted py-4">No members found
                                            matching your criteria.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Team Tasks Section - now displaying a fixed 4-column grid */}
                <section>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="mb-0">Team Tasks (Collaborative)</h2>
                        <button
                            className="btn btn-success btn-sm shadow-sm me-2"
                            onClick={() => setIsCreateTeamTaskModalOpen(true)}
                            style={{padding: '8px 16px', fontSize: '0.9rem', borderRadius: '6px'}}
                        >
                            + Create New Team Task
                        </button>
                    </div>
                    <div className="row g-4">
                        {taskSlots.map((task, index) => (
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3"
                                 key={task ? task.id : `placeholder-${index}`}>
                                {task ? (
                                    <TeamTaskCard task={task} searchTerm={globalSearchTerm}/>
                                ) : (
                                    <div className="card h-100 shadow-sm border-dashed text-center text-muted"
                                         style={{padding: '2rem'}}>
                                        <div
                                            className="d-flex flex-column align-items-center justify-content-center h-100">
                                            <i className="bi bi-kanban display-4 mb-2"></i>
                                            <p className="fw-bold mb-0">Empty Slot</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-4">
                        <Link to="/team-tasks" className="btn btn-outline-primary">All Team Tasks <i className="bi bi-arrow-right"></i></Link>                    </div>
                </section>
            </main>

            {/* View Member Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onRequestClose={() => setIsViewModalOpen(false)}
                style={customModalStyles}
                contentLabel="View Member Details"
            >
                <div className="modal-header">
                    <h5 className="modal-title">Member Details</h5>
                    <button type="button" className="btn-close" onClick={() => setIsViewModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                    {selectedMember && (
                        <div>
                            <div className="d-flex align-items-center mb-3">
                                <img src={selectedMember.avatar} alt={`${selectedMember.username} Avatar`}
                                     className="rounded-circle me-3" style={{width: '60px', height: '60px'}}/>
                                <div>
                                    <h4 className="mb-0">{selectedMember.username}</h4>
                                    <p className="text-muted small mb-0">{selectedMember.email}</p>
                                </div>
                            </div>
                            <hr/>
                            <p><strong>Role:</strong> {selectedMember.role}</p>
                            <p><strong>Status:</strong> <span
                                className={`badge ${getMemberStatusBadgeClass(selectedMember.status)}`}>{selectedMember.status}</span>
                            </p>
                            <p>
                                <strong>Joined:</strong> {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Edit Member Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={() => setIsEditModalOpen(false)}
                style={customModalStyles}
                contentLabel="Edit Member Details"
            >
                <div className="modal-header">
                    <h5 className="modal-title">Edit Member</h5>
                    <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                    {editedMember && (
                        <form onSubmit={handleUpdateMember}>
                            <div className="mb-3">
                                <label htmlFor="editUsername" className="form-label">Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="editUsername"
                                    value={editedMember.username || ''}
                                    onChange={(e) => setEditedMember({...editedMember, username: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="editEmail" className="form-label">Email address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="editEmail"
                                    value={editedMember.email || ''}
                                    onChange={(e) => setEditedMember({...editedMember, email: e.target.value})}
                                    required
                                />
                            </div>
                            {/* New Role Selector */}
                            <div className="mb-3">
                                <label htmlFor="editRole" className="form-label">Role</label>
                                <select
                                    className="form-select"
                                    id="editRole"
                                    value={editedMember.role || ''}
                                    onChange={(e) => setEditedMember({...editedMember, role: e.target.value})}
                                >
                                    {allRoles.filter(role => role !== 'All Roles').map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="d-flex justify-content-end">
                                <button type="button" className="btn btn-secondary me-2"
                                        onClick={() => setIsEditModalOpen(false)}>Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>

            {/* Create New Team Task Modal */}
            <Modal
                isOpen={isCreateTeamTaskModalOpen}
                onRequestClose={() => setIsCreateTeamTaskModalOpen(false)}
                style={customModalStyles}
                contentLabel="Create New Team Task"
            >
                <div className="modal-header">
                    <h5 className="modal-title">Create New Team Task</h5>
                    <button type="button" className="btn-close"
                            onClick={() => setIsCreateTeamTaskModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                    <p style={{
                        fontSize: '14px',
                        color: '#777',
                        marginBottom: '24px',
                    }}>Assign tasks to multiple team members for collaborative efforts.</p>

                    {newTaskMessage && (
                        <div className={`alert alert-${newTaskMessage.type} alert-dismissible fade show`} role="alert">
                            {newTaskMessage.text}
                            <button type="button" className="btn-close" onClick={() => setNewTaskMessage(null)}
                                    aria-label="Close"></button>
                        </div>
                    )}

                    <form onSubmit={handleAddTeamTask} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        alignItems: 'end',
                    }}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <label htmlFor="teamTaskTitle"
                                   style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Task Title</label>
                            <input
                                type="text"
                                id="teamTaskTitle"
                                placeholder="Enter task title"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <label htmlFor="teamTaskDescription"
                                   style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Description
                                (Optional)</label>
                            <textarea
                                id="teamTaskDescription"
                                placeholder="Task description"
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                rows="2"
                                className="form-control"
                            />
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <label htmlFor="teamTaskDue" style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Due
                                Date</label>
                            <input
                                type="date"
                                id="teamTaskDue"
                                value={newTaskDue}
                                onChange={(e) => setNewTaskDue(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <label htmlFor="teamTaskTags"
                                   style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Tags
                                (comma-separated)</label>
                            <input
                                type="text"
                                id="teamTaskTags"
                                placeholder="e.g., UI, Backend, Testing"
                                value={newTaskTags}
                                onChange={(e) => setNewTaskTags(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <label htmlFor="teamTaskPriority"
                                   style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Priority</label>
                            <select
                                id="teamTaskPriority"
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value)}
                                className="form-select"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <label htmlFor="teamTaskAssignees"
                                   style={{fontSize: '14px', marginBottom: '6px', color: '#333'}}>Assignees (Select
                                multiple)</label>
                            <select
                                id="teamTaskAssignees"
                                multiple
                                value={newTaskAssigneeIds}
                                onChange={handleAssigneeSelectChange}
                                required
                                className="form-select"
                                style={{minHeight: '100px'}}
                            >
                                {teamMembersData.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.username} ({member.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{
                            gridColumn: '1 / 3',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'flex-end'
                        }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '14px',
                                }}
                            >
                                + Create Team Task
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}