import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/db.json');

// Reset db between tests
function resetDb() {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], sets: [], flashcards: [] }, null, 2));
}

let server;
let token;
let setId;
let flashcardId;

beforeAll(async () => {
  server = app.listen(0);
  resetDb();
});

afterAll(async () => {
  await server.close();
  resetDb();
});

describe('Server API', () => {
  it('registers a new user', async () => {
    const res = await request(server)
      .post('/api/register')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('fails to register with existing username', async () => {
    const res = await request(server)
      .post('/api/register')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(server)
      .post('/api/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('fails login with wrong password', async () => {
    const res = await request(server)
      .post('/api/login')
      .send({ username: 'testuser', password: 'wrongpass' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('denies access to protected route without token', async () => {
    const res = await request(server).get('/api/health');
    expect(res.status).toBe(401);
  });

  it('allows access to protected route with token', async () => {
    const res = await request(server)
      .get('/api/health')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('creates a new set', async () => {
    const res = await request(server)
      .post('/api/sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Set', description: 'desc', defaultLanguage: 'EN', translationLanguage: 'PL' });
    expect(res.status).toBe(200);
    expect(res.body.set).toBeDefined();
    setId = res.body.set.id;
  });

  it('gets all sets for user', async () => {
    const res = await request(server)
      .get('/api/sets')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sets)).toBe(true);
    expect(res.body.sets.length).toBeGreaterThan(0);
  });

  it('edits a set', async () => {
    const res = await request(server)
      .put(`/api/sets/${setId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Set' });
    expect(res.status).toBe(200);
    expect(res.body.set.name).toBe('Updated Set');
  });

  it('adds a flashcard to a set', async () => {
  const res = await request(server)
    .post(`/api/sets/${setId}/flashcards`)
    .set('Authorization', `Bearer ${token}`)
    .send({ front: 'Hello', back: 'Cześć', languageFront: 'EN', languageBack: 'PL' });
  console.log('Add flashcard response:', res.body);
  expect(res.status).toBe(200);
  expect(res.body.front).toBe('Hello');
  flashcardId = res.body.id;
});

  it('gets flashcards for a set', async () => {
    const res = await request(server)
      .get(`/api/sets/${setId}/flashcards`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  /*There should be also update flashcard in a set, delete flashcard in a set and delete a set */

  it('deletes a set', async () => {
  // Create a new set to ensure it exists for this test
  const createRes = await request(server)
    .post('/api/sets')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Set To Delete', description: 'desc', defaultLanguage: 'EN', translationLanguage: 'PL' });
  expect(createRes.status).toBe(200);
  const deleteSetId = createRes.body.set.id;

  // Now delete the set
  const res = await request(server)
    .delete(`/api/sets/${deleteSetId}`)
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);

  // Confirm set is deleted
  const getRes = await request(server)
    .get(`/api/sets`)
    .set('Authorization', `Bearer ${token}`);
  expect(getRes.body.sets.find(s => s.id === deleteSetId)).toBeUndefined();
});

    
  it('returns 404 for missing set', async () => {
    const res = await request(server)
      .put(`/api/sets/doesnotexist`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('updates a flashcard in a set', async () => {
    const res = await request(server)
      .put(`/api/sets/${setId}/flashcards/${flashcardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ front: 'Updated Hello', back: 'Zaktualizowane Cześć', languageFront: 'EN', languageBack: 'PL' });
    expect(res.status).toBe(200);
    expect(res.body.front).toBe('Updated Hello');
    expect(res.body.back).toBe('Zaktualizowane Cześć');
  });

  it('deletes a flashcard from a set', async () => {
    const res = await request(server)
      .delete(`/api/sets/${setId}/flashcards/${flashcardId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm flashcard is deleted
    const getRes = await request(server)
      .get(`/api/sets/${setId}/flashcards`);
    expect(getRes.body.find(card => card.id === flashcardId)).toBeUndefined();
  });

  it('returns 404 for missing flashcard', async () => {
    const res = await request(server)
      .put(`/api/sets/${setId}/flashcards/doesnotexist`)
      .set('Authorization', `Bearer ${token}`)
      .send({ front: 'No', back: 'Nie', languageFront: 'EN', languageBack: 'PL' });
    expect(res.status).toBe(404);
  });
});