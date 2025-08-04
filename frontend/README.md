# CoPilot – Collaborative Project Management Tool

CoPilot is a web-based, collaborative project management platform designed for small teams. Built with a modern tech stack including React, **Node.js, and **SQLite, it provides a clean and minimal interface for creating projects, assigning tasks, and tracking progress.

This repository hosts the full-stack application, including the frontend, backend, database schema, test suite, and continuous integration (CI) pipeline setup.

---

## 🚀 Features

Features are categorized to provide a clear roadmap:

* Minimum Viable Product (MVP): Core features essential for a working first release.
* Nice-to-Have: Enhancements planned for post-MVP releases.
* Future Scope: Ambitious and advanced features for long-term development.

### Minimum Viable Product (MVP)

#### User Authentication
| Feature | Description | Status |
| :--- | :--- | :--- |
| User Registration | Register with a username and password, or use Google OAuth for single sign-on. | ✅ Done |
| User Login/Logout | Secure user sessions with a dedicated login and logout flow. | ✅ Done |
| JWT-based Authentication | Implement a robust authentication system using JSON Web Tokens. | ✅ Done |

#### Task Management
| Feature | Description | Status |
| :--- | :--- | :--- |
| Create Task | Users can create tasks with a title, description, due date, assignee, and status. | ✅ Done |
| View Tasks | Display tasks in a board view, grouped by their status (e.g., "To Do," "In Progress," "Done"). | ✅ Done |
| Update Task Status | Update a task's status by dragging it between columns on the task board. | ✅ Done |
| Assign Tasks | Assign tasks to registered users within the project. | ✅ Done |

#### Core Screens
| Screen | Purpose | Status |
| :--- | :--- | :--- |
| Landing Page | The public-facing introduction to CoPilot, with options for signing up or logging in. | ✅ Done |
| Authentication Pages | Secure and intuitive forms for user sign-up and login. | ✅ Done |
| Dashboard | An overview of a user's assigned tasks and overall project activity. | ✅ Done |
| Task Board | A visual interface for managing tasks, organized by status columns. | ✅ Done |
| User Profile Page | A page for users to view and edit their profile information, such as username and bio. | ✅ Done |
| Team Page | A directory of all team members associated with a project. | ✅ Done |

### Nice-to-Have (Post-MVP Enhancements)
| Feature | Description | Status |
| :--- | :--- | :--- |
| Task Filtering | Add advanced filtering options for tasks by status, due date, or assignee. | ✅ Done |
| Responsive Design | Optimize the user interface for seamless experience across mobile and tablet devices. | ✅ Done |
| Toasts & Loading States | Implement user feedback mechanisms such as toast notifications and clear loading indicators. | ✅ Done |
| Form Validation | Introduce frontend form validation to improve user experience and data integrity. | ✅ Done |

### Future Scope
| Feature | Description | Status |
| :--- | :--- | :--- |
| Role-Based Access Control | Implement different user roles (e.g., Admin, Member) with varying permissions. | ☐ Not Started |
| Activity Feed | A timeline displaying recent changes and updates for a project. | ☐ Not Started |
| Notifications | In-app notifications for important events like task assignments or due date reminders. | ☐ Not Started |
| Third-Party Integrations | Sync with external services like GitHub, Slack, or calendar applications. | ☐ Not Started |
| Dark Mode / Themes | Allow users to customize the application's appearance with different themes. | ☐ Not Started |

---

## ⚙ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| Frontend | React, Bootstrap CSS | A modern JavaScript library for building the user interface. |
| Backend | Node.js, Express | A lightweight and flexible backend framework. |
| Authentication | JSON Web Tokens (JWT) | A standard for securing API endpoints. |
| Database | SQLite | A self-contained, serverless database for the MVP. |
| Deployment | Vercel (Frontend), Render (Backend) | Planned deployment platforms. |