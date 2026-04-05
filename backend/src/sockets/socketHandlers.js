/**
 * socketHandlers.js
 * Registers all Socket.io event handlers.
 * Handles: session join/leave, controller motion input, scoring relay, heartbeat.
 */

const sessionService = require('../services/sessionService');
const scoringService = require('../services/scoringService');
const choreoService = require('../services/choreoService');

/** @param {import('socket.io').Server} io */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ------------------------------------------------------------------
    // Join a game session room
    // ------------------------------------------------------------------
    socket.on('session:join', ({ sessionId, role = 'player' }) => {
      if (!sessionId) return;

      const session = sessionService.getSession(sessionId);
      if (!session) {
        socket.emit('session:error', { message: 'Session not found.' });
        return;
      }

      socket.join(sessionId);
      socket.data.sessionId = sessionId;
      socket.data.role = role;

      if (role === 'controller') {
        sessionService.addPlayer(sessionId, socket.id);
        // Assign a color index based on how many players are already in session
        const PLAYER_COLORS = ['#e94560', '#40c4ff', '#00e676', '#b04dff', '#ff9800', '#ff4ea3'];
        const playerCount = session.players.length; // count BEFORE adding
        const assignedColor = PLAYER_COLORS[playerCount % PLAYER_COLORS.length];
        socket.data.playerColor = assignedColor;
        // Tell the game screen a new player joined (with their color)
        io.to(sessionId).emit('session:playerJoined', { playerId: socket.id, color: assignedColor });
        // Tell the controller what color they are
        socket.emit('player:color', { color: assignedColor, playerIndex: playerCount });
        console.log(`[socket] controller joined session ${sessionId} as color ${assignedColor}`);
      }

      socket.emit('session:joined', { sessionId, status: session.status });
    });

    // ------------------------------------------------------------------
    // Controller sends raw motion data
    // ------------------------------------------------------------------
    socket.on('controller:motion', (payload) => {
      const { sessionId } = socket.data;
      if (!sessionId) return;

      // Forward full sensor data to game client with playerId
      socket.to(sessionId).emit('controller:motion', {
        ...payload,
        playerId: socket.id,
      });
    });

    // ------------------------------------------------------------------
    // Game client submits a scored input event
    // ------------------------------------------------------------------
    socket.on('input:submit', async ({ sessionId: sid, inputTimeSec, moveType }) => {
      const sessionId = sid || socket.data.sessionId;
      if (!sessionId) return;

      const session = sessionService.getSession(sessionId);
      if (!session) return;

      // Find the closest scheduled move within the okay window
      let choreo;
      try {
        choreo = await choreoService.getChoreography(session.trackId, {});
      } catch (_) {
        return;
      }

      const candidate = findClosestMove(choreo?.moves ?? [], inputTimeSec);
      if (!candidate) return;

      const hitResult = scoringService.evaluateHit({ inputTimeSec, moveType }, candidate);

      // Build running score
      const lastEvent = session.scoreEvents[session.scoreEvents.length - 1];
      const prevScore = lastEvent?.scoreState ?? { total: 0, combo: 0, streak: 0, multiplier: 1 };
      const newScore = scoringService.applyHit(prevScore, hitResult);

      const event = {
        ...hitResult,
        inputTimeSec,
        moveType,
        combo: newScore.combo,
        scoreState: newScore,
        ts: Date.now(),
      };

      sessionService.recordScoreEvent(sessionId, event);

      // Broadcast result to everyone in the session
      io.to(sessionId).emit('input:scored', { result: hitResult.result, scoreUpdate: newScore, playerId: socket.id });
    });

    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    // Controller changes background scene
    // ------------------------------------------------------------------
    socket.on('scene:change', ({ sessionId: sid, scene }) => {
      const sessionId = sid || socket.data.sessionId;
      if (!sessionId || !scene) return;
      // Broadcast to everyone in session (including game screen)
      io.to(sessionId).emit('scene:change', { scene });
    });

    // Heartbeat / ping-pong
    // ------------------------------------------------------------------
    socket.on('ping', () => socket.emit('pong', { ts: Date.now() }));

    // ------------------------------------------------------------------
    // Disconnect
    // ------------------------------------------------------------------
    socket.on('disconnect', (reason) => {
      const { sessionId, role } = socket.data;
      if (sessionId && role === 'controller') {
        sessionService.removePlayer(sessionId, socket.id);
        io.to(sessionId).emit('session:playerLeft', { playerId: socket.id });
      }
      console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    });
  });
}

/**
 * Find the move in a choreography closest to inputTimeSec,
 * within the maximum timing window.
 */
function findClosestMove(moves, inputTimeSec) {
  const MAX_WINDOW = 0.5; // 500ms max
  let best = null;
  let bestDelta = Infinity;

  for (const move of moves) {
    const delta = Math.abs(move.time - inputTimeSec);
    if (delta < bestDelta && delta <= MAX_WINDOW) {
      best = move;
      bestDelta = delta;
    }
  }

  return best;
}

module.exports = registerSocketHandlers;
