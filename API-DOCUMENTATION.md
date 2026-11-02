# API Documentation

Base URL: `http://localhost:5000`

All protected endpoints require:

`Authorization: Bearer <JWT_TOKEN>`

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login |

## Organizations

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/organizations` | Create an organization |
| GET | `/api/organizations` | Get organizations |

## Boards

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/tenant/:tenantId` | Get boards for a tenant |

## Columns

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/columns` | Create a column |
| GET | `/api/columns/board/:boardId` | Get board columns |
| PUT | `/api/columns/:columnId` | Update a column |
| DELETE | `/api/columns/:columnId` | Delete a column |

## Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/board/:boardId` | Get board tasks |
| PUT | `/api/tasks/:taskId` | Update a task |
| DELETE | `/api/tasks/:taskId` | Delete a task |

## Health Check

`GET /api/health`

Checks whether the backend can connect to the database.

## Real-Time Events

Socket.IO server URL: `http://localhost:5000`

Client events:
- `joinTenant` — request access to a tenant room.

Server events:
- `joinedTenant` — tenant room joined successfully.
- `tenantAccessDenied` — tenant access denied.
- `taskCreated` — a task was created.
- `taskUpdated` — a task was updated.
- `taskDeleted` — a task was deleted.

Task events are broadcast to connected clients in the relevant tenant room.

**Note:** Verify endpoint names and request bodies against the actual backend routes before submission.
