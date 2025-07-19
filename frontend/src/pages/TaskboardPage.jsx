// src/pages/TaskboardPage.jsx
import React, { useState } from 'react';
import './styles/TaskboardPage.css';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

// Helper function to format column titles
const formatColumnTitle = (id) =>
    id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ').toUpperCase();

//Mock data in for initial columns
const initialColumns = {
    todo: [
        { id: uuidv4(), title: 'Write marketing copy for landing page', due: '2025-06-17', tags: ['Marketing', 'Copywriting'], assignee: 'Charlie' },
        { id: uuidv4(), title: 'Prepare team meeting agenda', due: '2025-06-18', tags: ['Meeting', 'Planning'], assignee: 'Alice' },
    ],
    inprogress: [
        { id: uuidv4(), title: 'Design user flow for new feature', due: '2025-07-19', tags: ['Design', 'UI/UX'], assignee: 'Alice' },
        { id: uuidv4(), title: 'Develop authentication module', due: '2025-06-14', tags: ['Backend', 'Auth'], assignee: 'Bob' },
    ],
    review: [
        { id: uuidv4(), title: 'Review Q2 financial report', due: '2025-06-19', tags: ['Finance', 'Report'], assignee: 'David' },
    ],
    blocked: [
        { id: uuidv4(), title: 'Fix critical bug in task assignment', due: '2025-07-20', tags: ['Bug', 'Urgent'], assignee: 'Bob' },
    ],
    done: [
        { id: uuidv4(), title: 'Onboard new team member, Sarah', due: '2025-07-18', tags: ['HR', 'Onboarding'], assignee: 'Charlie' },
    ],
};

const initialOrder = ['todo', 'inprogress', 'review', 'blocked', 'done'];

// TaskCard Component
function TaskCard({ task, id, isOverlay = false, onEditClick }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isOverlay && {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            cursor: 'grabbing',
            zIndex: 999
        })
    };

    const handleEditButtonClick = (e) => {
        e.stopPropagation();
        onEditClick(task);
    };

    return (
        // Apply setNodeRef and style to the main card div
        <div ref={setNodeRef} style={style} className="task-card">
            <div className="task-card-content" {...attributes} {...listeners}>
                <h4 className="task-title">{task.title}</h4>
                <p className="task-due">📅 {task.due}</p>
                <div className="task-tags">
                    {task.tags.map((tag, idx) => (
                        <span key={idx} className="task-tag">{tag}</span>
                    ))}
                </div>
                <div className="task-assignee">👤 {task.assignee}</div>
            </div>
            <button className="task-edit-btn" onClick={handleEditButtonClick}>Edit</button>
        </div>
    );
}

// Column Component
function Column({ id, title, tasks, onAddTask, onDeleteColumn, onEditTaskClick }) { // Added onEditTaskClick
    const [showInput, setShowInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDue, setNewTaskDue] = useState('');
    const [newTaskTags, setNewTaskTags] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');

    const handleAddNewTask = () => {
        if (newTaskTitle.trim()) {
            onAddTask(id, {
                id: uuidv4(),
                title: newTaskTitle.trim(),
                due: newTaskDue || 'TBD', // Default if not entered
                tags: newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag), // Split by comma, trim, filter empty
                assignee: newTaskAssignee || 'Unassigned' // Default if not entered
            });
            setNewTaskTitle('');
            setNewTaskDue('');
            setNewTaskTags('');
            setNewTaskAssignee('');
            setShowInput(false);
        }
    };

    return (
        <div className="task-column">
            <div className="column-header">
                <h3 className="column-title">{title} <span className="column-task-count">({tasks.length})</span></h3>
                {onDeleteColumn && (
                    <button onClick={() => onDeleteColumn(id)} className="column-delete-btn" aria-label={`Delete column ${title}`}>
                        &times;
                    </button>
                )}
            </div>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="task-list-container">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} id={task.id} task={task} onEditClick={onEditTaskClick} />
                    ))}
                </div>
            </SortableContext>
            {showInput ? (
                <div className="add-task-form">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Task title"
                        className="add-task-input"
                    />
                    <input
                        type="date"
                        value={newTaskDue}
                        onChange={e => setNewTaskDue(e.target.value)}
                        className="add-task-input"
                        title="Due Date"
                    />
                    <input
                        type="text"
                        value={newTaskTags}
                        onChange={e => setNewTaskTags(e.target.value)}
                        placeholder="Tags (comma-separated)"
                        className="add-task-input"
                    />
                    <input
                        type="text"
                        value={newTaskAssignee}
                        onChange={e => setNewTaskAssignee(e.target.value)}
                        placeholder="Assignee"
                        className="add-task-input"
                    />
                    <div className="add-task-actions">
                        <button onClick={handleAddNewTask} className="add-task-submit-btn">
                            Add Task
                        </button>
                        <button onClick={() => setShowInput(false)} className="add-task-cancel-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button className="add-task-btn" onClick={() => setShowInput(true)}>+ Add New Task</button>
            )}
        </div>
    );
}

