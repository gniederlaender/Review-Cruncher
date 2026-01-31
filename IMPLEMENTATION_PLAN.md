# Review Cruncher Refactoring Plan
## Multi-Platform Opinion Synthesis

---

## Executive Summary

Transform Review Cruncher from a single-source recommendation tool into a **multi-platform opinion synthesis engine** that aggregates reviews, opinions, and discussions from various sources (Reddit, YouTube, X/Twitter, Google Reviews, etc.) to provide comprehensive product insights.

---

## Current State Analysis

### Existing Architecture
- **Backend**: Express.js server (server.js - 413 lines)
- **Frontend**: React 19 + TypeScript
- **Current Data Sources**:
  1. OpenAI GPT-4.1 (AI-generated recommendations)
  2. Google Custom Search API (YouTube reviews only)
- **Data Flow**: User Input → OpenAI + Google Search → Combined Response → Display/Email

### Current Limitations
- Only uses AI-generated opinions (not real user reviews)
- Google search limited to YouTube videos
- No access to social media discussions
- No real product review platform integration
- Single perspective (AI) dominates the output

---

## Proposed Architecture

### Multi-Source Data Aggregation

```
User Input: "Tesla Model Y"
    ↓
Parallel API Calls (5-7 sources):
├─ [1] Reddit API → r/teslamotors, r/electricvehicles discussions
├─ [2] YouTube API → Video reviews + top comments
├─ [3] X/Twitter API (if budget allows) → Recent tweets
├─ [4] Google Custom Search → News articles, expert reviews
├─ [5] Best Buy API (if applicable) → Product reviews & ratings
├─ [6] ProductHunt API (if tech product) → User feedback
└─ [7] OpenAI GPT-4.1 → Synthesize all data
    ↓
Categorized Response:
├─ 🗨️ Social Media Sentiment (Reddit, X)
├─ 🎥 Video Reviews (YouTube)
├─ 📰 Expert Reviews (News, Blogs)
├─ ⭐ User Reviews (Best Buy, Google)
└─ 🤖 AI Synthesis (Pros/Cons/Recommendation)
```

---

## Implementation Phases

### Phase 1: MVP - Free Tier APIs (Immediate)
**Goal**: Implement 3-4 free APIs to demonstrate multi-source synthesis

**APIs to Integrate**:
1. **Reddit API** (Free, 60 req/min)
   - Search relevant subreddits
   - Extract top discussions and comments
   - Sentiment analysis from real users

2. **YouTube Data API** (Free tier, 10k units/day)
   - Upgrade from Google Search to direct API
   - Get video metadata + top comments
   - Extract common themes from comments

3. **Google Custom Search API** (Already integrated)
   - Expand beyond YouTube
   - Include news articles, blog reviews

4. **Best Buy API** (Free, 50k/day)
   - For electronics/appliances
   - Real customer reviews and ratings

**Backend Changes**:
- Create `/api/sources/reddit` endpoint
- Create `/api/sources/youtube` endpoint
- Create `/api/sources/bestbuy` endpoint
- Refactor `/api/combined` to aggregate all sources
- Add source-specific parsers module

**Frontend Changes**:
- Update response display to categorize by source
- Add source icons/badges
- Show individual source results in collapsible sections
- Update UI to show "Synthesizing from X sources..."

**Estimated Dev Time**: 2-3 days

---

### Phase 2: Enhanced Synthesis (Week 2)
**Goal**: Improve AI synthesis and add caching

**Features**:
1. **Enhanced AI Prompting**
   - Update OpenAI prompt to analyze multi-source data
   - Extract common themes across sources
   - Identify contradictions between sources
   - Weight credibility by source type

2. **Caching Layer**
   - Cache API responses for 24 hours
   - Reduce API costs for popular products
   - Faster response times

3. **Rate Limiting & Queueing**
   - Implement request queue for API calls
   - Respect rate limits per API
   - Graceful degradation if API unavailable

**Backend Changes**:
- Create `cache.js` module (Redis or file-based)
- Update OpenAI prompt for multi-source synthesis
- Add rate limiting middleware

**Estimated Dev Time**: 2 days

---

### Phase 3: Premium APIs (Optional, Budget Dependent)
**Goal**: Add paid APIs for richer data

**APIs to Consider**:
1. **X (Twitter) API** - $100/month
2. **News API Pro** - $449/month (or use free tier)
3. **SerpAPI** - $50/month (Google SERP scraping)

**Decision Point**: Evaluate Phase 1-2 results before investing

---

## Technical Implementation Details

### New Backend Structure

```javascript
// server.js (refactored)
/api/sources/reddit         → Fetch Reddit discussions
/api/sources/youtube        → Fetch YouTube reviews + comments
/api/sources/bestbuy        → Fetch Best Buy reviews
/api/sources/news           → Fetch news articles
/api/synthesize             → New endpoint: Multi-source synthesis
/api/combined               → Updated: Orchestrate all sources

// New modules
/modules/sources/reddit.js
/modules/sources/youtube.js
/modules/sources/bestbuy.js
/modules/sources/parser.js  → Parse & normalize data
/modules/cache.js           → Caching layer
/modules/synthesizer.js     → OpenAI synthesis logic
```

