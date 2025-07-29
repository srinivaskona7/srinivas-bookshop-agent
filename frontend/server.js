import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route all requests to appropriate HTML files
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// New health check endpoint for Docker and monitoring
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 404 handler
// In Express 5, using a wildcard string like '*' can result in a
// "Missing parameter name" error when path-to-regexp parses the route. To avoid
// this, register a generic handler without a path. Any unmatched request will
// redirect to the login page.
app.use((req, res) => {
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});