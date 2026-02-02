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
            // Calculate sentiment scores for each source
            const scorecard = this._calculateScorecard(sources);

            const prompt = this._buildPrompt(product, sources, expectations, scorecard);

            const response = await axios.post(
                this.apiUrl,
                {
                    model: 'gpt-4.1',
                    max_tokens: 1200,
                    messages: [
                        {
                            role: 'developer',
                            content: 'You are an expert product analyst who synthesizes opinions from multiple sources (social media, reviews, videos) to provide balanced, data-driven recommendations. You specialize in identifying consensus and divergence across different platforms.'
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

            // Parse the structured response
            const parsedResponse = this._parseStructuredResponse(synthesisText);

            return {
                scorecard: scorecard,
                keyTakeaways: parsedResponse.keyTakeaways,
                consensus: parsedResponse.consensus,
                divergence: parsedResponse.divergence,
                synthesis: parsedResponse.synthesis || synthesisText, // Fallback to full text
                finishReason: response.data.choices[0].finish_reason,
                sourcesUsed: this._getSourcesUsed(sources)
            };
        } catch (error) {
            console.error('Synthesis error:', error.response?.data || error.message);
            throw new Error('Failed to synthesize multi-source data');
        }
    }

    /**
     * Calculate sentiment scorecard for all sources
     * Returns scores on -5 to +5 scale
     */
    _calculateScorecard(sources) {
        const scorecard = [];

        // Google/Best Buy (star ratings 1-5 mapped to -5 to +5)
        if (sources.bestbuy?.available && sources.bestbuy.products?.length > 0) {
            const avgRating = parseFloat(sources.bestbuy.metrics.avgRating);
            const score = ((avgRating - 3) / 2) * 5; // Map 1-5 to -5 to +5, center at 3
            scorecard.push({
                source: 'bestbuy',
                name: 'Best Buy',
                score: Math.round(score * 10) / 10,
                sampleSize: sources.bestbuy.metrics.totalReviews,
                unit: 'reviews',
                available: true
            });
        } else {
            scorecard.push({
                source: 'bestbuy',
                name: 'Best Buy',
                score: null,
                sampleSize: 0,
                unit: 'reviews',
                available: false
            });
        }

        // Reddit (upvote-based sentiment)
        if (sources.reddit?.available && sources.reddit.discussions?.length > 0) {
            const avgScore = sources.reddit.avgScore || 0;
            const sentiment = sources.reddit.sentiment || 'neutral';
            let score = 0;
            // Map sentiment and engagement to score
            if (sentiment === 'positive') score = 3.5;
            else if (sentiment === 'very positive') score = 4.5;
            else if (sentiment === 'negative') score = -3.0;
            else if (sentiment === 'mixed') score = 1.5;
            // Adjust by upvote ratio
            if (avgScore > 100) score += 0.5;
            else if (avgScore < 10) score -= 0.5;

            scorecard.push({
                source: 'reddit',
                name: 'Reddit',
                score: Math.max(-5, Math.min(5, Math.round(score * 10) / 10)),
                sampleSize: sources.reddit.discussions.length,
                unit: 'threads',
                available: true
            });
        } else {
            scorecard.push({
                source: 'reddit',
                name: 'Reddit',
                score: null,
                sampleSize: 0,
                unit: 'threads',
                available: false
            });
        }

        // X/Twitter (engagement-weighted sentiment)
        if (sources.twitter?.available && sources.twitter.tweets?.length > 0) {
            const sentiment = sources.twitter.sentiment || 'neutral';
            const avgLikes = sources.twitter.metrics.avgLikes || 0;
            let score = 0;

            if (sentiment === 'positive') score = 3.5;
            else if (sentiment === 'very positive') score = 4.5;
            else if (sentiment === 'negative') score = -3.0;
            else if (sentiment === 'mixed') score = 1.0;

            // High engagement suggests stronger sentiment
            if (avgLikes > 100) score = Math.abs(score) > 0 ? score * 1.1 : score + 0.5;

            scorecard.push({
                source: 'twitter',
                name: 'X/Twitter',
                score: Math.max(-5, Math.min(5, Math.round(score * 10) / 10)),
                sampleSize: sources.twitter.tweets.length,
                unit: 'tweets',
                available: true
            });
        } else {
            scorecard.push({
                source: 'twitter',
                name: 'X/Twitter',
                score: null,
                sampleSize: 0,
                unit: 'tweets',
                available: false
            });
        }

        // YouTube (like ratio and view counts)
        if (sources.youtube?.available && sources.youtube.videos?.length > 0) {
            const totalLikes = sources.youtube.metrics.totalLikes || 0;
            const totalViews = sources.youtube.metrics.totalViews || 1;
            const likeRatio = totalLikes / totalViews;

            // Typical good YouTube video has 3-5% like ratio
            let score = 0;
            if (likeRatio >= 0.04) score = 4.0;
            else if (likeRatio >= 0.03) score = 3.0;
            else if (likeRatio >= 0.02) score = 2.0;
            else if (likeRatio >= 0.01) score = 1.0;
            else score = -1.0;

            scorecard.push({
                source: 'youtube',
                name: 'YouTube',
                score: Math.round(score * 10) / 10,
                sampleSize: sources.youtube.videos.length,
                unit: 'videos',
                available: true
            });
        } else {
            scorecard.push({
                source: 'youtube',
                name: 'YouTube',
                score: null,
                sampleSize: 0,
                unit: 'videos',
                available: false
            });
        }

        // Google Search (articles - no scoring, just availability)
        if (sources.google?.available && sources.google.articles?.length > 0) {
            scorecard.push({
                source: 'google',
                name: 'Google Search',
                score: null, // Articles don't have inherent scores
                sampleSize: sources.google.articles.length,
                unit: 'articles',
                available: true
            });
        } else {
            scorecard.push({
                source: 'google',
                name: 'Google Search',
                score: null,
                sampleSize: 0,
                unit: 'articles',
                available: false
            });
        }

        return scorecard;
    }

    /**
     * Build comprehensive prompt for OpenAI with multi-source data
     */
    _buildPrompt(product, sources, expectations, scorecard) {
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

        // Instructions for synthesis - structured 4-section output
        prompt += `Based on this multi-source data, provide a comprehensive analysis in the following EXACT format:\n\n`;

        prompt += `## KEY TAKEAWAYS BY SOURCE\n\n`;
        prompt += `For each available source, provide 2-3 key takeaways:\n\n`;
        if (sources.reddit?.available) prompt += `**Reddit:**\n- [Key point 1]\n- [Key point 2]\n\n`;
        if (sources.youtube?.available) prompt += `**YouTube:**\n- [Key point 1]\n- [Key point 2]\n\n`;
        if (sources.bestbuy?.available) prompt += `**Best Buy:**\n- [Key point 1]\n- [Key point 2]\n\n`;
        if (sources.twitter?.available) prompt += `**X/Twitter:**\n- [Key point 1]\n- [Key point 2]\n\n`;
        if (sources.google?.available) prompt += `**Google Search:**\n- [Key point 1]\n- [Key point 2]\n\n`;

        prompt += `## CONSENSUS\n\n`;
        prompt += `List 2-3 points where ALL or MOST sources agree:\n`;
        prompt += `- [Agreement point 1]\n`;
        prompt += `- [Agreement point 2]\n\n`;

        prompt += `## DIVERGENCE\n\n`;
        prompt += `Highlight 2-3 contradictions or disagreements between sources:\n`;
        prompt += `- [Divergence point 1: "Source A says X, but Source B says Y"]\n`;
        prompt += `- [Divergence point 2]\n\n`;

        prompt += `## FINAL SYNTHESIS\n\n`;
        prompt += `**Overall Sentiment:** [Positive/Mixed/Negative]\n\n`;
        prompt += `**Key Strengths:**\n`;
        prompt += `1. [Strength 1 with source citations]\n`;
        prompt += `2. [Strength 2 with source citations]\n\n`;
        prompt += `**Key Concerns:**\n`;
        prompt += `1. [Concern 1 with source citations]\n`;
        prompt += `2. [Concern 2 with source citations]\n\n`;
        prompt += `**Recommendation:** [Clear verdict with reasoning. Address user expectations if provided.]\n\n`;
        prompt += `**Confidence Level:** [High/Medium/Low based on data quality and source consensus]\n\n`;

        prompt += `IMPORTANT: Use the exact section headers shown above (## KEY TAKEAWAYS BY SOURCE, ## CONSENSUS, ## DIVERGENCE, ## FINAL SYNTHESIS) so the response can be properly parsed.`;

        return prompt;
    }

    /**
     * Parse structured GPT response into sections
     */
    _parseStructuredResponse(text) {
        const result = {
            keyTakeaways: {},
            consensus: [],
            divergence: [],
            synthesis: ''
        };

        try {
            // Split by section headers
            const keyTakeawaysMatch = text.match(/## KEY TAKEAWAYS BY SOURCE\s*([\s\S]*?)(?=## CONSENSUS|$)/i);
            const consensusMatch = text.match(/## CONSENSUS\s*([\s\S]*?)(?=## DIVERGENCE|$)/i);
            const divergenceMatch = text.match(/## DIVERGENCE\s*([\s\S]*?)(?=## FINAL SYNTHESIS|$)/i);
            const synthesisMatch = text.match(/## FINAL SYNTHESIS\s*([\s\S]*?)$/i);

            // Parse key takeaways by source
            if (keyTakeawaysMatch) {
                const takeawaysText = keyTakeawaysMatch[1];
                const sources = ['Reddit', 'YouTube', 'Best Buy', 'X/Twitter', 'Google Search'];

                sources.forEach(source => {
                    const sourceRegex = new RegExp(`\\*\\*${source}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[^*]+:\\*\\*|$)`, 'i');
                    const sourceMatch = takeawaysText.match(sourceRegex);
                    if (sourceMatch) {
                        const bullets = sourceMatch[1].match(/- (.+)/g);
                        if (bullets) {
                            result.keyTakeaways[source.toLowerCase().replace(/[^a-z]/g, '')] =
                                bullets.map(b => b.replace(/^- /, '').trim());
                        }
                    }
                });
            }

            // Parse consensus
            if (consensusMatch) {
                const bullets = consensusMatch[1].match(/- (.+)/g);
                if (bullets) {
                    result.consensus = bullets.map(b => b.replace(/^- /, '').trim());
                }
            }

            // Parse divergence
            if (divergenceMatch) {
                const bullets = divergenceMatch[1].match(/- (.+)/g);
                if (bullets) {
                    result.divergence = bullets.map(b => b.replace(/^- /, '').trim());
                }
            }

            // Parse synthesis (full section)
            if (synthesisMatch) {
                result.synthesis = synthesisMatch[1].trim();
            } else {
                // Fallback: use entire text if parsing fails
                result.synthesis = text;
            }

        } catch (error) {
            console.error('Error parsing structured response:', error.message);
            // Fallback to full text
            result.synthesis = text;
        }

        return result;
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
