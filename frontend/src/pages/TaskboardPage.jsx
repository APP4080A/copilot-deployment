// frontend/src/pages/TaskboardPage.jsx
import React, { useState, useContext, useMemo } from 'react';
import './styles/TaskboardTest.css'; // We'll keep this for unique styles
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable'; // Added rectSortingStrategy
import { CSS } from '@dnd-kit/utilities';

import { TaskContext } from '../contexts/TaskContext';



// Helper function to format column titles
const formatColumnTitle = (id) =>
    id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ').toUpperCase();

// TaskCard Component
function TaskCard({ task, id, isOverlay = false, onEditClick }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Custom styles for overlay (more robust for D&D)
        ...(isOverlay && {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            cursor: 'grabbing',
            zIndex: 999,
            opacity: 0.9 // Make it slightly transparent
        })
    };

    const handleEditButtonClick = (e) => {
        e.stopPropagation(); // Prevent drag event from firing when clicking edit
        onEditClick(task);
    };

    return (
        // Using Bootstrap classes: card for container, mb-2 for margin-bottom, shadow-sm for subtle shadow, p-3 for padding
        <div ref={setNodeRef} style={style} className="card mb-2 shadow-sm task-card-custom-min-height">
            <div className="card-body p-3" {...attributes} {...listeners}> {/* p-3 for padding, card-body for flex */}
                <h5 className="card-title fw-bold mb-1">{task.title}</h5> {/* mb-1 for smaller margin */}
                <p className="card-text text-muted small mb-2">📅 {task.due}</p> {/* small text, mb-2 */}
                <div className="d-flex flex-wrap gap-1 mb-2"> {/* d-flex flex-wrap for tags, gap-1 for spacing */}
                    {task.tags.map((tag, idx) => (
                        <span key={idx} className="badge bg-info-subtle text-info fw-normal text-uppercase py-1 px-2 rounded-pill custom-tag-style">{tag}</span> /* Bootstrap badges */
                    ))}
                </div>
                <div className="text-muted small">👤 {task.assignee}</div> {/* text-muted small */}
            </div>
            {/* Using Bootstrap button classes: btn btn-sm btn-outline-secondary */}
            <button className="btn btn-sm btn-outline-secondary task-edit-btn-custom" onClick={handleEditButtonClick}>Edit</button>
        </div>
    );
}

