import { useEffect, useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const response = await fetch('/api/tasks');
    const data = await response.json();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });

    if (response.ok) {
      setTitle('');
      setDescription('');
      fetchTasks();
    }
  };

  const toggleTask = async (task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed })
    });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  return (
    <div className="app">
      <h1>Task Manager</h1>
      <form onSubmit={addTask} className="task-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <button type="submit">Add Task</button>
      </form>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={task.completed ? 'completed' : ''}>
              <div>
                <strong>{task.title}</strong>
                <p>{task.description}</p>
              </div>
              <div className="task-actions">
                <button onClick={() => toggleTask(task)}>{task.completed ? 'Undo' : 'Complete'}</button>
                <button onClick={() => deleteTask(task.id)} className="danger">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
