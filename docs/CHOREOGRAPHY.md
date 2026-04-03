# Choreography System

Based on TDD §9 — Choreography Generation Pipeline.

---

## Overview

Each song produces a unique 30–45 second timestamped routine. Routines are stored as JSON and served via `/api/choreo/:trackId`. The system has three tiers:

1. **Cache** — pre-generated JSON in `/data/choreography/<videoId>.json`
2. **AI generation** — future, when `ENABLE_AI_CHOREO=true`
3. **Procedural fallback** — deterministic generation via `shared/choreoGenerator.js`

---

## Pipeline (TDD §9)

```
Input
  └─ videoId, title, artist, durationSec, BPM estimate, difficulty

Analysis
  └─ Divide time window into phrase sections:
       intro (0–15%) → verse (15–45%) → chorus (45–80%) → bridge (80–100%)

Generation
  └─ Walk each section, placing moves at difficulty-appropriate intervals
  └─ Chorus tightens interval by 15% for high-energy density
  └─ Intro loosens interval by 40% for warm-up feel
  └─ Combo bursts: 20–35% chance (by difficulty) of a quick back-to-back pair
  └─ Move picker avoids immediate repetition of the previous move

Validation
  └─ Minimum gap between moves = intervalSec × 0.5
  └─ All moves within startSec..endSec bounds
  └─ Moves sorted ascending by time

Output
  └─ ChoreographySegment JSON (see Data Models below)
```

---

## Difficulty Settings

| Difficulty     | Interval (sec) | Combo Length | Notes                     |
|----------------|----------------|--------------|---------------------------|
| `easy`         | 2.5            | 2            | 4 basic moves only        |
| `intermediate` | 1.8            | 3            | Full move library          |
| `hard`         | 1.2            | 5            | Full library + footwork    |

---

## Move Library

Defined in `/shared/moveLibrary.js`. Each move has:

| Field         | Description                              |
|---------------|------------------------------------------|
| `id`          | Key used in choreography JSON            |
| `label`       | Display name shown to player             |
| `icon`        | Emoji for HUD prompt                     |
| `direction`   | lateral / vertical / rotational / bilateral |
| `intensity`   | low / medium / high                      |
| `description` | Plain-English movement cue               |
| `difficulties`| Which difficulty levels include this move |

Current moves: `step_left`, `step_right`, `clap`, `bounce`, `arm_cross`, `arm_swing`, `spin`, `pivot`, `point`, `footwork`

---

## Data Model

### ChoreographySegment

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
  "sections": [
    { "name": "intro",  "start": 30.0, "end": 36.3 },
    { "name": "verse",  "start": 36.3, "end": 48.9 },
    { "name": "chorus", "start": 48.9, "end": 63.6 },
    { "name": "bridge", "start": 63.6, "end": 72.0 }
  ],
  "source": "cache",
  "generatedAt": "2026-04-03T00:00:00.000Z"
}
```

---

## Adding Pre-Made Choreography

Drop a JSON file matching the schema above into:

```
/data/choreography/<videoId>.json
```

The cache is checked first on every `/api/choreo/:trackId` request, so this file will always be served in preference to generated output.

---

## Sync Engine (TDD §10)

- YouTube playback time is the **master clock**
- Frontend polls player at 100ms intervals via `useGameTimer`
- Prompts activate `LEAD_IN_SEC = 0.5` seconds before their target time so the player sees the cue with enough time to react
- Scoring window: `±150ms` perfect / `±300ms` good / `±500ms` okay
- Pause, resume, and seek all reinitialize prompt state cleanly (no desync)

---

## Extending to AI Generation

When ready to enable AI choreography:

1. Set `ENABLE_AI_CHOREO=true` in `backend/.env`
2. Implement the generation call in `backend/src/services/choreoService.js` inside the `ENABLE_AI_CHOREO` branch
3. The AI prompt should supply: `videoId`, `title`, `artist`, `durationSec`, `bpm`, `difficulty`, `startSec`, `endSec`
4. Validate output with `choreoGenerator`'s `validateSpacing` logic before caching
5. Cache the result to `/data/choreography/<videoId>.json` via `cacheChoreography()`
