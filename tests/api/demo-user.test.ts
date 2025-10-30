import request from 'supertest';

const API = process.env.API_BASE || 'http://localhost:3000';

describe('API Demo User Tests', () => {
  it('creates demo user successfully', async () => {
    const res = await request(API)
      .post('/api/admin/create-demo-user')
      .expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('demoUser');
    expect(res.body.demoUser).toHaveProperty('memberCode', 'demo');
  });

  it('gets demo user profile', async () => {
    const res = await request(API)
      .get('/api/user/profile?memberCode=demo')
      .expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile).toHaveProperty('memberCode', 'demo');
  });

  it('gets trust units for demo user', async () => {
    const res = await request(API)
      .get('/api/trust/units/list?memberCode=demo')
      .expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('units');
    expect(Array.isArray(res.body.units)).toBe(true);
  });

  it('gets trust bonds for demo user', async () => {
    const res = await request(API)
      .get('/api/trust/bonds/list?memberCode=demo')
      .expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('bonds');
    expect(Array.isArray(res.body.bonds)).toBe(true);
  });

  it('gets voice prints for demo user', async () => {
    const res = await request(API)
      .get('/api/voice-prints?memberCode=demo')
      .expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('voicePrints');
  });

  it('gets invites for demo user', async () => {
    const res = await request(API)
      .get('/api/invites/list?memberCode=demo')
      .expect(200);

    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('invites');
    expect(Array.isArray(res.body.invites)).toBe(true);
  });
});

