const request = require('supertest');
const app = require('../app');

describe('POST /api/oas/test', () => {
  const endpoint = '/api/oas/test';
  const validOasUrl = 'https://petstore3.swagger.io/api/v3/openapi.json';

  it('should return 400 for missing oasUrl', async () => {
    const res = await request(app).post(endpoint).send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/oasUrl is required/i);
  });

  it('should return 200 for valid oasUrl', async () => {
    const res = await request(app).post(endpoint).send({ oasUrl: validOasUrl });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('results');
    expect(res.body.results).toBeInstanceOf(Array);

    // Check summary structure
    expect(res.body.summary).toHaveProperty('total');
    expect(res.body.summary).toHaveProperty('success');
    expect(res.body.summary).toHaveProperty('failed');

    // Results should contain at least one entry
    expect(res.body.results.length).toBeGreaterThan(0);
  });
});