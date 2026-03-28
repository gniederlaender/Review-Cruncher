// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');

// Import source modules
const RedditSource = require('./modules/sources/reddit');
const YouTubeSource = require('./modules/sources/youtube');
const BestBuySource = require('./modules/sources/bestbuy');
const TwitterSource = require('./modules/sources/twitter');
const OpinionSynthesizer = require('./modules/synthesizer');
const URLExtractor = require('./modules/url-extractor');

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
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// Initialize source modules
const redditSource = new RedditSource(
    process.env.REDDIT_CLIENT_ID,
    process.env.REDDIT_CLIENT_SECRET,
    process.env.REDDIT_USER_AGENT || 'ReviewCruncher/1.0'
);
const youtubeSource = new YouTubeSource(process.env.YOUTUBE_API_KEY || GOOGLE_API_KEY);
const bestbuySource = new BestBuySource(process.env.BESTBUY_API_KEY);
const twitterSource = new TwitterSource(
    process.env.TWITTER_AUTH_TOKEN,
    process.env.TWITTER_CT0
);
const synthesizer = new OpinionSynthesizer(OPENAI_API_KEY);
const urlExtractor = new URLExtractor();

// Create a transporter object using easyname.com SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT), // Ensure port is a number
    secure: process.env.EMAIL_SECURE === 'true', // Ensure secure is a boolean
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
    }
});

