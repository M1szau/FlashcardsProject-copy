import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultFile = join(__dirname, 'data', 'db.json');

function getDb(file = defaultFile) {
  const adapter = new JSONFile(file);
  return new Low(adapter, { users: [], flashcards: [] });
}

export async function addUser(user, file) {
  const db = getDb(file);
  await db.read();
  db.data.users.push(user);
  await db.write();
}

export async function findUserById(username, file) {
  const db = getDb(file);
  await db.read();
  return db.data.users.find(user => user.username === username);
}

export async function getFlashcards(file) {
  const db = getDb(file);
  await db.read();
  return db.data.flashcards;
}

export async function getFlashcardsByUser(username, file) {
  const db = getDb(file);
  await db.read();
  return db.data.flashcards.filter(card => card.owner === username);
}

export async function addFlashcard(card, file) {
  const db = getDb(file);
  await db.read();
  db.data.flashcards.push(card);
  await db.write();
}

export async function getFlashcardsBySet(setId, file) {
  const db = getDb(file);
  await db.read();
  return db.data.flashcards.filter(card => card.setId === setId);
}