// Column Component - Now also sortable itself
function Column({ id, title, tasks, onAddTask, onDeleteColumn, onEditTaskClick }) {
    // useSortable for the column itself (for column reordering)
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [showInput, setShowInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDue, setNewTaskDue] = useState('');
    const [newTaskTags, setNewTaskTags] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');

    const handleAddNewTask = () => {
        if (newTaskTitle.trim()) {
            onAddTask(id, { // Call context's addTask
                title: newTaskTitle.trim(),
                due: newTaskDue,
                tags: newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
                assignee: newTaskAssignee
            });
            setNewTaskTitle('');
            setNewTaskDue('');
            setNewTaskTags('');
            setNewTaskAssignee('');
            setShowInput(false);
        }
    };

    return (
        // Apply useSortable props to the outer div of the column
        // Using Bootstrap col classes for responsive grid layout
        <div ref={setNodeRef} style={style} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4"> {/* col-lg-3 for 4 per row on large screens, mb-4 for margin-bottom */}
            {/* Inner card for column styling */}
            <div className="card border-0 bg-light p-3 h-100 column-inner-card"> {/* h-100 to make all cards same height */}
                <div className="d-flex justify-content-between align-items-center mb-3" {...attributes} {...listeners}> {/* Apply drag attributes/listeners here */}
                    <h4 className="mb-0 text-capitalize">{title} <span className="badge bg-secondary rounded-pill ms-2">{tasks.length}</span></h4>
                    {onDeleteColumn && (
                        <button onClick={() => onDeleteColumn(id)} className="btn btn-sm btn-outline-danger" aria-label={`Delete column ${title}`}>
                            <i className="bi bi-trash"></i>
                        </button>
                    )}
                </div>
                {/* SortableContext for tasks within this column */}
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

// EditTaskModal Component (remains the same)
function EditTaskModal({ task, onSave, onClose }) {
    const [title, setTitle] = useState(task.title);
    const [due, setDue] = useState(task.due);
    const [tags, setTags] = useState(task.tags.join(', '));
    const [assignee, setAssignee] = useState(task.assignee);

    const handleSave = () => {
        onSave({
            ...task,
            title: title.trim(),
            due: due,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            assignee: assignee.trim()
        });
        onClose();
    };

    return (
        // Using Bootstrap's modal structure and utility classes for layout
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
    // Get data and functions from context
    const {
        tasksData,
        columnOrder,
        addTask,
        updateTaskStatus,
        updateTask,
        addColumn,
        deleteColumn,
        reorderColumn,
    } = useContext(TaskContext);

    const [newColumnName, setNewColumnName] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [editingTask, setEditingTask] = useState(null);

    const columns = useMemo(() => {
        const cols = {};
        columnOrder.forEach(colId => {
            cols[colId] = tasksData.filter(task => task.status === colId);
        });
        return cols;
    }, [tasksData, columnOrder]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        // Determine if we are dragging a column or a task
        const isDraggingColumn = columnOrder.includes(active.id);

        if (isDraggingColumn) {
            // Column reordering
            if (columnOrder.includes(over.id) && active.id !== over.id) {
                reorderColumn(active.id, over.id);
            }
        } else {
            // Task dragging
            let sourceColumnId = null;
            let destColumnId = null;
            let activeTask = null;

            // Find the active task and its source column
            for (const colId in columns) {
                const taskFound = columns[colId].find(task => task.id === active.id);
                if (taskFound) {
                    sourceColumnId = colId;
                    activeTask = taskFound;
                    break;
                }
            }

            if (!sourceColumnId || !activeTask) return;

            // Determine destination column
            if (columnOrder.includes(over.id)) { // If 'over' is a column itself
                destColumnId = over.id;
            } else { // If 'over' is a task, find its parent column
                for (const colId in columns) {
                    if (columns[colId].some(task => task.id === over.id)) {
                        destColumnId = colId;
                        break;
                    }
                }
            }

            if (!destColumnId) return;

            // If dragging between different columns, update task status
            if (sourceColumnId !== destColumnId) {
                updateTaskStatus(active.id, destColumnId);
            }
            // Note: In-column task reordering is not handled by updateTaskStatus alone.
            // For full in-column reordering, you'd need a more complex state update in context
            // that includes order within the column, or use arrayMove on the tasks array
            // within the specific column in the context's updateTaskStatus.
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
        // Check if activeId is a task ID
        for (const colId in columns) {
            const task = columns[colId].find(t => t.id === activeId);
            if (task) return task;
        }
        // If it's not a task, it must be a column (for DragOverlay, though not typically needed for columns)
        return null;
    };


    return (
        <div className="d-flex flex-column min-vh-100 bg-light"> {/* Using Bootstrap for main layout */}
            {/* Navbar is rendered by AppLayout */}
            <header className="p-4 bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center sticky-top">
                <h1 className="h3 mb-2 mb-md-0 text-dark">Task Board <span role="img" aria-label="card-index">🗂️</span></h1>
                <div className="input-group w-auto"> {/* input-group for inline input and button */}
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
                            addColumn(normalizedName); // Call context function
                            setNewColumnName('');
                        }
                    }} className="btn btn-outline-primary">
                        + Add Column
                    </button>
                </div>
            </header>

            <main className="container-fluid flex-grow-1 p-4"> {/* Use container-fluid for full width, p-4 for padding */}
                <DndContext
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {/* SortableContext for columns - now uses rectSortingStrategy for grid */}
                    <SortableContext items={columnOrder} strategy={rectSortingStrategy}>
                        {/* Use Bootstrap row for wrapping columns, with gutters.
                            Added h-100 to ensure the row takes full height of its flex-grow-1 parent (main). */}
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
                            // Render either a TaskCard or a Column for the overlay
                            // This gets a bit more complex if you want to show a full column overlay
                            // For simplicity, we'll assume activeId is a task for overlay for now.
                            // If activeId is a column, getActiveTask() returns null, so nothing shows.
                            // To show column overlay, you'd need a separate getActiveColumn function.
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