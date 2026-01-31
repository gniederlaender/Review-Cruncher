// modules/sources/youtube.js
const axios = require('axios');

/**
 * YouTube Data API Integration Module
 * Searches for product reviews and extracts video metadata and comments
 */

class YouTubeSource {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    }

    /**
     * Search YouTube for product reviews
     * @param {string} product - Product name to search for
     * @returns {Promise<Object>} Formatted YouTube data
     */
    async search(product) {
        try {
            // Search for videos
            const searchQuery = `${product} review`;
            const searchResponse = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    part: 'snippet',
                    q: searchQuery,
                    type: 'video',
                    maxResults: 5,
                    order: 'relevance',
                    key: this.apiKey
                }
            });

            const videos = searchResponse.data.items || [];

            if (videos.length === 0) {
                return {
                    source: 'youtube',
                    available: true,
                    videos: [],
                    summary: 'No YouTube reviews found'
                };
            }

            // Get video statistics
            const videoIds = videos.map(v => v.id.videoId).join(',');
            const statsResponse = await axios.get(`${this.baseUrl}/videos`, {
                params: {
                    part: 'statistics,contentDetails',
                    id: videoIds,
                    key: this.apiKey
                }
            });

            const stats = statsResponse.data.items || [];

            // Combine video data with statistics
            const reviewVideos = videos.map((video, idx) => {
                const videoStats = stats.find(s => s.id === video.id.videoId);
                return {
                    title: video.snippet.title,
                    channelTitle: video.snippet.channelTitle,
                    videoId: video.id.videoId,
                    url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                    thumbnail: video.snippet.thumbnails.medium.url,
                    publishedAt: video.snippet.publishedAt,
                    viewCount: parseInt(videoStats?.statistics.viewCount || 0),
                    likeCount: parseInt(videoStats?.statistics.likeCount || 0),
                    commentCount: parseInt(videoStats?.statistics.commentCount || 0)
                };
            });

            // Calculate aggregate metrics
            const totalViews = reviewVideos.reduce((sum, v) => sum + v.viewCount, 0);
            const totalLikes = reviewVideos.reduce((sum, v) => sum + v.likeCount, 0);
            const avgViews = Math.round(totalViews / reviewVideos.length);

            // Try to get top comments from the most viewed video (optional, costs more quota)
            let topComments = [];
            try {
                const topVideoId = reviewVideos[0].videoId;
                const commentsResponse = await axios.get(`${this.baseUrl}/commentThreads`, {
                    params: {
                        part: 'snippet',
                        videoId: topVideoId,
                        maxResults: 5,
                        order: 'relevance',
                        key: this.apiKey
                    }
                });

                topComments = (commentsResponse.data.items || []).map(item => ({
                    author: item.snippet.topLevelComment.snippet.authorDisplayName,
                    text: item.snippet.topLevelComment.snippet.textDisplay,
                    likeCount: item.snippet.topLevelComment.snippet.likeCount,
                    publishedAt: item.snippet.topLevelComment.snippet.publishedAt
                }));
            } catch (error) {
                console.log('Could not fetch comments (may be disabled):', error.message);
            }

            return {
                source: 'youtube',
                available: true,
                videos: reviewVideos,
                topComments,
                metrics: {
                    totalVideos: reviewVideos.length,
                    totalViews,
                    totalLikes,
                    avgViews
                },
                summary: this._generateSummary(reviewVideos, totalViews, totalLikes)
            };
        } catch (error) {
            console.error('YouTube search error:', error.response?.data || error.message);
            return {
                source: 'youtube',
                available: false,
                error: 'Failed to fetch YouTube data',
                videos: [],
                summary: 'YouTube data unavailable'
            };
        }
    }

    /**
     * Generate a summary of YouTube reviews
     */
    _generateSummary(videos, totalViews, totalLikes) {
        if (videos.length === 0) {
            return 'No YouTube reviews found';
        }

        const topVideo = videos[0];
        return `${videos.length} review videos found with ${this._formatNumber(totalViews)} total views ` +
               `and ${this._formatNumber(totalLikes)} likes. Top review: "${topVideo.title}" ` +
               `by ${topVideo.channelTitle} (${this._formatNumber(topVideo.viewCount)} views).`;
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

module.exports = YouTubeSource;
