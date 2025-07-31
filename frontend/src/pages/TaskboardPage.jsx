// frontend/src/pages/TaskboardPage.jsx
import React, { useState, useContext, useMemo } from 'react';
import './styles/TaskboardTest.css';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities'; // Correct import for CSS utility

import { TaskContext } from '../contexts/TaskContext';
import { useSearch } from '../contexts/SearchContext'; // Re-import the search context


// Helper function to format column titles
const formatColumnTitle = (id) =>
    id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ').toUpperCase();

// TaskCard Component
function TaskCard({ task, id, isOverlay = false, onEditClick }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isOverlay && {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            cursor: 'grabbing',
            zIndex: 999,
            opacity: 0.9
        })
    };

    const handleEditButtonClick = (e) => {
        e.stopPropagation();
        onEditClick(task);
    };

    const getPriorityBadgeClass = (priority) => {
        if (typeof priority !== 'string') return 'bg-secondary';
        switch (priority.toLowerCase()) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning text-dark';
            case 'low': return 'bg-info';
            default: return 'bg-secondary';
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="card mb-2 shadow-sm task-card-custom-min-height">
            <div className="card-body p-3" {...attributes} {...listeners}>
                <h5 className="card-title fw-bold mb-1">{task.title}</h5>
                <p className="card-text text-muted small mb-2">
                    <i className="bi bi-calendar me-1"></i> {task.due}
                </p>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex flex-wrap gap-1">
                        {task.tags?.map((tag, idx) => (
                            <span key={idx} className="badge bg-info-subtle text-info fw-normal text-uppercase py-1 px-2 rounded-pill custom-tag-style">{tag}</span>
                        ))}
                    </div>
                    {task.priority && (
                        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                    )}
                </div>
                <div className="text-muted small">
                    <i className="bi bi-person me-1"></i>
                    {task.assignee}
                </div>
            </div>
            <button className="btn btn-sm btn-outline-secondary task-edit-btn-custom" onClick={handleEditButtonClick} title="Edit Task">
                <i className="bi bi-pencil"></i>
            </button>
        </div>
    );
}

// Column Component
function Column({ id, title, tasks, onAddTask, onDeleteColumn, onEditTaskClick }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [showInput, setShowInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskDue, setNewTaskDue] = useState('');
    const [newTaskTags, setNewTaskTags] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('Low');

    const handleAddNewTask = () => {
        if (newTaskTitle.trim()) {
            onAddTask(id, {
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim() || 'No description provided.',
                due: newTaskDue,
                tags: newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
                assignee: newTaskAssignee,
                priority: newTaskPriority
            });
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskDue('');
            setNewTaskTags('');
            setNewTaskAssignee('');
            setNewTaskPriority('Low');
            setShowInput(false);
        }
    };

    return (
        <div ref={setNodeRef} style={{minWidth: '300px'}} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div className="card border-0 bg-light p-3 h-100 column-inner-card">
                <div className="d-flex justify-content-between align-items-center mb-3" {...attributes} {...listeners}>
                    <h4 className="mb-0 text-capitalize">{title} <span className="badge bg-secondary rounded-pill ms-2">{tasks.length}</span></h4>
                    {onDeleteColumn && (
                        <button onClick={() => onDeleteColumn(id)} className="btn btn-sm btn-outline-danger" aria-label={`Delete column ${title}`}>
                            <i className="bi bi-trash"></i>
                        </button>
                    )}
                </div>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="task-list-container-custom flex-grow-1 overflow-auto pe-1">
                        {tasks.map((task) => (
                            <TaskCard key={task.id} id={task.id} task={task} onEditClick={onEditTaskClick} />
                        ))}
                    </div>
                </SortableContext>
                {showInput ? (
                    <div className="mt-3">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            placeholder="Task title"
                            className="form-control mb-2"
                        />
                        <textarea
                            value={newTaskDescription}
                            onChange={e => setNewTaskDescription(e.target.value)}
                            placeholder="Task description"
                            className="form-control mb-2"
                            rows="2"
                        />
                        <input
                            type="date"
                            value={newTaskDue}
                            onChange={e => setNewTaskDue(e.target.value)}
                            className="form-control mb-2"
                            title="Due Date"
                        />
                        <input
                            type="text"
                            value={newTaskTags}
                            onChange={e => setNewTaskTags(e.target.value)}
                            placeholder="Tags (comma-separated)"
                            className="form-control mb-2"
                        />
                        <input
                            type="text"
                            value={newTaskAssignee}
                            onChange={e => setNewTaskAssignee(e.target.value)}
                            placeholder="Assignee"
                            className="form-control mb-2"
                        />
                        <select
                            value={newTaskPriority}
                            onChange={e => setNewTaskPriority(e.target.value)}
                            className="form-select mb-2"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                        <div className="d-grid gap-2">
                            <button onClick={handleAddNewTask} className="btn btn-primary">
                                Add Task
                            </button>
                            <button onClick={() => setShowInput(false)} className="btn btn-outline-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button className="btn btn-outline-primary w-100 mt-3" onClick={() => setShowInput(true)}>+ Add New Task</button>
                )}
            </div>
        </div>
    );
}

