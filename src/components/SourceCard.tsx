import React, { useState } from 'react'
import '../styles/Components.sass'

interface SourceCardProps {
    source: any
    icon: string
    title: string
}

const SourceCard: React.FC<SourceCardProps> = ({ source, icon, title }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    if (!source || !source.available) {
        return (
            <div className="o-source-card o-source-card-unavailable">
                <div className="o-source-header">
                    <span className="o-source-icon">{icon}</span>
                    <span className="o-source-title">{title}</span>
                    <span className="o-unavailable-badge">Unavailable</span>
                </div>
            </div>
        )
    }

    return (
        <div className="o-source-card">
            <div className="o-source-header" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="o-source-icon">{icon}</span>
                <span className="o-source-title">{title}</span>
                <span className="o-expand-icon">{isExpanded ? '▼' : '▶'}</span>
            </div>

            {source.summary && (
                <div className="o-source-summary">
                    {source.summary}
                </div>
            )}

            {isExpanded && (
                <div className="o-source-details">
                    {/* Reddit-specific details */}
                    {source.source === 'reddit' && source.discussions && (
                        <div className="o-reddit-details">
                            <div className="o-metrics">
                                <span>Sentiment: <strong>{source.sentiment}</strong></span>
                                <span>Avg Score: <strong>{source.avgScore}</strong></span>
                                <span>Comments: <strong>{source.totalComments}</strong></span>
                            </div>
                            <div className="o-discussions">
                                <h4>Top Discussions:</h4>
                                {source.discussions.slice(0, 5).map((discussion: any, idx: number) => (
                                    <div key={idx} className="o-discussion-item">
                                        <a href={discussion.url} target="_blank" rel="noopener noreferrer">
                                            {discussion.title}
                                        </a>
                                        <div className="o-discussion-meta">
                                            r/{discussion.subreddit} • {discussion.score} upvotes • {discussion.numComments} comments
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* YouTube-specific details */}
                    {source.source === 'youtube' && source.videos && (
                        <div className="o-youtube-details">
                            {source.metrics && (
                                <div className="o-metrics">
                                    <span>Videos: <strong>{source.metrics.totalVideos}</strong></span>
                                    <span>Total Views: <strong>{formatNumber(source.metrics.totalViews)}</strong></span>
                                    <span>Total Likes: <strong>{formatNumber(source.metrics.totalLikes)}</strong></span>
                                </div>
                            )}
                            <div className="o-videos">
                                <h4>Top Review Videos:</h4>
                                {source.videos.slice(0, 5).map((video: any, idx: number) => (
                                    <div key={idx} className="o-video-item">
                                        <a href={video.url} target="_blank" rel="noopener noreferrer">
                                            {video.title}
                                        </a>
                                        <div className="o-video-meta">
                                            {video.channelTitle} • {formatNumber(video.viewCount)} views • {formatNumber(video.likeCount)} likes
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Best Buy-specific details */}
                    {source.source === 'bestbuy' && source.products && (
                        <div className="o-bestbuy-details">
                            {source.metrics && (
                                <div className="o-metrics">
                                    <span>Avg Rating: <strong>{source.metrics.avgRating}/5.0</strong></span>
                                    <span>Total Reviews: <strong>{source.metrics.totalReviews}</strong></span>
                                    <span>Sentiment: <strong>{source.sentiment}</strong></span>
                                </div>
                            )}
                            <div className="o-products">
                                <h4>Products Found:</h4>
                                {source.products.slice(0, 3).map((product: any, idx: number) => (
                                    <div key={idx} className="o-product-item">
                                        <a href={product.url} target="_blank" rel="noopener noreferrer">
                                            {product.name}
                                        </a>
                                        <div className="o-product-meta">
                                            ${product.price} • {product.avgRating}/5.0 ({product.reviewCount} reviews)
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {source.reviews && source.reviews.length > 0 && (
                                <div className="o-reviews">
                                    <h4>Sample Reviews:</h4>
                                    {source.reviews.slice(0, 3).map((review: any, idx: number) => (
                                        <div key={idx} className="o-review-item">
                                            <div className="o-review-rating">{'⭐'.repeat(review.rating)}</div>
                                            <div className="o-review-title">{review.title}</div>
                                            <div className="o-review-comment">{review.comment}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Twitter/X-specific details */}
                    {source.source === 'twitter' && source.tweets && (
                        <div className="o-twitter-details">
                            {source.metrics && (
                                <div className="o-metrics">
                                    <span>Tweets: <strong>{source.metrics.totalTweets}</strong></span>
                                    <span>Total Likes: <strong>{formatNumber(source.metrics.totalLikes)}</strong></span>
                                    <span>Verified: <strong>{source.metrics.verifiedCount}</strong></span>
                                    <span>Sentiment: <strong>{source.sentiment}</strong></span>
                                </div>
                            )}
                            <div className="o-tweets">
                                <h4>Top Tweets:</h4>
                                {source.tweets.slice(0, 5).map((tweet: any, idx: number) => (
                                    <div key={idx} className="o-tweet-item">
                                        <div className="o-tweet-header">
                                            <strong>{tweet.author}</strong> @{tweet.username}
                                            {tweet.verified && <span className="o-verified-badge"> ✓</span>}
                                        </div>
                                        <div className="o-tweet-text">{tweet.text}</div>
                                        <div className="o-tweet-meta">
                                            💙 {formatNumber(tweet.metrics.likes)} •
                                            🔁 {formatNumber(tweet.metrics.retweets)} •
                                            💬 {formatNumber(tweet.metrics.replies)}
                                            {tweet.url && (
                                                <> • <a href={tweet.url} target="_blank" rel="noopener noreferrer">View Tweet</a></>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Google Search-specific details */}
                    {source.source === 'google' && source.articles && (
                        <div className="o-google-details">
                            <div className="o-articles">
                                <h4>Articles & Reviews:</h4>
                                {source.articles.slice(0, 5).map((article: any, idx: number) => (
                                    <div key={idx} className="o-article-item">
                                        <a href={article.link} target="_blank" rel="noopener noreferrer">
                                            {article.title}
                                        </a>
                                        <div className="o-article-snippet">{article.snippet}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}

export default SourceCard
