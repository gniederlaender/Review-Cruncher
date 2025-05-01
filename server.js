// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.SERVERPORT || 5000;
console.log('Server port:', port);

// Middleware
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const MAX_TOKENS = 600;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DATA_FILE = path.join(__dirname, 'data.json');

// Function to read the data file
async function readDataFile() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, return default structure
        return { reviews: [] };
    }
}

// Function to write to the data file
async function writeDataFile(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Endpoint to handle product recommendations
app.post('/api/recommend', async (req, res) => {
    try {
        const { product, email } = req.body;

        if (!product || !email) {
            return res.status(400).json({ error: 'Product and email are required' });
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        };

        const params = {
            model: 'gpt-4.1',
            max_tokens: MAX_TOKENS,
            messages: [
                {
                    role: 'developer',
                    content: 'You are a product recommendation expert. When the user tells you a product, identify the best-in-class alternative. Provide a clear and structured comparison with the following format:\n\n**[Product Name] vs. [Best-in-Class Alternative]**\n\n**Advantages [Product Name]:**\n1. [First advantage]\n2. [Second advantage]\n3. [Third advantage]\n\n**Advantages [Best-in-Class Alternative]:**\n1. [First advantage]\n2. [Second advantage]\n3. [Third advantage]\n\n**Price Comparison:**\n\n[Product Name] is around [price] and [Best-in-Class Alternative] is around [price].\n\n**Recommendation:**\n\n Make a recommendation to buy or not. \n\n**Best product reviews on Youtube:**\n\n List the 3 most popular Youtube videos, which review the product. Use markdown formatting with **bold** text for headers and ensure proper line breaks and 1 empty line between sections. Limit the answer to 400 tokens, but make sure to give a complete answer.'
                },
                {
                    role: 'user',
                    content: `Hello. Shall I buy ${product}?`
                }
            ]
        };

        const response = await axios.post(OPENAI_API_URL, params, { headers });
        const firstChoice = response.data.choices[0];
        const responseData = {
            responseMessage: firstChoice.message.content,
            reason: firstChoice.finish_reason
        };

        // Save the request and response to data.json
        const data = await readDataFile();
        data.reviews.push({
            timestamp: new Date().toISOString(),
            product,
            email,
            response: responseData
        });
        await writeDataFile(data);

        res.json({ response: responseData });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        
        // Handle specific error cases
        if (error.response?.status === 401) {
            return res.status(401).json({ error: 'API key is invalid' });
        } else if (error.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limit exceeded' });
        }
        
        res.status(500).json({ error: 'Something went wrong with the request' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
