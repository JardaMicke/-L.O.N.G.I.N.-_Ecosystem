const request = require('supertest');
const express = require('express');

const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'longin-character' }));

describe('API Endpoints', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
