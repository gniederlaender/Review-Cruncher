# Review Platforms & Opinion Bubbles Research

## Overview
This document provides a comprehensive analysis of review platforms and opinion bubbles that can be integrated into Review Cruncher to deliver synthesized product opinions from multiple sources.

---

## Review Platforms

| Platform | API Available | Access Type | Pricing | Data Access | Rate Limits | Notes |
|----------|--------------|-------------|---------|-------------|-------------|-------|
| **Google Reviews** (Google Business Profile) | Yes | OAuth 2.0 | Free | Business reviews, ratings, reply to reviews | 1,500 queries/day (free tier) | Requires business verification for full access. Read-only for public reviews. |
| **Yelp Fusion API** | Yes | API Key | Free tier available | Business info, reviews (limited), ratings, photos | 5,000 calls/day (free) | Only returns up to 3 review excerpts per business. Full reviews not accessible. |
| **Trustpilot** | Yes | API Key | Paid only | Company reviews, ratings, review details | Varies by plan | No free tier. Requires business partnership or paid plan. |
| **TripAdvisor** | Limited | Content API | Paid | Location data, limited review snippets | Varies | Primarily for display, not full review text. Requires partnership. |
| **Amazon Product Reviews** | No official API | Web scraping | N/A | Product reviews, ratings, verified purchases | N/A | No official API. Must use scraping (violates ToS). Third-party APIs exist (paid). |
| **Capterra** | Limited | Partner API | Paid | Software reviews | Varies | Requires partnership agreement. |
| **G2** | Yes | API | Paid | Software reviews, ratings, comparisons | Varies | Requires business account. No free tier. |
| **Consumer Reports** | No | N/A | N/A | Product testing, reviews | N/A | Subscription-based content, no API. |
| **Better Business Bureau (BBB)** | No official API | Web scraping | N/A | Business reviews, complaints, ratings | N/A | No public API available. |
| **Glassdoor** | Limited | Partner API | Paid | Employer reviews (not product) | Varies | Not relevant for product reviews. |

---

## Opinion Bubbles / Social Media Platforms

| Platform | API Available | Access Type | Pricing | Data Access | Rate Limits | Notes |
|----------|--------------|-------------|---------|-------------|-------------|-------|
| **X (Twitter)** | Yes | OAuth 2.0 | Paid (as of 2023) | Tweets, mentions, hashtags | Varies by tier | Free tier discontinued in 2023. Basic: $100/month. |
| **Reddit** | Yes | OAuth 2.0 | Free | Posts, comments, subreddits | 60 requests/minute | Free tier available. Great for product discussions. |
| **YouTube** | Yes | API Key | Free tier | Video metadata, comments, search | 10,000 units/day (free) | Excellent for product reviews. Comments provide user opinions. |
| **Facebook/Instagram** | Yes (Graph API) | OAuth 2.0 | Free (limited) | Public posts, pages (limited) | 200 calls/hour | Restricted access to public content. Privacy-focused. |
| **TikTok** | Yes | OAuth 2.0 | Free (limited) | Video data, user info (limited) | Varies | Limited public data access. Requires app approval. |
| **LinkedIn** | Yes | OAuth 2.0 | Free (limited) | Posts, comments (limited) | Varies | Not ideal for product reviews. B2B focused. |
| **Mastodon** | Yes | OAuth 2.0 | Free | Posts, toots, hashtags | Varies by instance | Decentralized. API access per instance. |
| **Bluesky** | Yes | AT Protocol | Free | Posts, profiles, feeds | Generous | Open API. Good for emerging opinions. |
| **Discord** | Yes | Bot Token | Free | Server messages (with permission) | 50 requests/second | Requires server access. Niche communities. |

---

## Specialized Product Review Platforms

| Platform | API Available | Access Type | Pricing | Data Access | Rate Limits | Notes |
|----------|--------------|-------------|---------|-------------|-------------|-------|
| **ProductHunt** | Yes | OAuth 2.0 | Free | Product launches, upvotes, comments | 60 requests/minute | Great for tech products. |
| **AlternativeTo** | Limited | Web scraping | N/A | Software alternatives, user opinions | N/A | No official API. |
| **Wirecutter (NYT)** | No | N/A | N/A | Expert reviews | N/A | Subscription content, no API. |
| **CNET Reviews** | No | RSS/Web scraping | N/A | Tech product reviews | N/A | No public API. RSS feeds available. |
| **PCMag Reviews** | No | RSS/Web scraping | N/A | Tech reviews | N/A | No public API. RSS feeds available. |
| **iFixit** | Yes | API | Free | Repair guides, device scores | Generous | Great for product durability insights. |

---

## E-Commerce Platforms

| Platform | API Available | Access Type | Pricing | Data Access | Rate Limits | Notes |
|----------|--------------|-------------|---------|-------------|-------------|-------|
| **Amazon (unofficial)** | Third-party APIs | API Key | Paid | Product data, reviews, ratings | Varies | Rainforest API, ScraperAPI, Oxylabs (all paid). |
| **eBay** | Yes | OAuth 2.0 | Free tier | Product listings, feedback | 5,000 calls/day | Seller feedback, not product reviews. |
| **Etsy** | Yes | OAuth 2.0 | Free | Shop reviews, product listings | 10,000 calls/day | Good for handmade/unique products. |
| **AliExpress** | Limited | Web scraping | N/A | Product reviews | N/A | No official public API. |
| **Best Buy** | Yes | API Key | Free | Product info, reviews, ratings | 50,000 calls/day | Good for electronics. |
| **Walmart** | Yes (limited) | API Key | Requires partnership | Product data, limited reviews | Varies | Requires Walmart Marketplace account. |

