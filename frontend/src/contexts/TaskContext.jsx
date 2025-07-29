// frontend/src/context/TaskContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { arrayMove } from '@dnd-kit/sortable'; // Import arrayMove for column reordering

// 1. Create the Context
export const TaskContext = createContext();

// Mock data in for initial columns (for conversion to flat array)
const initialColumnsData = {
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
        { id: uuidv4(), title: 'Completed initial setup', due: '2025-07-17', tags: ['Setup'], assignee: 'Alice' }, // Added one more for variety
    ],
};

// Convert initialColumnsData into a flat array of tasks, assigning a 'status' based on column key
const generateInitialTasks = () => {
    let tasks = [];
    for (const columnId in initialColumnsData) {
        tasks = tasks.concat(initialColumnsData[columnId].map(task => ({
            ...task,
            status: columnId, // Assign the column ID as the task's status
        })));
    }
    return tasks;
};

// 2. Create the Provider Component
export const TaskProvider = ({ children }) => {
    const [tasksData, setTasksData] = useState([]);
    const [columnOrder, setColumnOrder] = useState(Object.keys(initialColumnsData));
    const [globalSearchTerm, setGlobalSearchTerm] = useState(''); // State for global search term

    // Helper to generate a single fake task (can be used for adding new tasks)
    const generateFakeTask = (status = 'todo') => { // Default to 'todo' for new tasks
        const priorities = ['Low', 'Medium', 'High'];
        const types = ['Feature', 'Bug', 'Improvement', 'Research'];
        const assignees = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']; // Assuming some predefined assignees

        return {
            id: uuidv4(),
            title: faker.lorem.sentence(5),
            description: faker.lorem.paragraph(2),
            status: status, // Status determines the column
            priority: faker.helpers.arrayElement(priorities),
            type: faker.helpers.arrayElement(types),
            due: faker.date.future({ years: 0.5 }).toISOString().split('T')[0], // YYYY-MM-DD
            assignee: faker.helpers.arrayElement(assignees),
            createdAt: new Date().toISOString().split('T')[0],
        };
    };

    // Initialize tasks from initialColumnsData
    useEffect(() => {
        setTasksData(generateInitialTasks());
    }, []);

    // --- Task Modification Functions (to be exposed via context) ---

    const addTask = (columnId, taskDetails) => {
        const newTask = {
            id: uuidv4(),
            status: columnId, // Assign the task to the correct column/status
            title: taskDetails.title.trim(),
            due: taskDetails.due || 'TBD',
            tags: taskDetails.tags || [],
            assignee: taskDetails.assignee || 'Unassigned',
            description: '',
            priority: 'Medium',
            type: 'Feature',
            createdAt: new Date().toISOString().split('T')[0],
        };
        setTasksData(prevTasks => [...prevTasks, newTask]);
    };

    const updateTaskStatus = (taskId, newStatus) => {
        setTasksData(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            )
        );
    };

    const updateTask = (updatedTask) => {
        setTasksData(prevTasks =>
            prevTasks.map(task =>
                task.id === updatedTask.id ? updatedTask : task
            )
        );
    };

    const deleteTask = (taskId) => {
        setTasksData(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const addColumn = (newColId) => {
        setColumnOrder(prevOrder => [...prevOrder, newColId]);
    };

    const deleteColumn = (colId) => {
        // IMPORTANT: Use a custom modal or confirmation UI instead of window.confirm
        // For this demo, we'll keep window.confirm, but note it's not ideal in iframes.
        if (window.confirm(`Are you sure you want to delete the "${colId.toUpperCase()}" column? All tasks within it will be lost.`)) {
            setColumnOrder(prevOrder => prevOrder.filter(id => id !== colId));
            setTasksData(prevTasks => prevTasks.filter(task => task.status !== colId)); // Delete tasks in that column
        }
    };

    const reorderColumn = (activeColId, overColId) => {
        setColumnOrder(prevOrder => {
            const oldIndex = prevOrder.indexOf(activeColId);
            const newIndex = prevOrder.indexOf(overColId);
            return arrayMove(prevOrder, oldIndex, newIndex);
        });
    };

    // The value that will be provided to consumers (TaskboardPage, TeamViewPage, etc.)
    const contextValue = {
        tasksData,
        columnOrder,
        globalSearchTerm,
        setGlobalSearchTerm, // <-- ENSURE THIS LINE IS PRESENT
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
