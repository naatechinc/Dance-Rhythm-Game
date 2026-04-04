# Local Development Setup

## Prerequisites

- Node.js v18+
- npm v9+
- A YouTube Data API v3 key ([get one here](https://console.cloud.google.com/))

---

## 1. Clone & Install

```bash
git clone https://github.com/naatechinc/Dance-Rhythm-Game.git
cd Dance-Rhythm-Game

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## 2. Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# → Open backend/.env and set YOUTUBE_API_KEY

# Frontend
cp frontend/.env.example frontend/.env
# → VITE_API_BASE_URL defaults to http://localhost:3001 (no changes needed for local dev)
```

---

## 3. Run Locally

Open two terminal windows:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
# → http://localhost:3001
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 4. Test the MVP Flow

1. Open `http://localhost:5173` in a browser
2. Search for a song (e.g. "Rick Astley")
3. Select a result — a session is created and you land on the player screen
4. The test choreography for `dQw4w9WgXcQ` will load from `/data/choreography/`
5. Move prompts appear on screen timed to the video

---

## 5. Phone Controller (Local Network)

1. Ensure your phone and computer are on the same Wi-Fi network
2. Find your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Open `http://<your-ip>:5173/pair/<sessionId>` on your phone
4. The phone will start sending motion data to the game session

---

## 6. Run Tests

```bash
cd backend
npm test
```

To run with coverage:
```bash
npm test -- --coverage
```

---

## 7. Adding a New Choreography

Drop a JSON file into `/data/choreography/<videoId>.json` following this schema:

```json
{
  "trackId": "<videoId>",
  "difficulty": "intermediate",
  "startSec": 30,
  "endSec": 72,
  "moves": [
    { "time": 31.2, "move": "step_left" },
    { "time": 33.0, "move": "clap" }
  ]
}
```

Valid move keys are defined in `/shared/constants.js` under `MOVE_LIBRARY`.

---

## 8. Deployment

**Frontend → Vercel**
```bash
cd frontend
npx vercel --prod
```
Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` to your backend's production URL in the Vercel dashboard.

**Backend → Railway / Render**
- Point to the `/backend` directory
- Set environment variables: `PORT`, `YOUTUBE_API_KEY`, `CORS_ORIGIN`, `NODE_ENV=production`
- Start command: `npm start`
