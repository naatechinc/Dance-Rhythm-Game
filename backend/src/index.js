require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const searchRoutes = require('./routes/search');
const sessionRoutes = require('./routes/session');
const choreoRoutes = require('./routes/choreo');
const healthRoutes = require('./routes/health');
const registerSocketHandlers = require('./sockets/socketHandlers');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/choreo', choreoRoutes);
app.use('/api/health', healthRoutes);

// Sockets
registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});

module.exports = { app, server };
