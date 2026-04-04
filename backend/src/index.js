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

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Allow both polling and websocket — polling as fallback for Railway
  transports: ['polling', 'websocket'],
  allowEIO3: true,
});

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
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
  console.log(`[server] CORS origin: ${corsOrigin}`);
});

module.exports = { app, server };
