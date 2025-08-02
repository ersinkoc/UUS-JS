import { Router } from 'express';

const router = Router();

// Sample data store (in production, use a real database)
let todos = [
  { id: 1, text: 'Learn Uus.js', done: true },
  { id: 2, text: 'Build full-stack app', done: false },
  { id: 3, text: 'Deploy to production', done: false },
];

// Routes
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Todo routes
router.get('/todos', (req, res) => {
  res.json(todos);
});

router.post('/todos', (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Todo text is required' });
  }

  const newTodo = {
    id: Date.now(),
    text: text.trim(),
    done: false,
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

router.put('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { text, done } = req.body;

  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  if (text !== undefined) todo.text = text;
  if (done !== undefined) todo.done = done;

  res.json(todo);
});

router.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(index, 1);
  res.status(204).send();
});

// User routes (example)
router.get('/user', (req, res) => {
  res.json({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  });
});

export default router;
