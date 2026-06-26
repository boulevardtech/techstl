import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { initializeDatabase } from './db.js';

const { Pool } = pkg;
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const requestedPort = Number(process.env.PORT || 5000);
const getConnectionString = () => {
  if (process.env.DATABASE_URL && /postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL)) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'taskdb';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
};

const pool = new Pool({
  connectionString: getConnectionString(),
});

let dbReady = false;
let dbStatusMessage = 'Database not initialized';
let memoryTasks = [];

const getNextId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const listTasks = async () => {
  if (!dbReady) {
    return memoryTasks;
  }

  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    return result.rows;
  } catch (error) {
    dbReady = false;
    dbStatusMessage = error instanceof Error ? error.message : String(error);
    return memoryTasks;
  }
};

const createTask = async ({ title, description }) => {
  if (!dbReady) {
    const task = { id: getNextId(), title, description: description || '', completed: false, created_at: new Date().toISOString() };
    memoryTasks = [task, ...memoryTasks];
    return task;
  }

  const result = await pool.query(
    'INSERT INTO tasks (title, description, completed) VALUES ($1, $2, $3) RETURNING *',
    [title, description || '', false]
  );
  return result.rows[0];
};

const updateTask = async (id, updates) => {
  if (!dbReady) {
    memoryTasks = memoryTasks.map((task) => (task.id === id ? { ...task, ...updates } : task));
    return memoryTasks.find((task) => task.id === id);
  }

  const result = await pool.query(
    'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), completed = COALESCE($3, completed) WHERE id = $4 RETURNING *',
    [updates.title, updates.description, updates.completed, id]
  );
  return result.rows[0];
};

const deleteTask = async (id) => {
  if (!dbReady) {
    memoryTasks = memoryTasks.filter((task) => task.id !== id);
    return true;
  }

  const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
  return result.rows.length > 0;
};

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', database: { dbReady, message: dbStatusMessage } });
});

app.get('/api/tasks', async (_req, res) => {
  try {
    const tasks = await listTasks();
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const task = await createTask({ title, description });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;

  try {
    const task = await updateTask(id, { title, description, completed });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const startServer = async (port = requestedPort) => {
  try {
    const initResult = await initializeDatabase(pool);
    dbReady = initResult.dbReady;
    dbStatusMessage = initResult.message;

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      if (!dbReady) {
        console.log('Using in-memory task storage because PostgreSQL is unavailable.');
      }
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is busy, trying ${port + 1} instead.`);
        server.close(() => {
          startServer(port + 1);
        });
      } else {
        console.error('Failed to start server', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