// EditTaskModal Component
function EditTaskModal({ task, onSave, onClose }) {
    const [title, setTitle] = useState(task.title);
    const [due, setDue] = useState(task.due);
    const [tags, setTags] = useState(task.tags?.join(', '));
    const [assignee, setAssignee] = useState(task.assignee);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'Low');

    const handleSave = () => {
        onSave({
            ...task,
            title: title.trim(),
            description: description.trim(),
            due: due,
            tags: tags?.split(',').map(tag => tag.trim()).filter(tag => tag),
            assignee: assignee.trim(),
            priority: priority
        });
        onClose();
    };

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Task</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label htmlFor="edit-title" className="form-label">Title</label>
                            <input id="edit-title" type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-description" className="form-label">Description</label>
                            <textarea id="edit-description" className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows="3"></textarea>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-due" className="form-label">Due Date</label>
                            <input id="edit-due" type="date" className="form-control" value={due} onChange={e => setDue(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-tags" className="form-label">Tags (comma-separated)</label>
                            <input id="edit-tags" type="text" className="form-control" value={tags} onChange={e => setTags(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-assignee" className="form-label">Assignee</label>
                            <input id="edit-assignee" type="text" className="form-control" value={assignee} onChange={e => setAssignee(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-priority" className="form-label">Priority</label>
                            <select id="edit-priority" className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// TaskboardPage Main Component
export default function TaskboardPage() {
    const {
        tasksData,
        columnOrder,
        addTask,
        updateTaskStatus,
        updateTask,
        addColumn,
        deleteColumn,
        reorderColumn,
        fetchTasks // Ensure fetchTasks is destructured here
    } = useContext(TaskContext);

    const [newColumnName, setNewColumnName] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [editingTask, setEditingTask] = useState(null);

    // Re-import useSearch and use searchTerm for filtering
    const { searchTerm } = useSearch();

    // Memoize the filtered tasks based on the global searchTerm
    const filteredTasks = useMemo(() => {
        if (!searchTerm) {
            return tasksData; // If no search term, return all tasks
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return tasksData.filter(task =>
            task.title.toLowerCase().includes(lowercasedSearchTerm) ||
            (task.description && task.description.toLowerCase().includes(lowercasedSearchTerm)) ||
            (task.assignee && task.assignee.toLowerCase().includes(lowercasedSearchTerm)) ||
            (task.tags && task.tags.some(tag => tag.toLowerCase().includes(lowercasedSearchTerm)))
        );
    }, [tasksData, searchTerm]);

    // Update columns based on filteredTasks
    const columns = useMemo(() => {
        const cols = {};
        columnOrder.forEach(colId => {
            cols[colId] = filteredTasks.filter(task => task.status === colId);
        });
        return cols;
    }, [filteredTasks, columnOrder]); // Dependency is now filteredTasks

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const isDraggingColumn = columnOrder.includes(active.id);

        if (isDraggingColumn) {
            if (columnOrder.includes(over.id) && active.id !== over.id) {
                reorderColumn(active.id, over.id);
            }
        } else {
            let sourceColumnId = null;
            let destColumnId = null;
            let activeTask = null;

            for (const colId in columns) {
                const taskFound = columns[colId].find(task => task.id === active.id);
                if (taskFound) {
                    sourceColumnId = colId;
                    activeTask = taskFound;
                    break;
                }
            }

            if (!sourceColumnId || !activeTask) return;

            if (columnOrder.includes(over.id)) {
                destColumnId = over.id;
            } else {
                for (const colId in columns) {
                    if (columns[colId].some(task => task.id === over.id)) {
                        destColumnId = colId;
                        break;
                    }
                }
            }

            if (!destColumnId) return;

            if (sourceColumnId !== destColumnId) {
                updateTaskStatus(active.id, destColumnId);
            }
        }
    };

    const handleEditTaskClick = (task) => {
        setEditingTask(task);
    };

    const handleSaveEditedTask = (updatedTask) => {
        updateTask(updatedTask);
        setEditingTask(null);
    };

    const handleCloseEditModal = () => {
        setEditingTask(null);
    };

    const getActiveTask = () => {
        if (!activeId) return null;
        // Search in the original tasksData to find the task.
        return tasksData.find(t => t.id === activeId);
    };


    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <header className="p-4 bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center sticky-top">
                <h1 className="h3 mb-2 mb-md-0 text-dark">Task Board <span role="img" aria-label="card-index">🗂️</span></h1>
                <div className="input-group w-auto">
                    <input
                        type="text"
                        placeholder="New column title"
                        value={newColumnName}
                        onChange={e => setNewColumnName(e.target.value)}
                        className="form-control"
                    />
                    <button onClick={() => {
                        if (newColumnName.trim()) {
                            const normalizedName = newColumnName.trim().toLowerCase().replace(/\s+/g, '-');
                            addColumn(normalizedName);
                            setNewColumnName('');
                        }
                    }} className="btn btn-outline-primary">
                        + Add Column
                    </button>
                </div>
            </header>

            <main className="container-fluid flex-grow-1 p-4">
                <DndContext
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={columnOrder} strategy={rectSortingStrategy}>
                        <div className="row g-3 g-lg-4 align-items-stretch h-100">
                            {columnOrder.map(colId => (
                                <Column
                                    key={colId}
                                    id={colId}
                                    title={formatColumnTitle(colId)}
                                    tasks={columns[colId] || []}
                                    onAddTask={addTask}
                                    onEditTaskClick={handleEditTaskClick}
                                    onDeleteColumn={columnOrder.length > 1 ? deleteColumn : null}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeId ? (
                            <TaskCard
                                id={activeId}
                                task={getActiveTask()}
                                isOverlay={true}
                                onEditClick={() => {}}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </main>

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onSave={handleSaveEditedTask}
                    onClose={handleCloseEditModal}
                />
            )}
        </div>
    );
}