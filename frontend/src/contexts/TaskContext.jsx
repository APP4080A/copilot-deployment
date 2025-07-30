// frontend/src/contexts/TaskContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';

// Create the Context
export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
    const [tasksData, setTasksData] = useState([]);
    const [columnOrder, setColumnOrder] = useState(['todo', 'inprogress', 'review', 'blocked', 'done']);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');

    // Fetch tasks from the backend on initial load
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await fetch('/api/tasks');
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText} - ${errorText}`);
                }
                const tasks = await response.json();
                // Ensure tasks have an assignees array, even if empty
                setTasksData(tasks.map(task => ({
                    ...task,
                    assignees: task.assignees || [], // Backend now sends 'assignees' array
                    assignee_ids: task.assignee_ids || [] // Backend now sends 'assignee_ids' array
                })));
            } catch (error) {
                console.error("Error fetching tasks:", error);
                setTasksData([]);
            }
        };

        fetchTasks();
    }, []);

    // --- Task Modification Functions ---

    const addTask = async (columnId, taskDetails) => {
        const now = new Date().toISOString().split('T')[0];
        const newTaskPayload = {
            title: taskDetails.title.trim(),
            description: taskDetails.description.trim() || 'No description provided.',
            columnId: columnId,
            due: taskDetails.due || 'TBD',
            tags: taskDetails.tags || [],
            // Now expecting an array of user IDs for assignees
            assignee_ids: taskDetails.assignee_ids || [],
            priority: taskDetails.priority || 'Low',
            createdAt: now,
        };

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTaskPayload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add task to the database: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const responseData = await response.json();
            const addedTask = responseData.task;

            setTasksData(prevTasks => [...prevTasks, {
                ...addedTask,
                assignees: addedTask.assignees || [], // Ensure it's an array
                assignee_ids: addedTask.assignee_ids || [], // Ensure it's an array
                createdAt: addedTask.createdAt || now
            }]);
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const updateTaskStatus = (taskId, newStatus) => {
        // This function needs to be updated to hit the backend
        setTasksData(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            )
        );
    };

    const updateTask = (updatedTask) => {
        // This function needs to be updated to hit the backend
        setTasksData(prevTasks =>
            prevTasks.map(task =>
                task.id === updatedTask.id ? updatedTask : task
            )
        );
    };

    const deleteTask = (taskId) => {
        // This function needs to be updated to hit the backend
        setTasksData(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const addColumn = (newColId) => {
        // This function needs to be updated to hit the backend
        setColumnOrder(prevOrder => [...prevOrder, newColId]);
    };

    const deleteColumn = (colId) => {
        // IMPORTANT: Do NOT use confirm() or window.confirm() in the code.
        // The code is running in an iframe and the user will NOT see the confirmation dialog.
        // Instead, use a custom modal UI for these confirmations.
        // For now, I'm removing the confirm() to prevent blocking the iframe.
        // You should replace this with a proper UI confirmation.

        // if (window.confirm(`Are you sure you want to delete the "${colId.toUpperCase()}" column? All tasks within it will be lost.`)) {
        setColumnOrder(prevOrder => prevOrder.filter(id => id !== colId));
        setTasksData(prevTasks => prevTasks.filter(task => task.status !== colId));
        // }
    };

    const reorderColumn = (activeColId, overColId) => {
        setColumnOrder(prevOrder => {
            const oldIndex = prevOrder.indexOf(activeColId);
            const newIndex = prevOrder.indexOf(overColId);
            return arrayMove(prevOrder, oldIndex, newIndex);
        });
    };

    const contextValue = {
        tasksData,
        columnOrder,
        globalSearchTerm,
        setGlobalSearchTerm,
        addTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        addColumn,
        deleteColumn,
        reorderColumn,
    };

    return (
        <TaskContext.Provider value={contextValue}>
            {children}
        </TaskContext.Provider>
    );
};