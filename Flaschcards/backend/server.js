import express from 'express';
import cors from 'cors';
import { addUser, findUserById, addFlashcard, getFlashcards } from './database.js';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


app.get('/api/health', (req, res) => 
    {
        res.json({ success: true, message: 'API is running' });
    }
);

app.listen(PORT, () => 
    {
        console.log(`Server is running on http://localhost:${PORT}`);
    });


//Register a new user
app.post('/api/register', async (req, res) =>
{
    const {username, password} = req.body;
    if( !username || !password)
    {
        return res.status(400).json({success: false, message: "Username and password are required"});
    }

    const existingUser = await findUserById(username);
    if(existingUser)
    {
        return res.status(400).json({success: false, message: "User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await addUser({username, password: hashedPassword});
    res.json({ success: true, message: "User registered successfully" });
});

//Login user
app.post('/api/login', async (req, res) =>
{
    const { username, password } = req.body;
    if (!username || !password)
    {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const user = await findUserById(username);
    if(!user)
    {
        return res.status(400).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch)
    {
        return res.status(400).json({ success: false, message: "Invalid password" });
    }

    res.json({ success: true, message: "Login successful", user: { username: user.username } });

});