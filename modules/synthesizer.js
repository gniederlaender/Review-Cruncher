// modules/synthesizer.js
const axios = require('axios');

/**
 * Multi-Source Opinion Synthesizer
 * Uses OpenAI to analyze and synthesize data from multiple review sources
 */

class OpinionSynthesizer {
    constructor(openaiApiKey) {
        this.apiKey = openaiApiKey;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    /**
     * Synthesize opinions from multiple sources
     * @param {string} product - Product name
     * @param {Object} sources - Data from all sources (reddit, youtube, bestbuy, etc.)
     * @param {string} expectations - User's expectations (optional)
     * @returns {Promise<Object>} Synthesized recommendation
     */
    async synthesize(product, sources, expectations = '') {
        try {
            const prompt = this._buildPrompt(product, sources, expectations);

            const response = await axios.post(
                this.apiUrl,
                {
                    model: 'gpt-4.1',
                    max_tokens: 800,
                    messages: [
                        {
                            role: 'developer',
                            content: 'You are an expert product analyst who synthesizes opinions from multiple sources (social media, reviews, videos) to provide balanced, data-driven recommendations.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            const synthesisText = response.data.choices[0].message.content;

            return {
                synthesis: synthesisText,
                finishReason: response.data.choices[0].finish_reason,
                sourcesUsed: this._getSourcesUsed(sources)
            };
        } catch (error) {
            console.error('Synthesis error:', error.response?.data || error.message);
            throw new Error('Failed to synthesize multi-source data');
        }
    }

    /**
     * Build comprehensive prompt for OpenAI with multi-source data
     */
    _buildPrompt(product, sources, expectations) {
        let prompt = `I need a comprehensive analysis of "${product}" based on multiple data sources:\n\n`;

        // Add Reddit data
        if (sources.reddit?.available && sources.reddit.discussions?.length > 0) {
            prompt += `**REDDIT DISCUSSIONS (${sources.reddit.discussions.length} posts, ${sources.reddit.totalComments} comments):**\n`;
            prompt += `- Overall sentiment: ${sources.reddit.sentiment}\n`;
            prompt += `- Average score: ${sources.reddit.avgScore} upvotes\n`;
            prompt += `- Active subreddits: ${sources.reddit.subreddits.join(', ')}\n`;
            prompt += `- Top discussions:\n`;
            sources.reddit.discussions.slice(0, 3).forEach(d => {
                prompt += `  • "${d.title}" (${d.score} upvotes, ${d.numComments} comments)\n`;
            });
            prompt += '\n';
        }

        // Add YouTube data
        if (sources.youtube?.available && sources.youtube.videos?.length > 0) {
            prompt += `**YOUTUBE REVIEWS (${sources.youtube.videos.length} videos):**\n`;
            prompt += `- Total views: ${this._formatNumber(sources.youtube.metrics.totalViews)}\n`;
            prompt += `- Total likes: ${this._formatNumber(sources.youtube.metrics.totalLikes)}\n`;
            prompt += `- Top reviews:\n`;
            sources.youtube.videos.slice(0, 3).forEach(v => {
                prompt += `  • "${v.title}" by ${v.channelTitle} (${this._formatNumber(v.viewCount)} views, ${this._formatNumber(v.likeCount)} likes)\n`;
            });
            if (sources.youtube.topComments?.length > 0) {
                prompt += `- Sample viewer comments:\n`;
                sources.youtube.topComments.slice(0, 2).forEach(c => {
                    prompt += `  • "${c.text.slice(0, 100)}..." (${c.likeCount} likes)\n`;
                });
            }
            prompt += '\n';
        }

        // Add Best Buy data
        if (sources.bestbuy?.available && sources.bestbuy.products?.length > 0) {
            prompt += `**BEST BUY CUSTOMER REVIEWS:**\n`;
            prompt += `- Products found: ${sources.bestbuy.metrics.productsFound}\n`;
            prompt += `- Average rating: ${sources.bestbuy.metrics.avgRating}/5.0 stars\n`;
            prompt += `- Total reviews: ${sources.bestbuy.metrics.totalReviews}\n`;
            prompt += `- Overall sentiment: ${sources.bestbuy.sentiment}\n`;
            if (sources.bestbuy.reviews?.length > 0) {
                prompt += `- Sample customer reviews:\n`;
                sources.bestbuy.reviews.slice(0, 2).forEach(r => {
                    prompt += `  • ${r.rating}/5 - "${r.title}" - ${r.comment.slice(0, 100)}...\n`;
                });
            }
            prompt += '\n';
        }

        // Add Twitter/X data
        if (sources.twitter?.available && sources.twitter.tweets?.length > 0) {
            prompt += `**X (TWITTER) SOCIAL OPINIONS (${sources.twitter.tweets.length} tweets):**\n`;
            prompt += `- Total engagement: ${this._formatNumber(sources.twitter.metrics.totalLikes + sources.twitter.metrics.totalRetweets)}\n`;
            prompt += `- Verified accounts: ${sources.twitter.metrics.verifiedCount}\n`;
            prompt += `- Overall sentiment: ${sources.twitter.sentiment}\n`;
            prompt += `- Top tweets:\n`;
            sources.twitter.tweets.slice(0, 3).forEach(t => {
                const engagement = t.metrics.likes + t.metrics.retweets;
                prompt += `  • @${t.username}${t.verified ? ' ✓' : ''}: "${t.text.slice(0, 150)}..." (${engagement} engagement)\n`;
            });
            prompt += '\n';
        }

        // Add Google Search data (if available)
        if (sources.google?.available && sources.google.articles?.length > 0) {
            prompt += `**EXPERT REVIEWS & ARTICLES:**\n`;
            sources.google.articles.slice(0, 3).forEach(a => {
                prompt += `  • "${a.title}" - ${a.snippet}\n`;
            });
            prompt += '\n';
        }

        // Add user expectations
        if (expectations) {
            prompt += `**USER EXPECTATIONS:**\n${expectations}\n\n`;
        }

        // Instructions for synthesis
        prompt += `Based on this multi-source data, provide a comprehensive analysis in the following format:\n\n`;
        prompt += `**Overall Sentiment Analysis**\n`;
        prompt += `[Synthesize the overall sentiment across all sources - are people generally positive, negative, or mixed?]\n\n`;
        prompt += `**Key Strengths (Based on Real User Feedback)**\n`;
        prompt += `1. [Strength 1 with specific examples from sources]\n`;
        prompt += `2. [Strength 2 with specific examples from sources]\n`;
        prompt += `3. [Strength 3 with specific examples from sources]\n\n`;
        prompt += `**Key Concerns (Based on Real User Feedback)**\n`;
        prompt += `1. [Concern 1 with specific examples from sources]\n`;
        prompt += `2. [Concern 2 with specific examples from sources]\n`;
        prompt += `3. [Concern 3 with specific examples from sources]\n\n`;
        prompt += `**Price & Value Assessment**\n`;
        prompt += `[Discuss pricing and value for money based on available data]\n\n`;
        prompt += `**Alternative Recommendations**\n`;
        prompt += `[Suggest 1-2 alternatives that are frequently mentioned across sources]\n\n`;
        prompt += `**Final Recommendation**\n`;
        prompt += `[Clear buy/don't buy recommendation with reasoning. Address user expectations if provided.]\n\n`;
        prompt += `**Confidence Level:** [High/Medium/Low based on data quality and consensus]\n\n`;
        prompt += `Use markdown formatting. Be specific and cite sources where possible (e.g., "Reddit users in r/technology mention...", "YouTube reviewers note...", "Best Buy customers rate...").`;

        return prompt;
    }

    /**
     * Get list of sources that provided data
     */
    _getSourcesUsed(sources) {
        const used = [];
        if (sources.reddit?.available) used.push('Reddit');
        if (sources.youtube?.available) used.push('YouTube');
        if (sources.bestbuy?.available) used.push('Best Buy');
        if (sources.twitter?.available) used.push('X/Twitter');
        if (sources.google?.available) used.push('Google Search');
        return used;
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

module.exports = OpinionSynthesizer;
