// modules/sources/twitter.js
const { execSync } = require('child_process');

/**
 * X (Twitter) Integration Module using Bird CLI
 * Searches X/Twitter for product opinions using cookie-based auth
 * No paid API subscription required - uses bird CLI with auth_token/ct0 cookies
 */

class TwitterSource {
    constructor(authToken, ct0) {
        this.authToken = authToken || process.env.TWITTER_AUTH_TOKEN;
        this.ct0 = ct0 || process.env.TWITTER_CT0;
    }

    /**
     * Search X/Twitter for product discussions using bird CLI
     * @param {string} product - Product name to search for
     * @returns {Promise<Object>} Formatted Twitter data
     */
    async search(product) {
        try {
            if (!this.authToken || !this.ct0) {
                return {
                    source: 'twitter',
                    available: false,
                    error: 'Twitter cookies not configured (TWITTER_AUTH_TOKEN and TWITTER_CT0 required)',
                    tweets: [],
                    summary: 'Twitter data unavailable (cookies required)'
                };
            }

            // Build search query for product reviews
            const query = `${product} (review OR opinion OR experience OR thoughts)`;
            
            // Call bird CLI with cookie auth
            const cmd = `bird search "${query.replace(/"/g, '\\"')}" -n 15 --json --auth-token "${this.authToken}" --ct0 "${this.ct0}" 2>/dev/null`;
            
            let output;
            try {
                output = execSync(cmd, { 
                    encoding: 'utf8',
                    timeout: 30000,
                    maxBuffer: 1024 * 1024
                });
            } catch (execError) {
                // bird CLI might return non-zero even with partial results
                if (execError.stdout) {
                    output = execError.stdout;
                } else {
                    throw execError;
                }
            }

            const tweets = JSON.parse(output || '[]');

            if (!tweets || tweets.length === 0) {
                return {
                    source: 'twitter',
                    available: true,
                    tweets: [],
                    summary: 'No recent tweets found about this product'
                };
            }

            // Format tweets to match expected structure
            const formattedTweets = tweets.map(tweet => ({
                text: tweet.text,
                author: tweet.author?.name || 'Unknown',
                username: tweet.author?.username || 'unknown',
                verified: tweet.author?.verified || false,
                createdAt: tweet.createdAt,
                metrics: {
                    likes: tweet.likeCount || 0,
                    retweets: tweet.retweetCount || 0,
                    replies: tweet.replyCount || 0,
                    impressions: 0
                },
                url: `https://twitter.com/${tweet.author?.username}/status/${tweet.id}`
            }));

            // Sort by engagement (likes + retweets)
            formattedTweets.sort((a, b) => {
                const engagementA = a.metrics.likes + a.metrics.retweets;
                const engagementB = b.metrics.likes + b.metrics.retweets;
                return engagementB - engagementA;
            });

            // Calculate aggregate metrics
            const totalLikes = formattedTweets.reduce((sum, t) => sum + t.metrics.likes, 0);
            const totalRetweets = formattedTweets.reduce((sum, t) => sum + t.metrics.retweets, 0);
            const avgLikes = formattedTweets.length > 0 ? Math.round(totalLikes / formattedTweets.length) : 0;
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
            console.error('Twitter search error:', error.message);

            // Check for common errors
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                return {
                    source: 'twitter',
                    available: false,
                    error: 'Twitter cookies expired - please refresh auth_token and ct0',
                    tweets: [],
                    summary: 'Twitter data unavailable (cookies expired)'
                };
            }

            return {
                source: 'twitter',
                available: false,
                error: 'Failed to fetch Twitter data: ' + error.message,
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
