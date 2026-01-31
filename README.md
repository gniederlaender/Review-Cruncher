# Review Cruncher

Review Cruncher delivers synthesized opinions about products by combining insights from multiple platforms and opinion bubbles.<br/>
Before deciding to buy - <b>Ask Review Cruncher</b>.

Enter any product (like "Tesla Model Y" or "iPhone 17 Pro"), and ReviewCruncher analyzes opinions from:
- 🗨️ **Reddit** - Community discussions and authentic user experiences
- 🎥 **YouTube** - Video reviews and creator opinions
- ⭐ **Best Buy** - Customer reviews and ratings
- 𝕏 **X (Twitter)** - Real-time social media sentiment (optional)
- 📰 **Google Search** - Expert reviews and articles

A multi-source opinion synthesis platform powered by [OpenAI API](https://openai.com/api/)

<img width="557" alt="image" src="https://github.com/user-attachments/assets/c23a7bc3-c087-4d91-b06a-416bee9c6a5c" />


## Features

- **Multi-Source Analysis** - Aggregates opinions from Reddit, YouTube, Best Buy, X/Twitter, and Google
- **AI Synthesis** - Uses OpenAI to provide coherent, balanced recommendations
- **Source Transparency** - Shows which platforms contributed data
- **User Expectations** - Tailors recommendations based on your specific needs
- **Email Reports** - Send analysis results via email

## Setup

1. Clone the project and install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env and add your API keys
```

**Minimum Setup (Required):**
- `OPENAI_API_KEY` - [Get from OpenAI](https://platform.openai.com/api-keys)
- `GOOGLE_API_KEY` - [Get from Google Cloud](https://console.cloud.google.com/apis/credentials)
- `GOOGLE_CSE_ID` - [Create Custom Search Engine](https://programmablesearchengine.google.com/)

**Recommended (Free Tiers):**
- `REDDIT_CLIENT_ID` & `REDDIT_CLIENT_SECRET` - [Create Reddit App](https://www.reddit.com/prefs/apps)
- `YOUTUBE_API_KEY` - Enable YouTube Data API v3 in Google Cloud
- `BESTBUY_API_KEY` - [Get from Best Buy Developer](https://developer.bestbuy.com/)

**Optional (Paid):**
- `TWITTER_BEARER_TOKEN` - [X API](https://developer.twitter.com/) (Basic: $100/month)

3. Run the project:

```bash
# Start backend server
node server.js

# In another terminal, start frontend
npm start
```

The app will be available at `http://localhost:3030`

## Platform Research

See [PLATFORMS_RESEARCH.md](PLATFORMS_RESEARCH.md) for comprehensive analysis of available review platforms, API availability, pricing, and integration recommendations.

