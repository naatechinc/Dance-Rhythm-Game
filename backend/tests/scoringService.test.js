const { evaluateHit, applyHit, buildSummary } = require('../src/services/scoringService');
const testInputs = require('../../data/samples/test-inputs.json');

describe('scoringService.evaluateHit', () => {
  test('perfect hit — within ±150ms and correct move', () => {
    const result = evaluateHit(
      { inputTimeSec: 31.25, moveType: 'step_left' },
      { time: 31.2,  move: 'step_left' }
    );
    expect(result.result).toBe('perfect');
    expect(result.points).toBe(300);
  });

  test('good hit — within ±300ms', () => {
    const result = evaluateHit(
      { inputTimeSec: 33.18, moveType: 'arm_cross' },
      { time: 33.0, move: 'arm_cross' }
    );
    expect(result.result).toBe('good');
    expect(result.points).toBe(200);
  });

  test('okay hit — within ±500ms', () => {
    const result = evaluateHit(
      { inputTimeSec: 35.10, moveType: 'step_right' },
      { time: 34.8, move: 'step_right' }
    );
    expect(result.result).toBe('okay');
    expect(result.points).toBe(100);
  });

  test('miss — wrong move type', () => {
    const result = evaluateHit(
      { inputTimeSec: 36.60, moveType: 'spin' },
      { time: 36.60, move: 'clap' }
    );
    expect(result.result).toBe('miss');
    expect(result.points).toBe(0);
  });

  test('miss — correct move but too late', () => {
    const result = evaluateHit(
      { inputTimeSec: 42.80, moveType: 'step_left' },
      { time: 42.0, move: 'step_left' }
    );
    expect(result.result).toBe('miss');
    expect(result.points).toBe(0);
  });
});

describe('scoringService.applyHit', () => {
  test('increments combo and total on a hit', () => {
    const base = { total: 0, combo: 0, streak: 0, multiplier: 1 };
    const state = applyHit(base, { result: 'perfect', points: 300 });
    expect(state.total).toBe(300);
    expect(state.combo).toBe(1);
    expect(state.streak).toBe(1);
  });

  test('resets streak on miss but preserves total', () => {
    const base = { total: 900, combo: 3, streak: 3, multiplier: 1 };
    const state = applyHit(base, { result: 'miss', points: 0 });
    expect(state.streak).toBe(0);
    expect(state.total).toBe(900);
  });

  test('multiplier increases after threshold combos', () => {
    let state = { total: 0, combo: 0, streak: 0, multiplier: 1 };
    for (let i = 0; i < 5; i++) {
      state = applyHit(state, { result: 'perfect', points: 300 });
    }
    expect(state.multiplier).toBeGreaterThan(1);
  });

  test('multiplier caps at 4', () => {
    let state = { total: 0, combo: 0, streak: 0, multiplier: 1 };
    for (let i = 0; i < 40; i++) {
      state = applyHit(state, { result: 'perfect', points: 300 });
    }
    expect(state.multiplier).toBe(4);
  });
});

describe('scoringService.buildSummary', () => {
  test('computes correct accuracy and breakdown', () => {
    const session = {
      sessionId: 'sess_test',
      trackId: 'dQw4w9WgXcQ',
      scoreEvents: [
        { result: 'perfect', points: 300, combo: 1 },
        { result: 'good',    points: 200, combo: 2 },
        { result: 'miss',    points: 0,   combo: 0 },
        { result: 'okay',    points: 100, combo: 1 },
      ],
    };
    const summary = buildSummary(session);
    expect(summary.total).toBe(600);
    expect(summary.accuracy).toBe(75); // 3/4 hits
    expect(summary.breakdown.perfect).toBe(1);
    expect(summary.breakdown.miss).toBe(1);
  });

  test('handles empty session gracefully', () => {
    const session = { sessionId: 'empty', trackId: 'abc', scoreEvents: [] };
    const summary = buildSummary(session);
    expect(summary.total).toBe(0);
    expect(summary.accuracy).toBe(0);
  });
});

describe('scoring regression — test-inputs.json fixture', () => {
  const choreoMoves = require('../../data/choreography/dQw4w9WgXcQ.json').moves;

  testInputs.inputs.forEach(({ inputTimeSec, moveType, expectedResult }) => {
    test(`input at ${inputTimeSec}s (${moveType}) → ${expectedResult}`, () => {
      // Find the closest scheduled move
      const scheduled = choreoMoves.reduce((best, m) => {
        return Math.abs(m.time - inputTimeSec) < Math.abs(best.time - inputTimeSec) ? m : best;
      });
      const { result } = evaluateHit({ inputTimeSec, moveType }, scheduled);
      expect(result).toBe(expectedResult);
    });
  });
});
