# copilot-core
Collaborative project management platform built with React, Express, and SQLite. Features include user authentication, task tracking, team collaboration, and streamlined workflows. This repo hosts the frontend, backend, database schema, test suite, and CI pipeline setup.


# CoPilot – Collaborative Project Management Tool

CoPilot is a web-based project and task management tool for small teams. Built with **React** and **Node.js**, it enables teams to create projects, assign tasks, and track progress through a clean, minimal interface.

---

##  Feature Overview

All features are categorized into:

-  **MVP** – Core for a working first release
-  **Nice-to-Have** – Enhancements post-MVP
-  **Future Scope** – Ambitious or advanced features

---

### Minimum Viable Product (MVP)

#### User Authentication

| Feature                         | Description                                    | Status |
|----------------------------------|------------------------------------------------|--------|
| User Registration               | Register with username + password              | 🔲     |
| User Login / Logout             | Secure login and logout with token/session     | 🔲     |
| JWT-based Token Authentication  | Token-based auth system                        | 🔲     |

#### Project Management

| Feature                      | Description                              | Status |
|-----------------------------|------------------------------------------|--------|
| Create Project              | Add project name and description         | 🔲     |
| View All Projects           | List of user-accessible projects         | 🔲     |
| View Project Details        | View specific project and its tasks      | 🔲     |

#### Task Management

| Feature                          | Description                                                | Status |
|----------------------------------|------------------------------------------------------------|--------|
| Create Task                      | Title, description, due date, assignee, and status         | 🔲     |
| View Tasks by Project            | Show all tasks under a selected project                    | 🔲     |
| Update Task Status               | Move task from To Do → In Progress → Done                 | 🔲     |
| Assign Tasks                     | Assign task to a registered user                           | 🔲     |

#### Core Screens

| Screen               | Purpose                                                         | Status |
|----------------------|------------------------------------------------------------------|--------|
| Landing Page         | Intro to CoPilot, with Sign Up / Login options                  | 🔲     |
| Sign Up / Login Page | Simple and secure user authentication forms                     | 🔲     |
| Dashboard            | Overview of assigned tasks and project activity                 | 🔲     |
| Task Board           | Display tasks grouped by status (To Do / In Progress / Done)    | 🔲     |
| Project Details View | Show specific project info and task list                        | 🔲     |

---

### Nice-to-Have (Post-MVP Polish)

| Feature                          | Description                                           | Status |
|----------------------------------|-------------------------------------------------------|--------|
| Task Filtering                   | Filter tasks by status, due date, or assignee         | 🔲     |
| User Profile Page                | View/edit username and bio                            | 🔲     |
| Team Page                        | List of team members per project                      | 🔲     |
| Responsive Design                | Optimized mobile/tablet views                         | 🔲     |
| Toasts & Loading States          | User feedback on actions and loading indicators       | 🔲     |
| Form Validation                  | Frontend checks before submit                         | 🔲     |

---

### Future Scope

| Feature                          | Description                                               | Status |
|----------------------------------|-----------------------------------------------------------|--------|
| Drag-and-Drop Task Board         | Move tasks across columns via drag                        | 🔲     |
| Invite Users                     | Invite team members via email or code                     | 🔲     |
| Profile Pictures                 | Upload profile image                                      | 🔲     |
| Role-Based Access Control        | Admin/member project roles                                | 🔲     |
| Activity Feed                    | Show recent changes/tasks updates per project             | 🔲     |
| Notifications                    | In-app/task notifications (due soon, updates, etc.)       | 🔲     |
| Reminders                        | Due date notifications or summaries                       | 🔲     |
| Integrations                     | GitHub, Slack, or calendar sync                           | 🔲     |
| Dark Mode / Themes               | User can toggle app appearance settings                   | 🔲     |

---

## Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | React + Tailwind CSS      |
| Backend     | Node.js + Express         |
| Auth        | JSON Web Tokens (JWT)     |
| Database    | SQLite (for MVP)          |
| Deployment  | Vercel (frontend), Render/Heroku (backend) |

---