// Function to generate email HTML content
function generateEmailContent(product, recommendation, searchResults) {
    console.log('Generating email content with:', {
        product,
        recommendationLength: recommendation.length,
        searchResultsCount: searchResults ? searchResults.length : 0,
        searchResults: searchResults
    });

    // Extract structured data from markdown
    const extractProductName = (text) => {
        const match = text.match(/\*\*Product Name\*\*\s*\n*\s*([^\n]+)/i);
        return match ? match[1].trim() : product;
    };

    const extractPriceRange = (text) => {
        const match = text.match(/\*\*Price Range:\*\*\s*([^\n]+)/i);
        return match ? match[1].trim() : '';
    };

    const extractAlternatives = (text) => {
        const alternatives = [];
        const match = text.match(/\*\*Product Alternatives:\*\*\s*\n*([\s\S]*?)(?=\*\*Recommendation:|$)/i);
        if (match) {
            const altText = match[1];
            const lines = altText.split('\n').filter(line => line.trim().match(/^\d+\.\s+\*\*/));
            lines.forEach(line => {
                const cleaned = line.replace(/^\d+\.\s+/, '').trim();
                if (cleaned) alternatives.push(cleaned);
            });
        }
        return alternatives;
    };

    const extractOverallSentiment = (text) => {
        const match = text.match(/\*\*Overall Sentiment:\*\*\s*([^\n]+)/i);
        return match ? match[1].trim() : null;
    };

    const extractRecommendation = (text) => {
        const match = text.match(/\*\*Recommendation:\*\*\s*([\s\S]*?)(?=\*\*Confidence Level:|$)/i);
        return match ? match[1].trim() : '';
    };

    const extractConfidenceLevel = (text) => {
        const match = text.match(/\*\*Confidence Level:\*\*\s*([^\n]+)/i);
        return match ? match[1].trim() : '';
    };

    const extractConsensus = (text) => {
        const points = [];
        const match = text.match(/\*\*Cross-Platform Consensus:\*\*\s*\n*([\s\S]*?)(?=\*\*Notable Divergence:|$)/i);
        if (match) {
            const lines = match[1].split('\n').filter(line => line.trim().startsWith('-'));
            lines.forEach(line => {
                points.push(line.replace(/^-\s*/, '').trim());
            });
        }
        return points;
    };

    const extractDivergence = (text) => {
        const points = [];
        const match = text.match(/\*\*Notable Divergence:\*\*\s*\n*([\s\S]*?)(?=\*\*Key Takeaways|$)/i);
        if (match) {
            const lines = match[1].split('\n').filter(line => line.trim().startsWith('-'));
            lines.forEach(line => {
                points.push(line.replace(/^-\s*/, '').trim());
            });
        }
        return points;
    };

    // Convert markdown to HTML for recommendation text
    const markdownToHtml = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb;">$1</a>');
    };

    // Extract all parts
    const productName = extractProductName(recommendation);
    const priceRange = extractPriceRange(recommendation);
    const alternatives = extractAlternatives(recommendation);
    const overallSentiment = extractOverallSentiment(recommendation);
    const recommendationText = extractRecommendation(recommendation);
    const confidenceLevel = extractConfidenceLevel(recommendation);
    const consensus = extractConsensus(recommendation);
    const divergence = extractDivergence(recommendation);

    // Build alternatives HTML
    let alternativesHtml = '';
    if (alternatives.length > 0) {
        alternativesHtml = `
            <div style="margin-top: 15px;">
                <strong style="color: #64748b;">Alternatives:</strong>
                <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1e293b;">
                    ${alternatives.map(alt => `<li style="margin-bottom: 8px;">${markdownToHtml(alt)}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    // Build consensus HTML
    let consensusHtml = '';
    if (consensus.length > 0) {
        consensusHtml = `
            <div style="margin-top: 20px;">
                <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">Cross-Platform Consensus</h4>
                <ul style="margin: 0; padding-left: 20px; color: #1e293b;">
                    ${consensus.map(point => `<li style="margin-bottom: 8px;">${markdownToHtml(point)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Build divergence HTML
    let divergenceHtml = '';
    if (divergence.length > 0) {
        divergenceHtml = `
            <div style="margin-top: 20px;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Notable Divergence</h4>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                    ${divergence.map(point => `<li style="margin-bottom: 8px;">${markdownToHtml(point)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Build confidence badge HTML
    let confidenceHtml = '';
    if (confidenceLevel) {
        const confidenceColors = {
            high: { bg: '#dcfce7', text: '#166534' },
            medium: { bg: '#fef3c7', text: '#92400e' },
            low: { bg: '#fee2e2', text: '#991b1b' }
        };
        const colors = confidenceColors[confidenceLevel.toLowerCase()] || confidenceColors.medium;
        confidenceHtml = `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <span style="font-weight: 600; color: #64748b;">Confidence Level:</span>
                <span style="margin-left: 10px; padding: 5px 15px; border-radius: 20px; font-weight: 600; font-size: 14px; text-transform: uppercase; background-color: ${colors.bg}; color: ${colors.text};">
                    ${confidenceLevel}
                </span>
            </div>
        `;
    }

    // Section styling
    const sectionStyle = 'margin: 20px 0; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;';
    const sectionTitleStyle = 'margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #1e293b;';

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center; margin-bottom: 10px;">Review Cruncher Report</h1>
            <p style="color: #64748b; text-align: center; margin-bottom: 30px;">AI-powered product analysis from multiple sources</p>

            <!-- Section 1: Product Snapshot -->
            <div style="${sectionStyle}">
                <h3 style="${sectionTitleStyle}">📦 Product Snapshot</h3>
                <div style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">${productName}</div>
                ${priceRange ? `<div style="color: #64748b; margin-bottom: 15px;"><strong>Price Range:</strong> ${priceRange}</div>` : ''}
                ${alternativesHtml}
            </div>

            <!-- Section 2: Product Sentiment -->
            ${overallSentiment ? `
            <div style="${sectionStyle}">
                <h3 style="${sectionTitleStyle}">📊 Product Sentiment</h3>
                <div style="font-size: 16px; color: #1e293b; margin-bottom: 15px;">
                    <strong>Overall Sentiment:</strong> ${overallSentiment}
                </div>
                ${consensusHtml}
                ${divergenceHtml}
            </div>
            ` : ''}

            <!-- Section 3: Final Synthesis -->
            ${recommendationText ? `
            <div style="${sectionStyle}">
                <h3 style="${sectionTitleStyle}">🎯 Final Synthesis</h3>
                <div style="line-height: 1.8; color: #1e293b;">
                    ${markdownToHtml(recommendationText)}
                </div>
                ${confidenceHtml}
            </div>
            ` : ''}

            <!-- Section 4: Data Sources -->
            <div style="${sectionStyle}">
                <h3 style="${sectionTitleStyle}">📚 Data Sources</h3>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <span style="padding: 8px 16px; background: #f1f5f9; border-radius: 8px; color: #475569; font-size: 14px;">🎥 YouTube Reviews</span>
                    <span style="padding: 8px 16px; background: #f1f5f9; border-radius: 8px; color: #475569; font-size: 14px;">𝕏 X (Twitter)</span>
                    <span style="padding: 8px 16px; background: #f1f5f9; border-radius: 8px; color: #475569; font-size: 14px;">📰 Expert Reviews</span>
                </div>
            </div>

            <p style="color: #64748b; font-size: 14px; margin-top: 30px; text-align: center;">
                This email was generated by Review Cruncher. For more information, visit our website.
            </p>
        </div>
    `;

    console.log('Generated email content length:', emailContent.length);
    return emailContent;
}

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
        const { product, email, expectations } = req.body;

        if (!product || !email) {
            return res.status(400).json({ error: 'Product and email are required' });
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + OPENAI_API_KEY
        };

        const params = {
            model: 'gpt-4.1',
            max_tokens: MAX_TOKENS,
            messages: [
                {
                    role: 'developer',
                    content:
                        'You are a recommendation expert specializing in products, services, and experiences. First, analyze the user\'s input to determine the type of request.\n\n' +
                        '1. If it\'s a specific product (e.g., "iPhone 14 Pro" or "Specialized Turbo Levo"):\n' +
                        '   - Identify the best-in-class alternative\n' +
                        '   - Provide a structured comparison as follows:\n\n' +
                        '**[Product Name] vs. [Best-in-Class Alternative]**\n\n' +
                        '**Key Features Comparison:**\n' +
                        '- [Product Name]:\n  * [Key Feature 1]\n  * [Key Feature 2]\n  * [Key Feature 3]\n' +
                        '- [Best-in-Class Alternative]:\n  * [Key Feature 1]\n  * [Key Feature 2]\n  * [Key Feature 3]\n\n' +
                        '**Advantages [Product Name]:**\n1. [First advantage]\n2. [Second advantage]\n3. [Third advantage]\n\n' +
                        '**Advantages [Best-in-Class Alternative]:**\n1. [First advantage]\n2. [Second advantage]\n3. [Third advantage]\n\n' +
                        '**Price Comparison:**\n[Product Name] is around [price] and [Best-in-Class Alternative] is around [price].\n\n' +
                        '**Value for Money Rating (1-5):**\n- [Product Name]: [Rating] - [Brief explanation]\n- [Best-in-Class Alternative]: [Rating] - [Brief explanation]\n\n' +
                        '**Recommendation:**\nMake a clear recommendation to buy or not. Decide for one of the products and give a clear recommendation.\n\n' +
                        '2. If it\'s a product category (e.g., "mountain bikes" or "batteries"):\n' +
                        '   - First identify the best-in-class product in that category\n' +
                        '   - Then identify the best value alternative\n' +
                        '   - Provide a structured comparison using the exact same format as above, but with:\n\n' +
                        '**[Best-in-Class Product] vs. [Best Value Alternative]**\n\n' +
                        '[Then follow the exact same structure as case 1, including Key Features Comparison, Advantages, Price Comparison, Value for Money Rating, and Recommendation]\n\n' +
                        '3. If the requested topic is about "travel destinations":\n' +
                        '   - Provide a structured recommendation as follows:\n\n' +
                        '**[Destination] Recommendations**\n\n' +
                        'Short summary about, what is the main reason, anybody would travel to that destination.\n\n' +
                        '**Top Touristic Picks - what to visit:**\n1. [First Recommendation]\n' +
                        '   - [Brief explanation]\n' +
                        '   - Key Highlights:\n' +
                        '     * [Highlight 1]\n' +
                        '     * [Highlight 2]\n' +
                        '     * [Highlight 3]\n\n' +
                        '2. [Second Recommendation]\n' +
                        '   - [Brief explanation]\n' +
                        '   - Key Highlights:\n' +
                        '     * [Highlight 1]\n' +
                        '     * [Highlight 2]\n' +
                        '     * [Highlight 3]\n\n' +
                        '3. [Third Recommendation]\n' +
                        '   - [Brief explanation]\n' +
                        '   - Key Highlights:\n' +
                        '     * [Highlight 1]\n' +
                        '     * [Highlight 2]\n' +
                        '     * [Highlight 3]\n\n' +
                        '**Considerations:**\n- [Important factor 1]\n- [Important factor 2]\n- [Important factor 3]\n\n' +
                        '**Hidden gem:**\n[A hint about an experience or location at the [Destination], which only a few people know.]\n\n' +
                        '4. For other non-product topics (e.g., "video games"):\n' +
                        '   - Provide a structured recommendation as follows:\n\n' +
                        '**[Topic] Recommendations**\n\n' +
                        '**Top Picks:**\n1. [First Recommendation]\n' +
                        '   - Why it\'s great: [Brief explanation]\n' +
                        '   - Best for: [type of user/experience]\n' +
                        '   - Key Highlights:\n' +
                        '     * [Highlight 1]\n' +
                        '     * [Highlight 2]\n' +
                        '     * [Highlight 3]\n\n' +
                        '2. [Second Recommendation]\n' +
                        '   - Why it\'s great: [Brief explanation]\n' +
                        '   - Best for: [type of user/experience]\n' +
                        '   - Key Highlights:\n' +
                        '     * [Highlight 1]\n' +
                        '     * [Highlight 2]\n' +
                        '     * [Highlight 3]\n\n' +
                        '**Considerations:**\n- [Important factor 1]\n- [Important factor 2]\n- [Important factor 3]\n\n' +
                        '**Recommendation:**\n[Clear recommendation based on the user\'s needs]\n\n' +
                        'Additional Guidelines:\n- If the input is not in English, answer in the language of the input text\n- Use markdown formatting with **bold** text for headers\n- Ensure proper line breaks and 1 empty line between sections\n- Limit the answer to 500 tokens while maintaining completeness\n- For product categories, focus on current market leaders and best value options\n- For travel destinations, follow the structure provided\n- For other non-product topics, focus on providing actionable, specific recommendations\n- If the user has provided specific expectations or requirements, make sure to address them in your recommendation and comparison\n\n' +
                        (expectations ? 'My expectations: ' + expectations + '\n\n' : '') +
                        'Hello. Shall I buy ' + product
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
            expectations: expectations || '',
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

// Google Search endpoint
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const url = 'https://www.googleapis.com/customsearch/v1?q=' + encodeURIComponent(query) + '&key=' + GOOGLE_API_KEY + '&cx=' + GOOGLE_CSE_ID;
        const response = await axios.get(url);

        // You can customize what you return to the frontend
        // Here, we return the top 5 results with title, link, and snippet
        const results = (response.data.items || []).slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));

        res.json({ results });
    } catch (error) {
        console.error('Google Search Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Google Search failed' });
    }
});

// URL extraction endpoint
app.post('/api/extract-product-from-url', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Check if input is actually a URL
        if (!urlExtractor.isURL(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Extract product name from URL
        const result = await urlExtractor.extractProductName(url);

        if (result.success) {
            res.json({
                success: true,
                productName: result.productName
            });
        } else {
            res.json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('URL Extraction Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to extract product name from URL. Please enter the product name manually.'
        });
    }
});

// Combined endpoint for multi-source opinion synthesis
app.post('/api/combined', async (req, res) => {
    try {
        let { product, email, expectations } = req.body;

        if (!product || !email) {
            return res.status(400).json({ error: 'Product and email are required' });
        }

        // Server-side fallback: If product is a URL, extract the product name
        const isUrl = product.startsWith('http://') || product.startsWith('https://');
        if (isUrl) {
            console.log(`Received URL, extracting product name: ${product}`);
            try {
                const extractionResult = await urlExtractor.extractProductName(product);
                if (extractionResult.success && extractionResult.productName) {
                    console.log(`Extracted product name: ${extractionResult.productName}`);
                    product = extractionResult.productName;
                } else {
                    console.warn(`Could not extract product name from URL: ${product}`);
                    // Continue with URL as fallback (not ideal, but better than failing)
                }
            } catch (extractError) {
                console.error(`URL extraction error: ${extractError.message}`);
                // Continue with URL as fallback
            }
        }

        console.log(`Processing multi-source analysis for: ${product}`);

        // Fetch data from all sources in parallel
        const sourceResults = await Promise.allSettled([
            redditSource.search(product).catch(err => {
                console.error('Reddit error:', err.message);
                return { source: 'reddit', available: false, error: err.message };
            }),
            youtubeSource.search(product).catch(err => {
                console.error('YouTube error:', err.message);
                return { source: 'youtube', available: false, error: err.message };
            }),
            bestbuySource.search(product).catch(err => {
                console.error('Best Buy error:', err.message);
                return { source: 'bestbuy', available: false, error: err.message };
            }),
            twitterSource.search(product).catch(err => {
                console.error('Twitter error:', err.message);
                return { source: 'twitter', available: false, error: err.message };
            }),
            // Google Custom Search as fallback for news/articles
            axios.get('https://www.googleapis.com/customsearch/v1', {
                params: {
                    q: `${product} review`,
                    key: GOOGLE_API_KEY,
                    cx: GOOGLE_CSE_ID,
                    num: 5
                }
            }).then(response => ({
                source: 'google',
                available: true,
                articles: (response.data.items || []).map(item => ({
                    title: item.title,
                    link: item.link,
                    snippet: item.snippet
                }))
            })).catch(err => {
                console.error('Google Search error:', err.message);
                return { source: 'google', available: false, error: err.message };
            })
        ]);

        // Extract results from settled promises
        const sources = {
            reddit: sourceResults[0].status === 'fulfilled' ? sourceResults[0].value : { source: 'reddit', available: false },
            youtube: sourceResults[1].status === 'fulfilled' ? sourceResults[1].value : { source: 'youtube', available: false },
            bestbuy: sourceResults[2].status === 'fulfilled' ? sourceResults[2].value : { source: 'bestbuy', available: false },
            twitter: sourceResults[3].status === 'fulfilled' ? sourceResults[3].value : { source: 'twitter', available: false },
            google: sourceResults[4].status === 'fulfilled' ? sourceResults[4].value : { source: 'google', available: false }
        };

        console.log('Sources fetched:', {
            reddit: sources.reddit.available,
            youtube: sources.youtube.available,
            bestbuy: sources.bestbuy.available,
            twitter: sources.twitter.available,
            google: sources.google.available
        });

        // Synthesize all data with OpenAI
        let synthesis;
        try {
            synthesis = await synthesizer.synthesize(product, sources, expectations);
        } catch (error) {
            console.error('Synthesis error:', error.message);
            // Fallback to basic response if synthesis fails
            synthesis = {
                synthesis: 'Unable to synthesize data due to an error. Please try again.',
                finishReason: 'error',
                sourcesUsed: [],
                scorecard: [],
                keyTakeaways: {},
                consensus: [],
                divergence: []
            };
        }

        // Format response with structured data
        const recommendationData = {
            responseMessage: synthesis.synthesis,
            reason: synthesis.finishReason,
            sourcesUsed: synthesis.sourcesUsed,
            scorecard: synthesis.scorecard || [],
            keyTakeaways: synthesis.keyTakeaways || {},
            consensus: synthesis.consensus || [],
            divergence: synthesis.divergence || []
        };

        // Save all results to data.json
        const data = await readDataFile();
        data.reviews.push({
            timestamp: new Date().toISOString(),
            product,
            email,
            expectations: expectations || '',
            recommendation: recommendationData,
            sources: {
                reddit: sources.reddit,
                youtube: sources.youtube,
                bestbuy: sources.bestbuy,
                twitter: sources.twitter,
                google: sources.google
            }
        });
        await writeDataFile(data);

        res.json({
            recommendation: recommendationData,
            sources: sources,
            search: sources.google?.articles || [] // For backward compatibility
        });
    } catch (error) {
        console.error('Combined endpoint error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Something went wrong with the multi-source analysis' });
    }
});

// Endpoint to send email
app.post('/api/send-email', async (req, res) => {
    try {
        console.log('Raw request body:', req.body);
        
        const { product, email, recommendation, search_results } = req.body;

        console.log('Parsed request data:', {
            product,
            email,
            recommendationLength: recommendation ? recommendation.length : 0,
            searchResultsCount: search_results ? search_results.length : 0,
            searchResults: search_results
        });

        if (!product || !email || !recommendation) {
            console.error('Missing required fields:', { product, email, recommendation: !!recommendation });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Review Cruncher Report: ' + product,
            html: generateEmailContent(product, recommendation, search_results || [])
        };

        console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            searchResultsCount: search_results ? search_results.length : 0
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Endpoint to get recent reviews
app.get('/api/recent-reviews', async (req, res) => {
    try {
        const data = await readDataFile();
        // Sort by timestamp descending and get last 4
        const sorted = (data.reviews || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const last4 = sorted.slice(0, 6);
        res.json({ reviews: last4 });
    } catch (error) {
        console.error('Error fetching recent reviews:', error);
        res.status(500).json({ error: 'Failed to fetch recent reviews' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
