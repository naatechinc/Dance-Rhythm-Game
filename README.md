# Dance Rhythm Game

A rhythm-based dance game that syncs AI-generated choreography to streamed music. Players select a song, follow on-screen dance prompts, and are scored based on timing and movement accuracy using phone motion controls.

## Game Pillars
- **Accessibility** – Easy to start, difficult to master
- **Fun First** – Movement and rhythm over perfection
- **Expressive Movement** – Encourages style, not just accuracy
- **Social Energy** – Designed for group hype and competition
- **Fast Setup** – Minimal friction to start playing

---

## Repository Structure

```
/frontend        React game client (search, player, HUD, results)
/backend         Node.js API + Socket.io server
/shared          Common schemas, constants, move library, scoring
/data            Static choreography samples and test fixtures
/docs            GDD, TDD, API notes
```

---

## Prerequisites

- Node.js v18+
- npm v9+

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/naatechinc/Dance-Rhythm-Game.git
cd Dance-Rhythm-Game
```

### 2. Set up environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in your API keys in each .env file
```

### 3. Install dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run locally
```bash
# In /backend
npm run dev

# In /frontend (separate terminal)
npm run dev
```

Frontend runs at `http://localhost:5173`  
Backend runs at `http://localhost:3001`

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/search` | GET | Search songs/artists, returns video results |
| `/api/session` | POST | Create a new game session |
| `/api/choreo/:trackId` | GET | Fetch choreography for a track |
| `/api/health` | GET | Health check |

---

## Deployment

- **Frontend:** [Vercel](https://vercel.com)
- **Backend:** [Railway](https://railway.app) or [Render](https://render.com)

---

## MVP Checklist

- [ ] User can search and select a song
- [ ] Video loads and starts
- [ ] Choreography segment appears on time
- [ ] Phone controller can connect and submit input
- [ ] Player receives score + results screen without crashes

---

## Version History

| Version | Notes |
|---|---|
| v0.1 | Base GDD |
| v0.2 | Added scoring system |
| v0.3 | Added YouTube streaming approach |
| v0.4 | Upgraded choreography system (AI + intermediate difficulty) |
| v0.5 | Added search system and UI flow |
