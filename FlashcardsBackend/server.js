import express from 'express';
import cors from 'cors';
import { addUser, findUserById, getFlashcards } from './database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { JSONFilePreset } from 'lowdb/node';

const app = express();
const PORT = 3001;

// lines to replace __dirname in ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'db.json');

// Initialize LowDB
const defaultData = { users: [], sets: [], flashcards: [] };
const db = await JSONFilePreset(dbPath, defaultData);

//functions for reading and writing to the database
function readDB() 
{
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDB(data)
{
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

//JWT key
const JWT_SECRET = 'secret-key';

app.use(cors());
app.use(express.json());

app.get( '/', (req, res) =>
{
    res.send('Server is running');
});

app.get('/api/health',authenticateToken, async (req, res) => 
{
    res.json({ success: true, message: 'API is running' });
});

app.listen(PORT, () => 
{
    console.log(`Server is running on http://localhost:${PORT}`);
});

//Token authentication
function authenticateToken(req, res, next)
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token)
    {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => 
    {
        if(err) return res.status(403).json({success: false, message: "Invalid token" });
        req.user = user;
        next();
    });
}

//Register a new user 
app.post('/api/register', async (req, res) => 
{
    const { username, password } = req.body;
    if (!username || !password) 
    {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const existingUser = await findUserById(username);
    if (existingUser) 
    {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await addUser({ username, password: hashedPassword });

    //Create JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, message: "User registered successfully", token });
});

//Login user 
app.post('/api/login', async (req, res) => 
{
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const user = await findUserById(username);
    if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ success: false, message: "Invalid password" });
    }

    //Create JWT token
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, message: "Login successful", token, user: { username: user.username } });
});

