import request from 'supertest';
import express from 'express';
import app from '../server.js';

describe('API Health Check', () => 
{
  it('should return success for /api/health', async () => 
    {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});