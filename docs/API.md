# API Reference

Base URL (local): `http://localhost:3001`

---

## GET /api/health

Health check.

**Response**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 42,
  "timestamp": "2026-04-03T12:00:00.000Z"
}
```

---

## GET /api/search

Search for songs/artists via YouTube.

**Query Parameters**

| Param | Type   | Required | Description         |
|-------|--------|----------|---------------------|
| `q`   | string | ✅       | Song or artist name |

**Response `200`**
```json
{
  "results": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Never Gonna Give You Up",
      "artist": "Rick Astley",
      "durationSec": 214,
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      "source": "youtube",
      "language": "en"
    }
  ]
}
```

**Error `400`** — missing `q` param  
**Error `502`** — YouTube API failure

---

## POST /api/session

Create a new game session.

**Body**
```json
{
  "trackId": "dQw4w9WgXcQ",
  "track": { "title": "Never Gonna Give You Up", "artist": "Rick Astley" }
}
```

**Response `201`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "trackId": "dQw4w9WgXcQ",
  "status": "waiting"
}
```

---

## GET /api/session/:sessionId

Retrieve session state.

**Response `200`** — Full `PlayerSession` object  
**Error `404`** — Session not found

---

## GET /api/session/:sessionId/results

Get final score summary for a completed session.

**Response `200`**
```json
{
  "sessionId": "...",
  "trackId": "dQw4w9WgXcQ",
  "total": 2400,
  "accuracy": 87,
  "combo": 12,
  "breakdown": {
    "perfect": 8,
    "good": 4,
    "okay": 2,
    "miss": 2
  },
  "completedAt": "2026-04-03T12:05:00.000Z"
}
```

---

## PATCH /api/session/:sessionId

Update session status.

**Body**
```json
{ "status": "playing" }
```

Valid statuses: `waiting` | `playing` | `paused` | `finished`

---

## GET /api/choreo/:trackId

Fetch choreography segment for a track.

**Query Parameters**

| Param        | Type   | Default        | Description                  |
|--------------|--------|----------------|------------------------------|
| `difficulty` | string | `intermediate` | `easy`, `intermediate`, `hard` |
| `startSec`   | number | `30`           | Segment start time           |
| `endSec`     | number | `72`           | Segment end time             |

**Response `200`**
```json
{
  "trackId": "dQw4w9WgXcQ",
  "difficulty": "intermediate",
  "startSec": 30,
  "endSec": 72,
  "moves": [
    { "time": 31.2, "move": "step_left" },
    { "time": 33.0, "move": "arm_cross" }
  ],
  "source": "cache"
}
```

---

## WebSocket Events

Connect to the backend Socket.io server and join a session room.

### Client → Server

| Event               | Payload                                         | Description                        |
|---------------------|-------------------------------------------------|------------------------------------|
| `session:join`      | `{ sessionId, role? }`                          | Join a session room                |
| `controller:motion` | `{ sessionId, timestamp, ax, ay, az, alpha, beta, gamma }` | Raw phone motion data |
| `input:submit`      | `{ sessionId, inputTimeSec, moveType }`         | Submit a scored input              |
| `ping`              | —                                               | Heartbeat                          |

### Server → Client

| Event                 | Payload                                | Description                        |
|-----------------------|----------------------------------------|------------------------------------|
| `session:joined`      | `{ sessionId, status }`               | Confirmed join                     |
| `session:error`       | `{ message }`                         | Session error                      |
| `session:playerJoined`| `{ playerId }`                        | A controller connected             |
| `session:playerLeft`  | `{ playerId }`                        | A controller disconnected          |
| `controller:motion`   | Raw motion payload                    | Forwarded to game client           |
| `input:scored`        | `{ result, scoreUpdate }`             | Hit evaluation result              |
| `pong`                | `{ ts }`                              | Heartbeat response                 |
