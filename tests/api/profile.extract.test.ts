import request from 'supertest';

const API = process.env.API_BASE || 'http://localhost:3000';

describe('API /api/profile/extract', () => {
  it('returns a valid preview', async () => {
    const res = await request(API)
      .post('/api/profile/extract')
      .send({ domain: 'cooking', prompt: 'p', answer: 'a' })
      .expect(200);

    expect(res.body.preview.summary).toBeDefined();
    expect(Array.isArray(res.body.preview.anchors)).toBe(true);
    expect(typeof res.body.preview.confidence).toBe('number');
  });
});