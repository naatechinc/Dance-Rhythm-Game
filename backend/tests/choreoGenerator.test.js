const { generate } = require('../../shared/choreoGenerator');
const { TIMING_WINDOWS } = require('../../shared/constants');

const TEST_TRACK = {
  videoId: 'test_abc123',
  title: 'Test Song',
  artist: 'Test Artist',
  durationSec: 200,
};

describe('choreoGenerator.generate — basic output shape', () => {
  test('returns a valid ChoreographySegment', () => {
    const seg = generate(TEST_TRACK, { difficulty: 'intermediate', startSec: 30, endSec: 72 });
    expect(seg).toHaveProperty('trackId', TEST_TRACK.videoId);
    expect(seg).toHaveProperty('difficulty', 'intermediate');
    expect(seg).toHaveProperty('startSec', 30);
    expect(seg).toHaveProperty('endSec', 72);
    expect(Array.isArray(seg.moves)).toBe(true);
    expect(seg.moves.length).toBeGreaterThan(0);
  });

  test('every move has a time and move key', () => {
    const seg = generate(TEST_TRACK);
    seg.moves.forEach((m) => {
      expect(typeof m.time).toBe('number');
      expect(typeof m.move).toBe('string');
      expect(m.move.length).toBeGreaterThan(0);
    });
  });

  test('moves are sorted in ascending time order', () => {
    const seg = generate(TEST_TRACK);
    for (let i = 1; i < seg.moves.length; i++) {
      expect(seg.moves[i].time).toBeGreaterThanOrEqual(seg.moves[i - 1].time);
    }
  });

  test('all move times fall within startSec..endSec', () => {
    const seg = generate(TEST_TRACK, { startSec: 30, endSec: 72 });
    seg.moves.forEach((m) => {
      expect(m.time).toBeGreaterThanOrEqual(30);
      expect(m.time).toBeLessThanOrEqual(72);
    });
  });
});

describe('choreoGenerator.generate — difficulty behaviour', () => {
  test('hard difficulty produces more moves than easy over the same window', () => {
    const easy = generate(TEST_TRACK, { difficulty: 'easy',  startSec: 30, endSec: 72 });
    const hard = generate(TEST_TRACK, { difficulty: 'hard',  startSec: 30, endSec: 72 });
    expect(hard.moves.length).toBeGreaterThan(easy.moves.length);
  });

  test('easy difficulty does not include footwork (hard-only move)', () => {
    const seg = generate(TEST_TRACK, { difficulty: 'easy', startSec: 30, endSec: 72 });
    const hasFootwork = seg.moves.some((m) => m.move === 'footwork');
    expect(hasFootwork).toBe(false);
  });

  test('hard difficulty may include footwork', () => {
    // Run multiple seeds to increase chance of footwork appearing
    let found = false;
    for (let seed = 0; seed < 20; seed++) {
      const seg = generate(TEST_TRACK, { difficulty: 'hard', startSec: 30, endSec: 72, seed });
      if (seg.moves.some((m) => m.move === 'footwork')) { found = true; break; }
    }
    expect(found).toBe(true);
  });
});

describe('choreoGenerator.generate — determinism', () => {
  test('same inputs always produce the same output', () => {
    const opts = { difficulty: 'intermediate', startSec: 30, endSec: 72, seed: 42 };
    const a = generate(TEST_TRACK, opts);
    const b = generate(TEST_TRACK, opts);
    expect(a.moves).toEqual(b.moves);
  });

  test('different seeds produce different routines', () => {
    const a = generate(TEST_TRACK, { seed: 1 });
    const b = generate(TEST_TRACK, { seed: 9999 });
    expect(a.moves).not.toEqual(b.moves);
  });
});

describe('choreoGenerator.generate — spacing validation', () => {
  test('no two consecutive moves are impossibly close together', () => {
    const MIN_GAP = 0.5; // seconds
    const seg = generate(TEST_TRACK, { difficulty: 'hard', startSec: 30, endSec: 72 });
    for (let i = 1; i < seg.moves.length; i++) {
      const gap = seg.moves[i].time - seg.moves[i - 1].time;
      expect(gap).toBeGreaterThanOrEqual(MIN_GAP);
    }
  });

  test('throws if endSec <= startSec', () => {
    expect(() => generate(TEST_TRACK, { startSec: 50, endSec: 40 })).toThrow();
  });
});

describe('choreoGenerator.generate — phrase sections', () => {
  test('output includes sections metadata', () => {
    const seg = generate(TEST_TRACK, { startSec: 30, endSec: 72 });
    expect(Array.isArray(seg.sections)).toBe(true);
    const names = seg.sections.map((s) => s.name);
    expect(names).toContain('intro');
    expect(names).toContain('chorus');
  });
});
