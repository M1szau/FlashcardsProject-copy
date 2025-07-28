import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.join(__dirname, '../data/test-db.json');
const mainDbPath = path.join(__dirname, '../data/db.json');

// Create backup of main database
let mainDbBackup = null;

function resetTestDb() 
{
  fs.writeFileSync(testDbPath, JSON.stringify({ users: [], sets: [], flashcards: [] }, null, 2));
}

function backupMainDb() 
{
    if (fs.existsSync(mainDbPath)) 
    {
        mainDbBackup = fs.readFileSync(mainDbPath, 'utf-8');
    }
}

function restoreMainDb() 
{
    if (mainDbBackup) 
    {
        fs.writeFileSync(mainDbPath, mainDbBackup);
    }
}

function switchToTestDb() 
{
  // Copy test db content to main db
  const testDbContent = fs.readFileSync(testDbPath, 'utf-8');
  fs.writeFileSync(mainDbPath, testDbContent);
}

let server;
let app;
let token;
let setId;
let flashcardId;

beforeAll(async () => 
{
  // Backup the main database
  backupMainDb();
  
  // Import the server after setting up test environment
  const serverModule = await import('../server.js');
  app = serverModule.default;
  server = app.listen(0);
});

beforeEach(() => 
{
  resetTestDb();
  switchToTestDb();
});

//Restore main db and clean
afterAll(async () => 
{
  await server.close();
  
  restoreMainDb();
  
  try 
  {
    fs.unlinkSync(testDbPath);
  } catch (error) {
  }
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
        // First register a user
        await request(server)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });
        
        // Try to register the same user again
        const res = await request(server)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('Logs in with valid credentials', async () => 
    {
        // First register a user
        await request(server)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });
        
        // Then login
        const res = await request(server)
            .post('/api/login')
            .send({ username: 'testuser', password: 'testpass' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        token = res.body.token;
    });

    it('Creates a new set', async () => 
    {
        // First register and login
        await request(server)
        .post('/api/register')
        .send({ username: 'testuser', password: 'testpass' });
    
        const loginRes = await request(server)
            .post('/api/login')
            .send({ username: 'testuser', password: 'testpass' });
        token = loginRes.body.token;
    
        // Create a set
        const res = await request(server)
            .post('/api/sets')
            .set('Authorization', `Bearer ${token}`)
            .send(
            {
                name: 'Test Set',
                description: 'Test Description',
                defaultLanguage: 'EN',
                translationLanguage: 'ES'
            });
        
        expect(res.status).toBe(200);
        expect(res.body.set).toBeDefined();
        expect(res.body.set.name).toBe('Test Set');
        setId = res.body.set.id;
    });

    it('Gets statistics for user', async () => 
    {
        // First register and login
        await request(server)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });
        
        const loginRes = await request(server)
            .post('/api/login')
            .send({ username: 'testuser', password: 'testpass' });
        token = loginRes.body.token;
        
        // Get statistics
        const res = await request(server)
            .get('/api/statistics')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.totalSets).toBeDefined();
        expect(res.body.totalFlashcards).toBeDefined();
        expect(res.body.totalKnownCards).toBeDefined();
        expect(res.body.totalUnknownCards).toBeDefined();
    });
});
