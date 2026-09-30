import { useEffect, useState } from 'react';

const STORAGE_KEY = 'simple-kanban-tasks-v1';
const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

function loadTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(tasks) || !tasks.every(task =>
      task && typeof task.id === 'string' && typeof task.title === 'string'
      && columns.some(column => column.id === task.status),
    ) || new Set(tasks.map(task => task.id)).size !== tasks.length) {
      throw new Error('Invalid saved tasks');
    }
    return { tasks, error: '' };
  } catch {
    return { tasks: [], error: 'Saved tasks could not be loaded. Changes will not be saved this session.' };
  }
}

export default function App() {
  const [initial] = useState(loadTasks);
  const [tasks, setTasks] = useState(initial.tasks);
  const [title, setTitle] = useState('');
  const [saveError, setSaveError] = useState(initial.error);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  useEffect(() => {
    if (initial.error) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      setSaveError('');
    } catch {
      setSaveError('Changes could not be saved. Keep this page open to retain your tasks.');
    }
  }, [tasks, initial.error]);

  function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setTasks(current => [...current, {
      id: crypto.randomUUID(), title: title.trim(), status: 'todo',
    }]);
    setTitle('');
  }

  function moveTask(id, status) {
    setTasks(current => current.map(task => task.id === id ? { ...task, status } : task));
  }

  function endDrag() {
    setDraggedId(null);
    setDropTarget(null);
  }

  return (
    <main>
      <h1>Kanban Board</h1>
      <form onSubmit={addTask}>
        <input aria-label="New task" placeholder="New task..." maxLength={200}
          value={title} onChange={event => setTitle(event.target.value)} />
        <button type="submit" disabled={!title.trim()}>Add</button>
      </form>
      {saveError && <p className="error" role="alert">{saveError}</p>}

      <div className="board">
        {columns.map(column => {
          const columnTasks = tasks.filter(task => task.status === column.id);
          return (
            <section className={`column${dropTarget === column.id ? ' drop-target' : ''}`}
              key={column.id} aria-labelledby={column.id}
              onDragOver={event => {
                if (!draggedId) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTarget(column.id);
              }}
              onDragLeave={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
              }}
              onDrop={event => {
                event.preventDefault();
                if (draggedId) moveTask(draggedId, column.id);
                endDrag();
              }}>
              <h2 id={column.id}>{column.title}</h2>
              {columnTasks.length === 0 && <p className="empty">No tasks</p>}
              <ul>
                {columnTasks.map(task => (
                  <li key={task.id} draggable
                    className={draggedId === task.id ? 'dragging' : ''}
                    onDragStart={event => {
                      event.dataTransfer.setData('text/plain', task.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggedId(task.id);
                    }}
                    onDragEnd={endDrag}>
                    <p dir="auto">{task.title}</p>
                    <div className="task-actions">
                      <button type="button" aria-label={`Delete: ${task.title}`}
                        onClick={() => setTasks(current => current.filter(item => item.id !== task.id))}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
