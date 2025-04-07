const request = require('supertest');
const app = require('../app');

describe('POST /api/oas/test', () => {
  it('should return 400 for missing oasUrl', async () => {
    const res = await request(app).post('/api/oas/test').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/oasUrl is required/i);
  });

  it('should return 200 for valid oasUrl', async () => {
    const res = await request(app)
      .post('/api/oas/test')
      .send({ oasUrl: 'https://petstore3.swagger.io/api/v3/openapi.json' });

    if (res.statusCode !== 200) {
      console.error('Error response:', res.body);
    }

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    
    // Check summary structure
    expect(res.body.summary).toHaveProperty('total');
    expect(res.body.summary).toHaveProperty('success');
    expect(res.body.summary).toHaveProperty('failed');
    
    // Results should contain at least one entry
    expect(res.body.results.length).toBeGreaterThan(0);
  });
});
