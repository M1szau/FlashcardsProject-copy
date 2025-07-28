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
function resetDb() 
{
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], sets: [], flashcards: [] }, null, 2));
}

let server;
let token;
let setId;
let flashcardId;

beforeAll(async () => 
{
  server = app.listen(0);
  resetDb();
});

afterAll(async () => 
{
  await server.close();
  resetDb();
});

describe('Server API', () => 
{
    it('Registers a new user', async () => 
    {
        const res = await request(server)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
  });

    it('Fails to register with existing username', async () => 
    {
        const res = await request(server)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('Logs in with correct credentials', async () => 
    {
        const res = await request(server)
            .post('/api/login')
            .send({ username: 'testuser', password: 'testpass' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        token = res.body.token;
     });

    it('Fails login with wrong password', async () => 
    {
        const res = await request(server)
            .post('/api/login')
            .send({ username: 'testuser', password: 'wrongpass' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('Denies access to protected route without token', async () => 
    {
        const res = await request(server).get('/api/health');
        expect(res.status).toBe(401);
    });

     it('Allows access to protected route with token', async () => 
    {
        const res = await request(server)
        .get('/api/health')
        .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('Creates a new set', async () => 
    {
        const res = await request(server)
        .post('/api/sets')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Set', description: 'desc', defaultLanguage: 'EN', translationLanguage: 'PL' });
        expect(res.status).toBe(200);
        expect(res.body.set).toBeDefined();
        setId = res.body.set.id;
    });

    it('Gets all sets for user', async () => 
    {
        const res = await request(server)
        .get('/api/sets')
        .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.sets)).toBe(true);
        expect(res.body.sets.length).toBeGreaterThan(0);
    });

    it('Edits a set', async () => 
    {
        const res = await request(server)
        .put(`/api/sets/${setId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Set' });
        expect(res.status).toBe(200);
        expect(res.body.set.name).toBe('Updated Set');
    });

    it('Adds a flashcard to a set', async () => 
    {
    const res = await request(server)
        .post(`/api/sets/${setId}/flashcards`)
        .set('Authorization', `Bearer ${token}`)
        .send({ front: 'Hello', back: 'Cześć', languageFront: 'EN', languageBack: 'PL' });
    console.log('Add flashcard response:', res.body);
    expect(res.status).toBe(200);
    expect(res.body.front).toBe('Hello');
    flashcardId = res.body.id;
    });

    it('Gets flashcards for a set', async () => 
    {
        const res = await request(server)
            .get(`/api/sets/${setId}/flashcards`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('Deletes a set', async () => 
    {
        // Create a new set to ensure it exists for this test
        const createRes = await request(server)
            .post('/api/sets')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Set To Delete', description: 'desc', defaultLanguage: 'EN', translationLanguage: 'PL' });
        expect(createRes.status).toBe(200);
        const deleteSetId = createRes.body.set.id;

        // Delete the set
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

    it('Returns 404 for missing set', async () => 
    {
        const res = await request(server)
        .put(`/api/sets/doesnotexist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nope' });
        expect(res.status).toBe(404);
    });

     it('Updates a flashcard in a set', async () => 
    {
        const res = await request(server)
            .put(`/api/sets/${setId}/flashcards/${flashcardId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ front: 'Updated Hello', back: 'Zaktualizowane Cześć', languageFront: 'EN', languageBack: 'PL' });
        expect(res.status).toBe(200);
        expect(res.body.front).toBe('Updated Hello');
        expect(res.body.back).toBe('Zaktualizowane Cześć');
    });

    it('Deletes a flashcard from a set', async () => 
    {
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

    it('Returns 404 for missing flashcard', async () => 
    {
        const res = await request(server)
            .put(`/api/sets/${setId}/flashcards/doesnotexist`)
            .set('Authorization', `Bearer ${token}`)
            .send({ front: 'No', back: 'Nie', languageFront: 'EN', languageBack: 'PL' });
        expect(res.status).toBe(404);
    });

    /* Tests that were missing according to GitHub Actions */

    //Creating a set with missing required fields
    it('Returns 400 when creating a set with missing fields', async () => 
    {
        const res = await request(server)
            .post('/api/sets')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: '' }); // missing required fields
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    //Adding a flashcard to a non-existent set
    it('Returns 404 when adding a flashcard to a non-existent set', async () => 
    {
        const res = await request(server)
            .post('/api/sets/doesnotexist/flashcards')
            .set('Authorization', `Bearer ${token}`)
            .send({ front: 'Test', back: 'Test', languageFront: 'EN', languageBack: 'PL' });
        expect(res.status).toBe(404);
    });

    //Deleting a flashcard that does not exist
    it('Returns 404 when deleting a non-existent flashcard', async () => 
    {
        const res = await request(server)
            .delete(`/api/sets/${setId}/flashcards/doesnotexist`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    //Unauthorized access to protected route
    it('Returns 401 when accessing protected route without token', async () => 
    {
        const res = await request(server)
            .get('/api/sets');
        expect(res.status).toBe(401);
    });

    //Error in POST /api/sets/:setId/flashcards (by throw)
    it('Handles error in POST /api/sets/:setId/flashcards', async () => 
    {
        const original = app.locals.addFlashcardToSet;
        app.locals.addFlashcardToSet = () => { throw new Error('Simulated error'); };
        const res = await request(server)  // Use server, not app
            .post(`/api/sets/${setId}/flashcards`)  // Use valid setId
            .set('Authorization', `Bearer ${token}`)  // Use valid token
            .send({ front: 'a', back: 'b', languageFront: 'EN', languageBack: 'PL' });
        expect(res.status).toBe(500);
        app.locals.addFlashcardToSet = original;
    });

    //Error in PUT /api/sets/:setId/flashcards/:cardId (by throw)
    it('Handles error in PUT /api/sets/:setId/flashcards/:cardId', async () => 
    {
        const originalRead = app.locals.db?.read;
        if (app.locals.db) app.locals.db.read = () => { throw new Error('Simulated error'); };
        const res = await request(server)  // Use server, not app
            .put(`/api/sets/${setId}/flashcards/someid`)  // Use valid setId
            .set('Authorization', `Bearer ${token}`)  // Use valid token
            .send({ front: 'a', back: 'b', languageFront: 'EN', languageBack: 'PL' });
        expect(res.status).toBe(500);
        if (app.locals.db) app.locals.db.read = originalRead;
    });

    //Error in DELETE /api/sets/:setId/flashcards/:cardId (by throw)
    it('Handles error in DELETE /api/sets/:setId/flashcards/:cardId', async () => 
    {
        const originalRead = app.locals.db?.read;
        if (app.locals.db) app.locals.db.read = () => { throw new Error('Simulated error'); };
        const res = await request(server)  // Use server, not app
            .delete(`/api/sets/${setId}/flashcards/someid`)  // Use valid setId
            .set('Authorization', `Bearer ${token}`);  // Use valid token
        expect(res.status).toBe(500);
        if (app.locals.db) app.locals.db.read = originalRead;
    });

    //Next set of tests (uncovered casses accoring to GitHub Actions)

    //Test for lines 263-265
    it('Handles server error during set creation', async () => 
    {
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = () => { throw new Error('Database write error'); };
        
        const res = await request(server)
            .post('/api/sets')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test Set', description: 'desc', defaultLanguage: 'EN', translationLanguage: 'PL' });
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBeDefined();
        
        // Restore original function
        fs.writeFileSync = originalWriteFileSync;
    });

    //Test for lines 302-304
    it('Returns 400 when creating flashcard with missing required fields', async () => 
    {
        const res = await request(server)
            .post(`/api/sets/${setId}/flashcards`)
            .set('Authorization', `Bearer ${token}`)
            .send({ front: 'Hello' });
        
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('All fields are required');
    });

    //Test for lines 323-324
    it('Handles server error during flashcard update', async () => 
    {
        const createRes = await request(server)
            .post(`/api/sets/${setId}/flashcards`)
            .set('Authorization', `Bearer ${token}`)
            .send({ front: 'Test', back: 'Test', languageFront: 'EN', languageBack: 'PL' });
        
        const cardId = createRes.body.id;
        
        //Break the db.write function to simulate an error
        const originalWrite = app.locals.db?.write;
        if (app.locals.db) app.locals.db.write = () => { throw new Error('Database write error'); };
        
        const res = await request(server)
            .put(`/api/sets/${setId}/flashcards/${cardId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ front: 'Updated', back: 'Updated', languageFront: 'EN', languageBack: 'PL' });
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to update flashcard');
        
        if (app.locals.db) app.locals.db.write = originalWrite;
    });

    //Test for edge case - empty flashcard fields
    it('Returns 400 when creating flashcard with empty strings', async () => 
    {
        const res = await request(server)
            .post(`/api/sets/${setId}/flashcards`)
            .set('Authorization', `Bearer ${token}`)
            .send({ front: '', back: 'Test', languageFront: 'EN', languageBack: 'PL' });
        
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    //Unauthorized flashcard access
    it('Returns 404 when updating flashcard in set not owned by user', async () => 
    {
        await request(server)
            .post('/api/register')
            .send({ username: 'otheruser', password: 'otherpass' });
        
        const loginRes = await request(server)
            .post('/api/login')
            .send({ username: 'otheruser', password: 'otherpass' });
        
        const otherToken = loginRes.body.token;
        
        //Update a flashcard with the other user's token
        const res = await request(server)
            .put(`/api/sets/${setId}/flashcards/someid`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({ front: 'Hack', back: 'Attempt', languageFront: 'EN', languageBack: 'PL' });
        
        expect(res.status).toBe(404);
    });

    // Next set of tests (uncovered cases according to GitHub Actions) / 2
    //Lines 195-198
    it('Handles server error during user registration', async () => 
    {
        // Mock fs.writeFileSync for registration write operation
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = (path, data) => {
            if (path.includes('db.json')) {
                throw new Error('Database write error');
            }
            return originalWriteFileSync(path, data);
        };
        
        const res = await request(server)
            .post('/api/register')
            .send({ username: 'erroruser', password: 'errorpass' });
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to register user');
        
        // Restore original function
        fs.writeFileSync = originalWriteFileSync;
    });

    //Lines 270-271
    it('Handles server error during set update', async () => 
    {
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = () => { throw new Error('Database write error'); };
        
        const res = await request(server)
            .put(`/api/sets/${setId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Error Update' });
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to update set'); // Expect specific error message
        
        // Restore original function
        fs.writeFileSync = originalWriteFileSync;
    });

    // Test for lines 308-310 (likely validation in flashcard update)
    it('Returns 404 when updating flashcard with invalid set ownership', async () => 
    {
        // Create another user
        await request(server)
            .post('/api/register')
            .send({ username: 'user2', password: 'pass2' });
        
        const loginRes = await request(server)
            .post('/api/login')
            .send({ username: 'user2', password: 'pass2' });
        
        const user2Token = loginRes.body.token;
        
        //Update a flashcard in a set owned by user1 using user2's token
        const res = await request(server)
            .put(`/api/sets/${setId}/flashcards/nonexistent`)
            .set('Authorization', `Bearer ${user2Token}`)
            .send({ front: 'Hack', back: 'Attempt', languageFront: 'EN', languageBack: 'PL' });
        
        expect(res.status).toBe(404);
    });

    //Additional test for username validation in login
    it('Returns 400 when logging in with non-existent user', async () => 
    {
        const res = await request(server)
            .post('/api/login')
            .send({ username: 'nonexistent', password: 'anypass' });
        
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

        //Missing username/password in registration
    it('Returns 400 when registering without username or password', async () => 
    {
        const res = await request(server)
            .post('/api/register')
            .send({ username: '', password: '' });
        
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    //JWT token validation error
    it('Returns 401 with malformed token', async () => 
    {
        const res = await request(server)
            .get('/api/sets')
            .set('Authorization', 'Bearer completely.invalid.token.format');
        
        expect(res.status).toBe(401);
    });

    //Database read error in login
    it('Handles server error during login', async () => 
    {
        const originalReadFileSync = fs.readFileSync;
        fs.readFileSync = (path, encoding) => 
        {
            if (path.includes('db.json')) 
            {
                throw new Error('Database read error');
            }
            return originalReadFileSync(path, encoding);
        };
        
        const res = await request(server)
            .post('/api/login')
            .send({ username: 'testuser', password: 'testpass' });
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to login');
        
        // Restore original function
        fs.readFileSync = originalReadFileSync;
    });
    // Additional test for registration validation
    it('Returns 400 when registering with missing username', async () => 
    {
        const res = await request(server)
            .post('/api/register')
            .send({ password: 'testpass' });
        
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // Additional test for registration validation
    it('Returns 400 when registering with missing password', async () => 
        {
        const res = await request(server)
            .post('/api/register')
            .send({ username: 'testuser' });
        
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});