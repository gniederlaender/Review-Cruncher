# How to See Twitter/X Reviews in the Frontend

## Quick Verification

The Twitter/X integration is **fully working**. Here's how to verify you're seeing the data:

### 1. Open the Application
Navigate to: **http://localhost:3030**

### 2. Submit a Search
- Enter a popular product (e.g., "iPhone 15", "Sony WH-1000XM5", "AirPods Pro")
- Enter any email address
- Click "Recommend Product"
- Wait 10-30 seconds for analysis

### 3. What to Look For

#### A. Sentiment Scorecard (Top Section)
Look for the **"📊 Source Sentiment Overview"** section at the top of results.

You should see 5 source cards:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Source Sentiment Overview                                │
├─────────────┬─────────────┬─────────────┬─────────────┬─────┤
│ ⭐ Best Buy │ 🗨️ Reddit   │ 𝕏 X/Twitter │ 🎥 YouTube  │ 📰  │
│ no data     │ no data     │ ████░░░░░░  │ ██████░░░░  │ ✓   │
│ available   │ available   │ +1.0        │ +2.0        │ Avl │
│             │             │ (10 tweets) │ (25 videos) │ (5) │
└─────────────┴─────────────┴─────────────┴─────────────┴─────┘
```

**X/Twitter Card Shows:**
- 𝕏 icon with "X/Twitter" label
- A horizontal bar (yellow for neutral/mixed, green for positive)
- Score value (e.g., "+1.0", "+0", "+3.5")
- Sample size (e.g., "10 tweets", "15 tweets")

#### B. Key Takeaways Section
Scroll down to **"🔍 Key Takeaways by Source"**

You should see expandable cards. Look for:
```
┌────────────────────────────────────────────────┐
│ 𝕏 X/Twitter                              ▼    │
├────────────────────────────────────────────────┤
│ • [Key point about product from Twitter]      │
│ • [Another Twitter-specific insight]          │
│ • [User sentiment or common theme]            │
└────────────────────────────────────────────────┘
```

**Features:**
- Black badge with 𝕏 icon (distinctive Twitter/X branding)
- 2-3 bullet points summarizing Twitter discussions
- Cards start expanded by default for visibility

#### C. Final Synthesis
In the **"📋 Final Synthesis"** section, look for citations like:
- "X/Twitter users mention..."
- "According to tweets analyzed..."
- "Social media sentiment on X suggests..."

### 4. Troubleshooting: "I don't see Twitter data"

#### Check 1: Is Twitter Available?
In your browser console (F12 > Console), after search completes, type:
```javascript
// This will be logged automatically
console.log('Received sources:', ...)
```

Look for `twitter: { available: true }` in the logs.

#### Check 2: Hard Refresh
Sometimes the frontend caches old code:
- **Windows/Linux:** Press `Ctrl + Shift + R`
- **Mac:** Press `Cmd + Shift + R`

#### Check 3: Verify Backend
Open this URL in a new tab:
```
http://localhost:5000/api/combined
```

You should see the API documentation or submit a POST request manually.

Or use this curl command:
```bash
curl -X POST http://localhost:5000/api/combined \
  -H "Content-Type: application/json" \
  -d '{"product": "iPhone 15", "email": "test@test.com"}' \
  | jq '.sources.twitter.available'
```

Should return: `true`

#### Check 4: Check Scorecard
```bash
curl -X POST http://localhost:5000/api/combined \
  -H "Content-Type: application/json" \
  -d '{"product": "iPhone 15", "email": "test@test.com"}' \
  | jq '.recommendation.scorecard[] | select(.source == "twitter")'
```

Should show:
```json
{
  "source": "twitter",
  "name": "X/Twitter",
  "score": 1,
  "sampleSize": 10,
  "unit": "tweets",
  "available": true
}
```

### 5. Understanding Twitter Scores

Twitter scores tend to be lower than YouTube/Reddit because:

1. **Real-time sentiment** - Captures current social media chatter (often mixed)
2. **Shorter content** - Tweets are brief opinions vs. detailed reviews
3. **Lower engagement** - Individual tweets get fewer likes than YouTube videos
4. **More varied opinions** - Social media has wider opinion distribution

**Scoring Scale (-5 to +5):**
- `+4 to +5`: Very positive (green bar, almost full)
- `+2 to +3`: Positive (green bar, 70-80%)
- `0 to +1`: Neutral/Mixed (yellow bar, 50-60%) ← **Most common for Twitter**
- `-2 to -1`: Slightly negative (yellow bar, 30-40%)
- `-5 to -3`: Negative (red bar, 0-20%)

### 6. Example Products to Test

**High Engagement Products** (more Twitter activity):
- iPhone 15 Pro
- Tesla Model Y
- PlayStation 5
- AirPods Pro
- Samsung Galaxy S24

**Why These Work Well:**
- Popular consumer products
- Active Twitter discussions
- Recent releases
- Strong brand communities

### 7. Visual Examples

#### Good Twitter Display:
```
𝕏 X/Twitter
████████░░  +3.5  (15 tweets)
```
- Clear bar showing positive sentiment
- Numeric score visible
- Sample size shown

#### Neutral Twitter Display:
```
𝕏 X/Twitter
█████░░░░░  +1.0  (10 tweets)
```
- Yellow bar for mixed sentiment
- Lower score (common for real-time social data)
- Still valid data!

#### No Data:
```
𝕏 X/Twitter
[greyed out]
no data available
```
- Card appears greyed/faded
- No bar shown
- This means either tokens expired OR product has no Twitter mentions

### 8. Developer Mode Verification

If you want to see exactly what data is being fetched:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter for "combined"
4. Submit a product search
5. Click on the "combined" request
6. Go to "Response" tab
7. Look for `sources.twitter` object

You should see:
```json
{
  "source": "twitter",
  "available": true,
  "tweets": [ /* array of 10-15 tweets */ ],
  "metrics": {
    "totalTweets": 15,
    "totalLikes": 28,
    "totalRetweets": 12,
    "avgLikes": 1.87,
    "verifiedCount": 0
  },
  "sentiment": "mixed"
}
```

## Summary

✅ **Twitter IS working** if you see:
1. X/Twitter card in scorecard (even if greyed for some products)
2. A score bar when tweets are found (yellow/green bar)
3. Sample size showing number of tweets
4. Twitter card in Key Takeaways section

❌ **Twitter NOT working** if you see:
1. No X/Twitter card at all in the scorecard
2. Error messages in console
3. Backend returns `available: false` with error

## Need Help?

1. Check `TWITTER_STATUS_REPORT.md` for technical details
2. Run `node test-twitter.js` to verify backend
3. Check server logs for errors
4. Verify tokens in `.env` file

---

**Last Updated:** 2026-02-23
**Status:** Twitter integration fully operational ✅