---

## News & Media Aggregators

| Platform | API Available | Access Type | Pricing | Data Access | Rate Limits | Notes |
|----------|--------------|-------------|---------|-------------|-------------|-------|
| **News API** | Yes | API Key | Free tier | Articles, headlines, sources | 100 requests/day (free) | Good for product launch news. |
| **The Guardian** | Yes | API Key | Free | Articles, content | 12 requests/second | UK-focused news source. |
| **New York Times** | Yes | API Key | Free tier | Articles, reviews | 4,000 requests/day | Quality journalism, product reviews. |
| **RSS Feeds** | N/A | Direct fetch | Free | Blog posts, news | Varies | Many review sites offer RSS. |

---

## Sentiment Analysis & Review Aggregators

| Platform | API Available | Access Type | Pricing | Data Access | Rate Limits | Notes |
|----------|--------------|-------------|---------|-------------|-------------|-------|
| **ReviewMeta** | No | Web scraping | N/A | Amazon review analysis | N/A | Analyzes fake reviews. No API. |
| **Fakespot** | No | Web scraping | N/A | Review authenticity analysis | N/A | Acquired by Mozilla. No public API. |
| **SerpAPI** | Yes | API Key | Paid | Google search results, reviews | Varies | $50/month for 5,000 searches. |
| **Outscraper** | Yes | API Key | Paid | Google Maps reviews, business data | Pay-per-use | $0.001 per review. Good for Google Reviews. |
| **Apify** | Yes | API Key | Free tier | Web scraping for various platforms | Varies | Platform for custom scrapers. |

---

## Recommended Integration Strategy

### Tier 1 - High Priority (Free/Low Cost)
1. **Reddit API** - Free, rich discussions, authentic opinions
2. **YouTube Data API** - Free tier (10k units/day), video reviews & comments
3. **Google Custom Search API** - Already integrated, expand usage
4. **Best Buy API** - Free, 50k calls/day, good for electronics
5. **ProductHunt API** - Free, great for tech products

### Tier 2 - Medium Priority (Worth the Cost)
1. **X (Twitter) API** - $100/month Basic tier, real-time opinions
2. **Yelp Fusion API** - Free tier, local business reviews
3. **News API** - Free tier (100/day), product launch coverage
4. **SerpAPI** - $50/month, comprehensive Google search results

### Tier 3 - Future Consideration
1. **Trustpilot API** - Paid, requires partnership
2. **Amazon Review APIs** - Third-party paid services
3. **Outscraper** - Pay-per-use for Google Maps reviews
4. **TripAdvisor API** - Paid, partnership required

---

## Implementation Architecture

### Multi-Source Review Synthesis Flow

```
User Input: "Tesla Model Y"
    ↓
Parallel API Calls:
├─ Reddit API → Search r/teslamotors, r/electricvehicles
├─ YouTube API → Search "Tesla Model Y review"
├─ X API → Search tweets with "Tesla Model Y"
├─ Google Search → News articles, reviews
├─ Best Buy API → Product page if available
└─ OpenAI → Synthesize all data into coherent opinion
    ↓
Categorized Response:
├─ Social Media Sentiment (X, Reddit)
├─ Video Reviews (YouTube)
├─ Expert Reviews (News, blogs)
├─ User Reviews (Google, Yelp, Best Buy)
└─ AI Synthesis (Pros, Cons, Recommendation)
```

---

## Cost Estimation (Monthly)

### Minimal Viable Product (MVP)
- Reddit API: **Free**
- YouTube Data API: **Free** (10k units/day = ~300k/month)
- Google Custom Search API: **Free** (100 searches/day)
- Best Buy API: **Free**
- OpenAI API: **$20-50/month** (depending on usage)
- **Total: ~$20-50/month**

### Production Ready
- Above MVP: $20-50
- X API Basic: **$100/month**
- News API Pro: **$449/month** (or stick with free tier)
- SerpAPI: **$50/month**
- **Total: ~$170-650/month** (depending on tiers)

---

## API Authentication Requirements

| API | Auth Type | Required Credentials |
|-----|-----------|---------------------|
| Reddit | OAuth 2.0 | Client ID, Client Secret, User Agent |
| YouTube | API Key | Google Cloud API Key |
| X (Twitter) | OAuth 2.0 | API Key, API Secret, Bearer Token |
| Yelp | API Key | Fusion API Key |
| Best Buy | API Key | Best Buy Developer Key |
| News API | API Key | News API Key |
| ProductHunt | OAuth 2.0 | API Token |

---

## Next Steps

1. **Set up free tier APIs** (Reddit, YouTube, Best Buy, ProductHunt)
2. **Implement multi-source data fetching** in backend
3. **Create source-specific parsers** for each platform
4. **Design UI to display categorized opinions** (Social, Video, Expert, User)
5. **Enhance OpenAI prompt** to synthesize multi-source data
6. **Add caching layer** to reduce API calls for popular products
7. **Implement rate limiting** and queue system for API management

---

## Legal & Ethical Considerations

- **Terms of Service**: Ensure compliance with each API's ToS
- **Attribution**: Clearly cite sources and provide links
- **Data Privacy**: Don't store personal user data from APIs
- **Rate Limiting**: Respect API rate limits to avoid bans
- **Caching**: Cache results to reduce costs and API load
- **Transparency**: Inform users which sources are used

---

*Last Updated: 2026-01-29*
