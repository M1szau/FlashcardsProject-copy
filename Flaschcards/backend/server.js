
import express from 'express';
import cors from 'cors';
import { addUser, findUserById, addFlashcard, getFlashcards } from './database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;

//JWT key
const JWT_SECRET = 'secret-key';

app.use(cors());
app.use(express.json());


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
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const existingUser = await findUserById(username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await addUser({ username, password: hashedPassword });

    //Create JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, message: "User registered successfully", token });
});


//Login user 
app.post('/api/login', async (req, res) => {
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
    if( !front || !back || !languageFront || !languageBack) {
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

    await addFlashcard(flashcard);
    res.json({ succes: true, message: "Flashcard added successfully", flashcard  });


});

//Get all flashcards
app.get('/api/flashcards', authenticateToken, async(req, res) => 
{
    const all = await getFlashcards();
    const userCards = all.filter(card => card.owner === req.user.username);
    res.json({ success: true, flashcards: all });
});

//Flaschcard editing
app.put('/api/flashcards/:id', authenticateToken, async (req, res) =>
{
    const { id } = req.params;
    const { front, back, languageFront, languageBack } = req.body;
    const all = await getFlashcards();
    const idx = all.findIndex(card => card.id === id && card.onwer === req.user.username);

    if (idx === -1)
    {
        return res.status(404).json({ success: false, message: "Flashcard not found" });
    }

    if( !front || !back || !languageFront || !languageBack)
    {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    all[idx] = { ...all[idx], front, back, languageFront, languageBack };
    await addFlashcard(all[idx]);
    all.pop();
    await getFlashcards();
    res.json({ success: true, message: "Flashcard updated successfully", flashcard: all[idx] });
});

//Flashcard deletion
