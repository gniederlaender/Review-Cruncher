// modules/sources/reddit.js
const axios = require('axios');

/**
 * Reddit API Integration Module
 * Searches Reddit for product discussions and extracts opinions
 */

class RedditSource {
    constructor(clientId, clientSecret, userAgent) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.userAgent = userAgent;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get OAuth access token for Reddit API
     */
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            const response = await axios.post(
                'https://www.reddit.com/api/v1/access_token',
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': this.userAgent
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            return this.accessToken;
        } catch (error) {
            console.error('Reddit auth error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Reddit API');
        }
    }

    /**
     * Search Reddit for product discussions
     * @param {string} product - Product name to search for
     * @returns {Promise<Object>} Formatted Reddit data
     */
    async search(product) {
        try {
            const token = await this.getAccessToken();

            // Search Reddit for the product
            const searchResponse = await axios.get('https://oauth.reddit.com/search', {
                params: {
                    q: product,
                    limit: 10,
                    sort: 'relevance',
                    type: 'link'
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': this.userAgent
                }
            });

            const posts = searchResponse.data.data.children || [];

            // Extract relevant information
            const discussions = posts.slice(0, 5).map(post => ({
                title: post.data.title,
                subreddit: post.data.subreddit,
                score: post.data.score,
                numComments: post.data.num_comments,
                url: `https://reddit.com${post.data.permalink}`,
                selfText: post.data.selftext?.slice(0, 300) || '',
                created: new Date(post.data.created_utc * 1000).toISOString()
            }));

            // Calculate sentiment (simple approach based on scores)
            const avgScore = discussions.reduce((sum, d) => sum + d.score, 0) / (discussions.length || 1);
            let sentiment = 'neutral';
            if (avgScore > 50) sentiment = 'positive';
            else if (avgScore < 10) sentiment = 'negative';

            // Extract popular subreddits
            const subreddits = [...new Set(discussions.map(d => d.subreddit))];

            return {
                source: 'reddit',
                available: true,
                discussions,
                sentiment,
                avgScore: Math.round(avgScore),
                totalComments: discussions.reduce((sum, d) => sum + d.numComments, 0),
                subreddits,
                summary: this._generateSummary(discussions, sentiment)
            };
        } catch (error) {
            console.error('Reddit search error:', error.response?.data || error.message);
            return {
                source: 'reddit',
                available: false,
                error: 'Failed to fetch Reddit data',
                discussions: [],
                sentiment: 'unknown',
                summary: 'Reddit data unavailable'
            };
        }
    }

    /**
     * Generate a summary of Reddit discussions
     */
    _generateSummary(discussions, sentiment) {
        if (discussions.length === 0) {
            return 'No Reddit discussions found';
        }

        const topDiscussion = discussions[0];
        const totalComments = discussions.reduce((sum, d) => sum + d.numComments, 0);

        return `${discussions.length} discussions found across Reddit with ${totalComments} total comments. ` +
               `Overall sentiment appears ${sentiment}. Top discussion: "${topDiscussion.title}" ` +
               `in r/${topDiscussion.subreddit} (${topDiscussion.score} upvotes).`;
    }
}

module.exports = RedditSource;
