import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';


const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, 'data', 'db.json');

const adapter = new JSONFile(file);
const db = new Low(adapter, { users: [], flashcards: [] });

//Adding new user
export async function addUser(user)
{
    await db.read();
    db.data.users.push(user);
    await db.write();
}

export async function findUserById(username)
{
    await db.read();
    return db.data.users.find(user => user.username === username);
}

export async function addFlashcard(flashcard)
{
    await db.read();
    db.data.flashcards.push(flashcard);
    await db.write();
}

export async function getFlashcards()
{
    await db.read();
    return db.data.flashcards;
}

export async function getFlashcardsByUser(username)
{
    await db.read();
    return db.data.flashcards.filter(card => card.owner === username);
}


export default db;