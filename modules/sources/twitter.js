// modules/sources/twitter.js
const axios = require('axios');

/**
 * X (Twitter) API Integration Module
 * Searches X/Twitter for product opinions and discussions
 * Note: X API requires paid subscription (Basic tier: $100/month minimum)
 */

class TwitterSource {
    constructor(bearerToken) {
        this.bearerToken = bearerToken;
        this.baseUrl = 'https://api.twitter.com/2';
    }

    /**
     * Search X/Twitter for product discussions
     * @param {string} product - Product name to search for
     * @returns {Promise<Object>} Formatted Twitter data
     */
    async search(product) {
        try {
            if (!this.bearerToken) {
                return {
                    source: 'twitter',
                    available: false,
                    error: 'Twitter API key not configured',
                    tweets: [],
                    summary: 'Twitter data unavailable (API key required)'
                };
            }

            // Search for recent tweets about the product
            const searchResponse = await axios.get(`${this.baseUrl}/tweets/search/recent`, {
                params: {
                    query: `"${product}" (review OR opinion OR experience OR thoughts) -is:retweet lang:en`,
                    max_results: 20,
                    'tweet.fields': 'created_at,public_metrics,author_id,context_annotations',
                    'user.fields': 'username,name,verified',
                    'expansions': 'author_id'
                },
                headers: {
                    'Authorization': `Bearer ${this.bearerToken}`
                }
            });

            const tweets = searchResponse.data.data || [];
            const users = searchResponse.data.includes?.users || [];

            if (tweets.length === 0) {
                return {
                    source: 'twitter',
                    available: true,
                    tweets: [],
                    summary: 'No recent tweets found about this product'
                };
            }

            // Combine tweet data with user information
            const formattedTweets = tweets.map(tweet => {
                const author = users.find(u => u.id === tweet.author_id);
                return {
                    text: tweet.text,
                    author: author ? author.name : 'Unknown',
                    username: author ? author.username : 'unknown',
                    verified: author ? author.verified : false,
                    createdAt: tweet.created_at,
                    metrics: {
                        likes: tweet.public_metrics.like_count,
                        retweets: tweet.public_metrics.retweet_count,
                        replies: tweet.public_metrics.reply_count,
                        impressions: tweet.public_metrics.impression_count || 0
                    },
                    url: `https://twitter.com/${author?.username}/status/${tweet.id}`
                };
            });

            // Sort by engagement (likes + retweets)
            formattedTweets.sort((a, b) => {
                const engagementA = a.metrics.likes + a.metrics.retweets;
                const engagementB = b.metrics.likes + b.metrics.retweets;
                return engagementB - engagementA;
            });

            // Calculate aggregate metrics
            const totalLikes = formattedTweets.reduce((sum, t) => sum + t.metrics.likes, 0);
            const totalRetweets = formattedTweets.reduce((sum, t) => sum + t.metrics.retweets, 0);
            const avgLikes = Math.round(totalLikes / formattedTweets.length);
            const verifiedCount = formattedTweets.filter(t => t.verified).length;

            // Simple sentiment analysis based on engagement
            let sentiment = 'neutral';
            if (avgLikes > 50) sentiment = 'positive';
            else if (avgLikes < 10) sentiment = 'mixed';

            return {
                source: 'twitter',
                available: true,
                tweets: formattedTweets.slice(0, 10), // Top 10 by engagement
                metrics: {
                    totalTweets: formattedTweets.length,
                    totalLikes,
                    totalRetweets,
                    avgLikes,
                    verifiedCount
                },
                sentiment,
                summary: this._generateSummary(formattedTweets, totalLikes, totalRetweets, verifiedCount)
            };
        } catch (error) {
            console.error('Twitter search error:', error.response?.data || error.message);

            // Handle specific error cases
            if (error.response?.status === 401) {
                return {
                    source: 'twitter',
                    available: false,
                    error: 'Invalid Twitter API credentials',
                    tweets: [],
                    summary: 'Twitter data unavailable (authentication failed)'
                };
            } else if (error.response?.status === 429) {
                return {
                    source: 'twitter',
                    available: false,
                    error: 'Twitter API rate limit exceeded',
                    tweets: [],
                    summary: 'Twitter data temporarily unavailable (rate limit)'
                };
            }

            return {
                source: 'twitter',
                available: false,
                error: 'Failed to fetch Twitter data',
                tweets: [],
                summary: 'Twitter data unavailable'
            };
        }
    }

    /**
     * Generate a summary of Twitter discussions
     */
    _generateSummary(tweets, totalLikes, totalRetweets, verifiedCount) {
        if (tweets.length === 0) {
            return 'No recent tweets found about this product';
        }

        const topTweet = tweets[0];
        const engagement = totalLikes + totalRetweets;

        return `${tweets.length} recent tweets found with ${this._formatNumber(engagement)} total engagement ` +
               `(${this._formatNumber(totalLikes)} likes, ${this._formatNumber(totalRetweets)} retweets). ` +
               `${verifiedCount} from verified accounts. Top tweet by @${topTweet.username} ` +
               `(${this._formatNumber(topTweet.metrics.likes)} likes).`;
    }

    /**
     * Format large numbers for readability
     */
    _formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

module.exports = TwitterSource;
