/**
 * schemas.js
 * JSDoc type definitions for all core data models.
 * Referenced by frontend and backend alike.
 */

/**
 * @typedef {Object} TrackMetadata
 * @property {string}      videoId      - YouTube video ID
 * @property {string}      title        - Track title
 * @property {string}      artist       - Artist / channel name
 * @property {number|null} durationSec  - Total video duration in seconds
 * @property {string|null} thumbnail    - Thumbnail image URL
 * @property {string}      source       - e.g. 'youtube'
 * @property {string}      language     - e.g. 'en'
 */

/**
 * @typedef {Object} MoveEvent
 * @property {number} time  - Target timestamp in seconds (master clock)
 * @property {string} move  - Move identifier, e.g. 'step_left'
 */

/**
 * @typedef {Object} ChoreographySegment
 * @property {string}      trackId      - Corresponding video ID
 * @property {string}      difficulty   - 'easy' | 'intermediate' | 'hard'
 * @property {number}      startSec     - Segment start time
 * @property {number}      endSec       - Segment end time
 * @property {MoveEvent[]} moves        - Ordered list of timed move prompts
 * @property {string}      [source]     - 'cache' | 'ai' | 'fallback'
 * @property {string}      [generatedAt]
 */

/**
 * @typedef {Object} PlayerSession
 * @property {string}      sessionId      - Unique session UUID
 * @property {string}      trackId        - Selected track video ID
 * @property {TrackMetadata} track        - Full track metadata snapshot
 * @property {string}      status         - SESSION_STATUS value
 * @property {number}      currentTimeSec - Last known playback position
 * @property {string[]}    players        - Connected player socket IDs
 * @property {ScoreEvent[]} scoreEvents   - All recorded hit events
 * @property {number}      createdAt      - Unix ms timestamp
 */

/**
 * @typedef {Object} ScoreEvent
 * @property {string} result       - 'perfect' | 'good' | 'okay' | 'miss'
 * @property {number} points       - Points awarded
 * @property {number} delta        - Timing delta in seconds
 * @property {number} inputTimeSec - When the input arrived
 * @property {string} moveType     - Move the player performed
 * @property {number} combo        - Combo count at time of event
 * @property {object} scoreState   - Running { total, combo, streak, multiplier }
 * @property {number} ts           - Server timestamp (ms)
 */

/**
 * @typedef {Object} ScoreSummary
 * @property {string} sessionId
 * @property {string} trackId
 * @property {number} total       - Final score
 * @property {number} accuracy    - 0–100 integer
 * @property {number} combo       - Max combo achieved
 * @property {{ perfect: number, good: number, okay: number, miss: number }} breakdown
 * @property {string} completedAt - ISO timestamp
 */

module.exports = {}; // types only — no runtime values