### Data Structure

```javascript
{
  product: "Tesla Model Y",
  sources: {
    reddit: {
      posts: [...],
      sentiment: "positive",
      keyThemes: ["range", "build quality", "value"]
    },
    youtube: {
      videos: [...],
      topComments: [...],
      avgRating: 4.2
    },
    bestbuy: {
      reviews: [...],
      avgRating: 4.5,
      totalReviews: 234
    },
    news: {
      articles: [...]
    }
  },
  synthesis: {
    overallSentiment: "positive",
    pros: [...],
    cons: [...],
    recommendation: "...",
    confidence: 0.85
  }
}
```

### Frontend Updates

**New Components**:
```
/src/components/SourceCard.tsx    → Display individual source
/src/components/SynthesisView.tsx → AI synthesis display
/src/components/SourceIcon.tsx    → Platform icons
```

**Updated HomePage Layout**:
```
┌─────────────────────────────────┐
│ Product Input                    │
│ Email Input                      │
│ [Get Multi-Source Analysis]      │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 🤖 AI Synthesis                  │
│ ├─ Overall Recommendation        │
│ ├─ Key Pros/Cons                 │
│ └─ Confidence Score              │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 🗨️ Social Media (Reddit, X)      │
│ [Expand to see discussions]      │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 🎥 Video Reviews (YouTube)       │
│ [Expand to see videos]           │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ ⭐ User Reviews (Best Buy)       │
│ [Expand to see reviews]          │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📰 Expert Reviews (News)         │
│ [Expand to see articles]         │
└─────────────────────────────────┘
```

---

## Environment Variables

Add to `.env`:
```bash
# Existing
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
GOOGLE_CSE_ID=...

# New - Phase 1 (Free)
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=...
YOUTUBE_API_KEY=...              # Can use same as GOOGLE_API_KEY
BESTBUY_API_KEY=...
NEWS_API_KEY=...

# New - Phase 3 (Paid, Optional)
TWITTER_BEARER_TOKEN=...
SERPAPI_KEY=...

# Configuration
CACHE_ENABLED=true
CACHE_TTL=86400                  # 24 hours
```

---

## API Rate Limit Management

| API | Free Tier Limit | Strategy |
|-----|----------------|----------|
| Reddit | 60 req/min | Queue requests, respect rate limit |
| YouTube | 10,000 units/day | Cache heavily, ~300 products/day |
| Google Search | 100 searches/day | Use sparingly, cache results |
| Best Buy | 50,000/day | No issues expected |
| OpenAI | Pay-per-token | Optimize prompt length |

**Implementation**:
- Use `p-queue` library for request queuing
- Implement exponential backoff
- Track daily quota usage
- Graceful degradation if quota exceeded

---

## Testing Strategy

### Unit Tests
- Source parsers (Reddit, YouTube, etc.)
- Cache module
- Synthesizer logic

### Integration Tests
- End-to-end API flow
- Multi-source aggregation
- Error handling (API failures)

### Manual Testing
- Test with various product types:
  - Electronics (Tesla Model Y, iPhone)
  - Software (Notion, Slack)
  - Physical goods (Nike shoes)
  - Services (Gym memberships)

---

## Deployment Checklist

- [ ] Set up API keys for all services
- [ ] Test each API endpoint individually
- [ ] Implement error handling for API failures
- [ ] Add logging for debugging
- [ ] Update documentation
- [ ] Test email functionality with new format
- [ ] Performance testing with multiple sources
- [ ] Monitor API costs

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ Successfully integrate 3+ free APIs
- ✅ Display categorized results by source
- ✅ Maintain <5 second response time
- ✅ No increase in errors/crashes

### Long-term Metrics
- User satisfaction with multi-source insights
- Reduction in "I need more info" feedback
- API cost vs. value delivered
- Response accuracy improvement

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API rate limits exceeded | Caching, queue system, graceful degradation |
| API costs too high | Start with free tiers, monitor usage |
| Slow response times | Parallel API calls, caching, timeout limits |
| API unavailability | Fallback to available sources, clear user messaging |
| Data quality issues | Source credibility weighting, outlier detection |

---

## Next Steps (Immediate Actions)

1. ✅ Research completed (PLATFORMS_RESEARCH.md)
2. ✅ Implementation plan created (this document)
3. **[ ] Set up API accounts**:
   - Reddit Developer Application
   - YouTube Data API (Google Cloud)
   - Best Buy Developer Program
   - News API
4. **[ ] Implement Phase 1 backend changes**
5. **[ ] Update frontend for multi-source display**
6. **[ ] Testing and iteration**
7. **[ ] Deploy and monitor**

---

*Created: 2026-01-29*
*Next Review: After Phase 1 completion*
