const { GoogleGenAI } = require('@google/genai');
const express = require('express');
const session = require('express-session');
const app = express();
require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const methodoverride = require('method-override');
app.use(methodoverride('_method'));

let chatHistory = [];

app.set('view engine', 'ejs');


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'secret-key', // replace with strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 } // session expires in 10 min (adjust as needed)
}));

app.get('/chatbot', (req, res) => {
      req.session.chatHistory = [];
    res.render('index', { chatHistory: req.session.chatHistory, error: null });
});

app.get('/', async (req, res) =>{
 res.render('home')
})

app.post('/chatbot', async (req, res) => {
    try {
        
        const userMessage = req.body.message;
        
        const result = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-001',
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        });
       
        let botReply = 'No response from Gemini API.';
        if (result && result.response && result.response.candidates && result.response.candidates[0] && result.response.candidates[0].content && result.response.candidates[0].content.parts && result.response.candidates[0].content.parts[0] && result.response.candidates[0].content.parts[0].text) {
            botReply = result.response.candidates[0].content.parts[0].text;
        } else if (result && result.text) {
            botReply = result.text;
        }
        if (!req.session.chatHistory) {
            req.session.chatHistory = [];
            }
            req.session.chatHistory.push({ user: userMessage, bot: botReply });
            res.render('index', { chatHistory: req.session.chatHistory, error: null });
    } catch (error) {
        console.error('Gemini API error:', error);
        let errorMsg = 'Error generating response.';
        if (error && error.message) {
            errorMsg += ' ' + error.message;
        }
        res.render('index', { chatHistory: req.session.chatHistory || [], error: errorMsg });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