// EditTaskModal Component
function EditTaskModal({ task, onSave, onClose }) {
    const [title, setTitle] = useState(task.title);
    const [due, setDue] = useState(task.due);
    const [tags, setTags] = useState(task.tags.join(', ')); // Join for input
    const [assignee, setAssignee] = useState(task.assignee);

    const handleSave = () => {
        onSave({
            ...task, // Keep original ID and other properties
            title: title.trim(),
            due: due,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            assignee: assignee.trim()
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Task</h2>
                <div className="modal-form-group">
                    <label htmlFor="edit-title">Title</label>
                    <input id="edit-title" type="text" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="modal-form-group">
                    <label htmlFor="edit-due">Due Date</label>
                    <input id="edit-due" type="date" value={due} onChange={e => setDue(e.target.value)} />
                </div>
                <div className="modal-form-group">
                    <label htmlFor="edit-tags">Tags (comma-separated)</label>
                    <input id="edit-tags" type="text" value={tags} onChange={e => setTags(e.target.value)} />
                </div>
                <div className="modal-form-group">
                    <label htmlFor="edit-assignee">Assignee</label>
                    <input id="edit-assignee" type="text" value={assignee} onChange={e => setAssignee(e.target.value)} />
                </div>
                <div className="modal-actions">
                    <button onClick={handleSave} className="modal-save-btn">Save Changes</button>
                    <button onClick={onClose} className="modal-cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
    );
}


// TaskboardPage Main Component
export default function TaskboardPage() {
    const [columns, setColumns] = useState(initialColumns);
    const [columnOrder, setColumnOrder] = useState(initialOrder);
    const [newColumnName, setNewColumnName] = useState('');
    const [activeId, setActiveId] = useState(null); // State for DND active item
    const [editingTask, setEditingTask] = useState(null); // State to hold the task being edited

    const handleAddTask = (columnId, task) => {
        setColumns(prev => ({ ...prev, [columnId]: [...prev[columnId], task] }));
    };

    const handleDeleteColumn = (id) => {
        if (window.confirm(`Are you sure you want to delete the "${formatColumnTitle(id)}" column? All tasks within it will be lost.`)) {
            setColumns(prev => {
                const newCols = { ...prev };
                delete newCols[id];
                return newCols;
            });
            setColumnOrder(prev => prev.filter(cid => cid !== id));
        }
    };

    const handleAddColumn = () => {
        if (newColumnName.trim()) {
            const normalizedName = newColumnName.trim().toLowerCase().replace(/\s+/g, '-');
            if (columns[normalizedName]) {
                alert('A column with this name already exists!');
                return;
            }
            setColumns(prev => ({ ...prev, [normalizedName]: [] }));
            setColumnOrder(prev => [...prev, normalizedName]);
            setNewColumnName('');
        }
    };

    // DND Handlers
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null); // Clear activeId after drag ends

        if (!over || active.id === over.id) return;

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

        if (!sourceColumnId) return;

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

        // If dragging within the same column
        if (sourceColumnId === destColumnId) {
            setColumns(prev => {
                const tasksInColumn = prev[sourceColumnId];
                const oldIndex = tasksInColumn.findIndex(task => task.id === active.id);
                const newIndex = tasksInColumn.findIndex(task => task.id === over.id);
                // Ensure newIndex is valid for arrayMove (e.g., if dragging to an empty space past last item)
                const finalNewIndex = newIndex === -1 ? tasksInColumn.length : newIndex;
                return {
                    ...prev,
                    [sourceColumnId]: arrayMove(tasksInColumn, oldIndex, finalNewIndex),
                };
            });
        } else {
            // If dragging between different columns
            setColumns(prev => {
                const newSourceTasks = prev[sourceColumnId].filter(task => task.id !== active.id);
                const newDestTasks = [...prev[destColumnId]];
                const overIndex = newDestTasks.findIndex(task => task.id === over.id);

                if (overIndex !== -1) {
                    newDestTasks.splice(overIndex, 0, activeTask);
                } else {
                    newDestTasks.push(activeTask);
                }

                return {
                    ...prev,
                    [sourceColumnId]: newSourceTasks,
                    [destColumnId]: newDestTasks,
                };
            });
        }
    };

    // Edit Task Handlers
    const handleEditTaskClick = (task) => {
        setEditingTask(task); // Set the task to be edited
    };

    const handleSaveEditedTask = (updatedTask) => {
        setColumns(prevColumns => {
            const newColumns = { ...prevColumns };
            let taskFound = false;

            for (const colId in newColumns) {
                const updatedTasks = newColumns[colId].map(task => {
                    if (task.id === updatedTask.id) {
                        taskFound = true;
                        return updatedTask; // Replace with updated task
                    }
                    return task;
                });
                newColumns[colId] = updatedTasks;
                if (taskFound) break; // Stop iterating once task is found and updated
            }
            return newColumns;
        });
        setEditingTask(null); // Close the modal
    };

    const handleCloseEditModal = () => {
        setEditingTask(null); // Close the modal without saving
    };

    // Helper for DragOverlay
    const getActiveTask = () => {
        if (!activeId) return null;
        for (const colId in columns) {
            const task = columns[colId].find(t => t.id === activeId);
            if (task) return task;
        }
        return null;
    };


    return (
        <div className="taskboard-page-layout">
            <header className="taskboard-header-section">
                <h1 className="taskboard-main-title">Task Board <span role="img" aria-label="card-index">🗂️</span></h1>
                <div className="add-column-form">
                    <input
                        type="text"
                        placeholder="New column title"
                        value={newColumnName}
                        onChange={e => setNewColumnName(e.target.value)}
                        className="add-column-input"
                    />
                    <button onClick={handleAddColumn} className="add-column-btn">
                        + Add Column
                    </button>
                </div>
            </header>

            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="columns-grid-container">
                    {columnOrder.map(colId => (
                        <Column
                            key={colId}
                            id={colId}
                            title={formatColumnTitle(colId)}
                            tasks={columns[colId] || []}
                            onAddTask={handleAddTask}
                            onEditTaskClick={handleEditTaskClick} // Pass the click handler
                            // Only show delete button if there's more than one column
                            onDeleteColumn={columnOrder.length > 1 ? handleDeleteColumn : null}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <TaskCard
                            id={activeId}
                            task={getActiveTask()}
                            isOverlay={true}
                            onEditClick={() => {}} // No edit on drag overlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Render EditTaskModal if a task is being edited */}
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