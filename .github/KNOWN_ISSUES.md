### Known Limitations

This project has several known limitations that developers should be aware of.

#### Authentication and Access Control
- Role-based access control has not been implemented; all users have the same permissions.
- The application does not support a guest or demo user mode.

#### Feature Gaps
- There is no support for recurring tasks.
- Task dependencies (e.g., one task must be completed before another) are not supported.
- The application lacks functionality for subtasks or checklist-style breakdowns.
- There is no ability to archive or restore deleted projects or tasks.

#### UI/UX
- The application does not include a dark mode or theme switching.
- Keyboard navigation and other accessibility features are not supported.

#### Hosting and Deployment
- The application is configured to work exclusively on a local environment (`localhost:3000` or `127.0.0.1`).
- Cloud deployment and production configurations are not supported.
- Offline support is not available, as the application requires an active server connection.
- A service worker has not been implemented.

#### Security
- The application runs over HTTP, lacking HTTPS security.
- Rate limiting and brute-force protection mechanisms are not in place.
- User input is not sanitized, which may expose the application to cross-site scripting (XSS) vulnerabilities.
- Credentials, if used, are stored in plain text.
