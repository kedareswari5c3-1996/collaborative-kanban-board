# Real-Time Collaborative Kanban Board

A full-stack Kanban board application that allows users to manage tasks and collaborate in real time within an organization and its branches (tenants).

## Features

- User registration and login with JWT authentication
- Organization and tenant management
- Tenant-based membership and access control
- Board and column management
- Create, view, update, and delete tasks
- Drag-and-drop task movement between columns
- Real-time task creation, updates, and deletion using Socket.IO
- Database persistence using Prisma and SQLite

## Technology Stack

**Frontend**
- React
- Vite
- Axios
- Socket.IO Client
- Lucide React

**Backend**
- Node.js
- Express.js
- Prisma ORM
- SQLite
- JWT Authentication
- Socket.IO

## Project Structure

```text
collaborative-kanban-board/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── sockets/
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   └── package.json
│
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd collaborative-kanban-board
```

### 2. Backend setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Configure the backend `.env` file with your database URL, JWT secret, and port.

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the application

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Real-Time Communication

The application uses Socket.IO for real-time task updates.

Clients join tenant-specific rooms. Task creation, updates, and deletion are broadcast to connected users in the relevant tenant room.

## Database

The application uses Prisma ORM with SQLite.

Main data models include:

- Organization
- Tenant
- User
- Membership
- Board
- Column
- Task
- ActivityLog

## Current Implementation

The core application supports authentication, organization and tenant membership, board and column access, task CRUD operations, drag-and-drop task movement, and real-time task synchronization.

Additional advanced features such as undo/redo, full presence indicators, and conflict-resolution workflows are not yet fully implemented.

## Author

Developed as a Real-Time Collaborative Kanban Board project.
