const request = require('supertest');
const { app, server } = require('../src/index');

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('POST /api/session', () => {
  it('creates a session and returns sessionId', async () => {
    const res = await request(app)
      .post('/api/session')
      .send({ trackId: 'dQw4w9WgXcQ', track: { title: 'Test Track' } });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('sessionId');
    expect(res.body.trackId).toBe('dQw4w9WgXcQ');
    expect(res.body.status).toBe('waiting');
  });

  it('returns 400 if trackId is missing', async () => {
    const res = await request(app).post('/api/session').send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/session/:sessionId', () => {
  it('retrieves a previously created session', async () => {
    const createRes = await request(app)
      .post('/api/session')
      .send({ trackId: 'abc123' });
    const { sessionId } = createRes.body;

    const getRes = await request(app).get(`/api/session/${sessionId}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.sessionId).toBe(sessionId);
  });

  it('returns 404 for unknown session', async () => {
    const res = await request(app).get('/api/session/nonexistent-id');
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/choreo/:trackId', () => {
  it('returns choreography for the sample test track', async () => {
    const res = await request(app).get('/api/choreo/dQw4w9WgXcQ');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('moves');
    expect(Array.isArray(res.body.moves)).toBe(true);
    expect(res.body.moves.length).toBeGreaterThan(0);
    expect(res.body.moves[0]).toHaveProperty('time');
    expect(res.body.moves[0]).toHaveProperty('move');
  });

  it('returns generated choreography for unknown trackId', async () => {
    const res = await request(app).get('/api/choreo/unknown-track-xyz');
    expect(res.statusCode).toBe(200);
    expect(['generated', 'fallback']).toContain(res.body.source);
    expect(Array.isArray(res.body.moves)).toBe(true);
    expect(res.body.moves.length).toBeGreaterThan(0);
  });
});

describe('GET /api/search', () => {
  it('returns 400 if q param is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.statusCode).toBe(400);
  });

  it('returns stub results when no API key is set', async () => {
    const originalKey = process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_API_KEY;

    const res = await request(app).get('/api/search?q=test');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0]).toHaveProperty('videoId');

    process.env.YOUTUBE_API_KEY = originalKey;
  });
});
