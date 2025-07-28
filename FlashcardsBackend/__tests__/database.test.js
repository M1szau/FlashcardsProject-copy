import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { addUser, findUserById, getFlashcards, getFlashcardsByUser, addFlashcard, getFlashcardsBySet } from '../database.js';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { unlink, mkdir, rmdir } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDataDir = join(__dirname, 'data');
const testFile = join(testDataDir, 'test-db.json');


beforeAll(async () => 
{
  if (!existsSync(testDataDir)) 
  {
    await mkdir(testDataDir, { recursive: true });
  }
});

beforeEach(async () => 
{
  // Clear database
  const adapter = new JSONFile(testFile);
  const db = new Low(adapter, { users: [], flashcards: [] });
  await db.write();
});

afterEach(async () => 
{
  // Clean up test database
  try 
  {
    await unlink(testFile);
  } catch (error) {}
});

afterAll(async () => 
{
  // Clean up test data directory
  try 
  {
    await rmdir(testDataDir);
  } catch (error) {}
});

describe('Database functions', () => 
  {
  it('adds a new user', async () => 
  {
    const user = { username: 'testuser', password: 'testpass' };
    await addUser(user, testFile);
    const foundUser = await findUserById('testuser', testFile);
    // If your code hashes passwords, check username and that password is a hash
    expect(foundUser.username).toBe('testuser');
    expect(foundUser.password).toBeDefined();
  });

  it('finds user by username', async () => 
  {
    const user = { username: 'testuser', password: 'testpass' };
    await addUser(user, testFile);
    const foundUser = await findUserById('testuser', testFile);
    expect(foundUser.username).toBe('testuser');
    expect(foundUser.password).toBeDefined();
  });

  it('returns undefined for non-existent user', async () => 
  {
    const foundUser = await findUserById('nonexistent', testFile);
    expect(foundUser).toBeUndefined();
  });

  it('gets all flashcards', async () => 
  {
    const flashcard = 
    {
      id: '1',
      setId: 'set1',
      front: 'Hello',
      back: 'Hola',
      owner: 'testuser'
    };
    await addFlashcard(flashcard, testFile);
    const flashcards = await getFlashcards(testFile);
    expect(flashcards).toHaveLength(1);
    expect(flashcards[0]).toEqual(flashcard);
  });

  it('gets flashcards by user', async () => 
  {
    const flashcard1 = 
    {
      id: '1',
      setId: 'set1',
      front: 'Hello',
      back: 'Hola',
      owner: 'user1'
    };
    const flashcard2 = 
    {
      id: '2',
      setId: 'set2',
      front: 'Goodbye',
      back: 'Adiós',
      owner: 'user2'
    };
    await addFlashcard(flashcard1, testFile);
    await addFlashcard(flashcard2, testFile);
    const user1Cards = await getFlashcardsByUser('user1', testFile);
    expect(user1Cards).toHaveLength(1);
    expect(user1Cards[0].owner).toBe('user1');
  });

  it('gets flashcards by set', async () => 
  {
    const flashcard1 = 
    {
      id: '1',
      setId: 'set1',
      front: 'Hello',
      back: 'Hola',
      owner: 'testuser'
    };
    const flashcard2 = 
    {
      id: '2',
      setId: 'set1',
      front: 'Goodbye',
      back: 'Adiós',
      owner: 'testuser'
    };
    const flashcard3 = 
    {
      id: '3',
      setId: 'set2',
      front: 'Yes',
      back: 'Sí',
      owner: 'testuser'
    };
    await addFlashcard(flashcard1, testFile);
    await addFlashcard(flashcard2, testFile);
    await addFlashcard(flashcard3, testFile);
    const set1Cards = await getFlashcardsBySet('set1', testFile);
    expect(set1Cards).toHaveLength(2);
    expect(set1Cards.every(card => card.setId === 'set1')).toBe(true);
  });

  it('adds multiple users', async () => 
  {
    const user1 = { username: 'user1', password: 'pass1' };
    const user2 = { username: 'user2', password: 'pass2' };
    await addUser(user1, testFile);
    await addUser(user2, testFile);
    const foundUser1 = await findUserById('user1', testFile);
    const foundUser2 = await findUserById('user2', testFile);
    expect(foundUser1.username).toBe('user1');
    expect(foundUser2.username).toBe('user2');
  });

  it('handles empty database', async () => 
  {
    const flashcards = await getFlashcards(testFile);
    const userCards = await getFlashcardsByUser('nonexistent', testFile);
    const setCards = await getFlashcardsBySet('nonexistent', testFile);
    expect(flashcards).toHaveLength(0);
    expect(userCards).toHaveLength(0);
    expect(setCards).toHaveLength(0);
  });
});