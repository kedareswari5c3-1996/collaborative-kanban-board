
import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Plus,
  LogOut,
  RefreshCw,
  Trash2,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import './App.css';

const API = 'http://localhost:5000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [boardId, setBoardId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newColumn, setNewColumn] = useState('');
  const [newTask, setNewTask] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Login
  const login = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      const newToken = response.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setMessage('Login successful!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  // Load board
  const loadBoard = async () => {
    if (!boardId.trim()) {
      setMessage('Please enter your Board ID');
      return;
    }

    try {
      const [columnResponse, taskResponse] = await Promise.all([
        axios.get(`${API}/columns/board/${boardId}`, { headers }),
        axios.get(`${API}/tasks/board/${boardId}`, { headers }),
      ]);

      setColumns(columnResponse.data);
      setTasks(taskResponse.data);
      setMessage('Board loaded successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not load board');
    }
  };

  // Real-time connection
  useEffect(() => {
    if (!token || !tenantId) return;

    const connection = io('http://localhost:5000', {
      auth: { token },
    });

    connection.on('connect', () => {
      connection.emit('joinTenant', tenantId);
    });

    connection.on('taskCreated', (task) => {
      setTasks((old) =>
        old.some((item) => item.id === task.id)
          ? old
          : [...old, task]
      );
    });

    connection.on('taskUpdated', (task) => {
  console.log('REAL-TIME TASK RECEIVED:', task);

  setTasks((old) =>
    old.map((item) => item.id === task.id ? task : item)
  );
});

    connection.on('taskDeleted', ({ taskId }) => {
      setTasks((old) => old.filter((item) => item.id !== taskId));
    });

    connection.on('tenantAccessDenied', () => {
      setMessage('You do not have access to this tenant room.');
    });

    setSocket(connection);

    return () => connection.disconnect();
  }, [token, tenantId]);

  // Add column
  const addColumn = async (e) => {
    e.preventDefault();

    if (!newColumn.trim()) return;

    try {
      await axios.post(
        `${API}/columns`,
        {
          boardId,
          name: newColumn,
          position: columns.length,
        },
        { headers }
      );

      setNewColumn('');
      await loadBoard();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add column');
    }
  };

  // Add task
  const addTask = async (e) => {
    e.preventDefault();

    if (!newTask.trim() || !selectedColumn) return;

    try {
      await axios.post(
        `${API}/tasks`,
        {
          columnId: selectedColumn,
          title: newTask,
          position: tasks.length,
          status: 'TODO',
          priority: 'MEDIUM',
        },
        { headers }
      );

      setNewTask('');
      await loadBoard();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add task');
    }
  };

  // Move task to another column
  const moveTask = async (task, columnId) => {
    if (task.columnId === columnId) return;

    // Save the old state in case the API request fails
    const previousTasks = [...tasks];

    // Move the task immediately on the screen
    setTasks((oldTasks) =>
      oldTasks.map((item) =>
        item.id === task.id
          ? { ...item, columnId }
          : item
      )
    );

    try {
      const response = await axios.put(
        `${API}/tasks/${task.id}`,
        {
          columnId,
          version: task.version,
        },
        { headers }
      );

      const updatedTask = response.data.task;

      setTasks((oldTasks) =>
        oldTasks.map((item) =>
          item.id === task.id ? updatedTask : item
        )
      );

      setMessage('Task moved successfully!');
    } catch (error) {
      console.error('Move task error:', error.response?.data || error);

      // Restore the previous state if saving fails
      setTasks(previousTasks);

      setMessage(
        error.response?.data?.message || 'Could not move task'
      );
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`, { headers });

      setTasks((old) =>
        old.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      setMessage('Could not delete task');
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setColumns([]);
    setTasks([]);

    if (socket) socket.disconnect();
  };

  // Login screen
  if (!token) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={login}>
          <div className="brand-icon">
            <LayoutDashboard size={30} />
          </div>

          <h1>Welcome Back</h1>
          <p>Sign in to your collaborative workspace</p>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <button className="primary-button">
            Login
          </button>

          {message && <p className="message">{message}</p>}
        </form>
      </main>
    );
  }

  // Dashboard
  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <LayoutDashboard />
          <span>TeamBoard</span>
        </div>

        <div className="top-actions">
          <span className="online">
            <span /> Live workspace
          </span>

          <button className="logout-button" onClick={logout}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </header>

      <section className="workspace">
        <div className="welcome">
          <div>
            <p className="eyebrow">WORKSPACE</p>
            <h1>Collaborative Kanban Board</h1>
            <p>
              Organize work, track progress and collaborate in real time.
            </p>
          </div>

          <Users size={35} />
        </div>

        <div className="board-settings">
          <input
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            placeholder="Enter your Board ID"
          />

          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="Enter your Tenant ID"
          />

          <button className="primary-button" onClick={loadBoard}>
            <RefreshCw size={16} /> Load Board
          </button>
        </div>

        {message && <p className="message">{message}</p>}

        <form className="add-column-form" onSubmit={addColumn}>
          <input
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            placeholder="New column name..."
          />

          <button className="primary-button">
            <Plus size={17} /> Add Column
          </button>
        </form>

        <div className="add-task-panel">
          <form onSubmit={addTask}>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Write a new task..."
            />

            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              required
            >
              <option value="">Select column</option>

              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>

            <button className="primary-button">
              <Plus size={17} /> Add Task
            </button>
          </form>
        </div>

        {/* Kanban board */}
        <section className="kanban">
          {columns.map((column) => (
            <div
              className="kanban-column"
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();

                const taskData = e.dataTransfer.getData('text/plain');

                console.log('Dropped task data:', taskData);
                console.log('Target column:', column.id);

                if (!taskData) {
                  console.log('No task data received');
                  return;
                }

                try {
                  const task = JSON.parse(taskData);
                  moveTask(task, column.id);
                } catch (error) {
                  console.error('Invalid dragged task data:', error);
                }
              }}
            >
              <div className="column-heading">
                <h2>{column.name}</h2>

                <span>
                  {tasks.filter(
                    (task) => task.columnId === column.id
                  ).length}
                </span>
              </div>

              {tasks
                .filter((task) => task.columnId === column.id)
                .map((task) => (
                  <article
                    className="task-card"
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify(task)
                      );

                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <div className="task-top">
                      <span className="priority">
                        {task.priority}
                      </span>

                      <button
                        className="delete-button"
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3>{task.title}</h3>

                    {task.description && <p>{task.description}</p>}

                    <div className="task-footer">
                      <span>{task.status}</span>
                      <span>v{task.version}</span>
                    </div>

                    <small>Drag to another column to move</small>
                  </article>
                ))}
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

export default App;