//Add a new flashcard
app.post('/api/flashcards', authenticateToken, async (req, res) => 
{
    const { front, back, languageFront, languageBack } = req.body;
    if( !front || !back || !languageFront || !languageBack) 
    {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const flashcard = 
    {
        id: Date.now().toString(), 
        front, 
        back,
        languageFront,
        languageBack,
        owner: req.user.username,
        createdAt: new Date().toISOString(),
    };

    await db.read();
    db.data.flashcards.push(flashcard);
    await db.write();
    res.json({ success: true, message: "Flashcard added successfully", flashcard  });
});

//Get all flashcards
app.get('/api/flashcards', authenticateToken, async(req, res) => 
{
    const all = await getFlashcards();
    const userCards = all.filter(card => card.owner === req.user.username);
    res.json({ success: true, flashcards: all });
});

//Flaschcard edition
app.put('/api/flashcards/:id', authenticateToken, async (req, res) =>
{
    const { id } = req.params;
    const { front, back, languageFront, languageBack } = req.body;
    const all = await getFlashcards();
    const idx = all.findIndex(card => card.id === id && card.owner === req.user.username);

    if (idx === -1)
    {
        return res.status(404).json({ success: false, message: "Flashcard not found" });
    }

    if( !front || !back || !languageFront || !languageBack)
    {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    all[idx] = { ...all[idx], front, back, languageFront, languageBack };
    await db.read();
    db.data.flashcards.push(all[idx]);
    await db.write();
    res.json({ success: true, message: "Flashcard updated successfully", flashcard: all[idx] });
});

//Flashcard deletion
app.delete('/api/flashcards/:id', authenticateToken, async (req, res) =>
{
    const { id } = req.params;
    const all = await getFlashcards();
    const idx = all.findIndex(card => card.id === id && card.owner === req.user.username);

    if(idx === -1)
    {
        return res.status(404).json({ success: false, message: "Flashcard not found" });
    }

    const deleted = all.splice(idx, 1)[0];
    await db.read();
    await db.write();

    res.json({ success: true, message: "Flashcard deleted successfully", flashcard: deleted });
});

//SETS

//Adding a new set
app.post('/api/sets', authenticateToken, (req, res) => 
{
    try 
    {
        const { name, description, defaultLanguage, translationLanguage } = req.body;
        if (!name || !description || !defaultLanguage || !translationLanguage) 
        {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const dbData = readDB();
        const set = 
        {
            id: Date.now().toString(),
            name,
            description: description || '',
            defaultLanguage: defaultLanguage || 'PL',
            translationLanguage: translationLanguage || 'GB',
            owner: req.user.username,
            createdAt: new Date().toISOString(),
        };
        dbData.sets.push(set);
        writeDB(dbData);
        res.json({ set });
    } catch (error) {
        console.error('Error creating set:', error);
        res.status(500).json({ error: 'Failed to create set' });
    }
});

// Get all sets for the logged-in user
app.get('/api/sets', authenticateToken, (req, res) => 
{
    const dbData = readDB();
    const userSets = dbData.sets.filter(set => set.owner === req.user.username);
    res.json({ sets: userSets });
});

// Edit a set
app.put('/api/sets/:id', authenticateToken, (req, res) => 
{
    const { id } = req.params;
    const { name, description, defaultLanguage, translationLanguage } = req.body;
    const dbData = readDB();
    const idx = dbData.sets.findIndex(set => set.id === id && set.owner === req.user.username);
    if (idx === -1) {
        return res.status(404).json({ message: "Set not found" });
    }
    
    // Update the set
    if (name !== undefined) dbData.sets[idx].name = name;
    if (description !== undefined) dbData.sets[idx].description = description;
    if (defaultLanguage !== undefined) dbData.sets[idx].defaultLanguage = defaultLanguage;
    if (translationLanguage !== undefined) dbData.sets[idx].translationLanguage = translationLanguage;
    
    writeDB(dbData);
    res.json({ set: dbData.sets[idx] });
});

// Delete a set
app.delete('/api/sets/:id', authenticateToken, (req, res) => 
{
    const { id } = req.params;
    const dbData = readDB();
    const idx = dbData.sets.findIndex(set => set.id === id && set.owner === req.user.username);
    if (idx === -1) 
    {
        return res.status(404).json({ message: "Set not found" });
    }
    const deleted = dbData.sets.splice(idx, 1)[0];

    // Remove all flashcards belonging to this set
    dbData.flashcards = dbData.flashcards.filter(card => card.setId !== id);

    writeDB(dbData);
    res.json({ success: true, set: deleted });
});

// Helper functions for flashcards with sets
async function addFlashcardToSet(flashcard) 
{
    await db.read();
    db.data.flashcards.push(flashcard);
    await db.write();
}

async function getFlashcardsBySet(setId) 
{
    await db.read();
    return db.data.flashcards.filter(card => card.setId === setId);
}

//Helpers for tests
app.locals.addFlashcardToSet = addFlashcardToSet;
app.locals.db = db;

// Get flashcards for a set
app.get("/api/sets/:setId/flashcards", async (req, res) => 
{
    try 
    {
        const setId = req.params.setId;
        const cards = await getFlashcardsBySet(setId); 
        res.json(cards);
    } catch (error) {
        console.error('Error fetching flashcards:', error);
        res.status(500).json({ error: 'Failed to fetch flashcards' });
    }
});

// Post new flashcard to a set
app.post("/api/sets/:setId/flashcards", authenticateToken, async (req, res) => 
{
    try 
    {
        const setId = req.params.setId;
        const dbData = readDB();
        // Check if set exists and belongs to the user
        const set = dbData.sets.find(s => s.id === setId && s.owner === req.user.username);
        if (!set) {
            return res.status(404).json({ success: false, message: 'Set not found' });
        }

        const card = req.body;
        // Validate required fields
        if (!card.front || !card.back || !card.languageFront || !card.languageBack) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        card.id = Date.now().toString(); // Generate unique ID
        card.setId = setId;
        card.owner = req.user.username;
        card.createdAt = new Date().toISOString();

        await req.app.locals.addFlashcardToSet(card); // Use app.locals for testability
        res.json(card);
    } catch (error) {
        console.error('Error adding flashcard:', error);
        res.status(500).json({ error: 'Failed to add flashcard' });
    }
});

// Update flashcard in a set
app.put('/api/sets/:setId/flashcards/:cardId', authenticateToken, async (req, res) => 
{
    try 
    {
        const { setId, cardId } = req.params;
        const updatedCard = req.body;
        
        await req.app.locals.db.read();
        const cardIndex = req.app.locals.db.data.flashcards.findIndex(card => card.id === cardId && card.setId === setId);
        
        if (cardIndex === -1) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }
        
        req.app.locals.db.data.flashcards[cardIndex] = { ...req.app.locals.db.data.flashcards[cardIndex], ...updatedCard };
        await req.app.locals.db.write();
        
        res.json(req.app.locals.db.data.flashcards[cardIndex]);
    } catch (error) {
        console.error('Error updating flashcard:', error);
        res.status(500).json({ error: 'Failed to update flashcard' });
    }
});

// Delete flashcard from a set
app.delete('/api/sets/:setId/flashcards/:cardId', authenticateToken, async (req, res) => 
{
    try 
    {
        const { setId, cardId } = req.params;
        
        await req.app.locals.db.read();
        const cardIndex = req.app.locals.db.data.flashcards.findIndex(card => card.id === cardId && card.setId === setId);
        
        if (cardIndex === -1) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }
        
        req.app.locals.db.data.flashcards.splice(cardIndex, 1);
        await req.app.locals.db.write();
        
        res.json({ success: true, message: 'Flashcard deleted successfully' });
    } catch (error) {
        console.error('Error deleting flashcard:', error);
        res.status(500).json({ error: 'Failed to delete flashcard' });
    }
});

export default app;