import React, { useState } from 'react'
import { ScorecardItem } from '../resources/api-request'
import '../styles/SentimentExpander.css'

interface SentimentExpanderProps {
    overallSentiment: string
    scorecard: ScorecardItem[]
}

const SentimentExpander: React.FC<SentimentExpanderProps> = ({ overallSentiment, scorecard }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    // Filter and map scorecard data for visualization
    const sourcesWithScores = scorecard.filter(item => item.available && item.score !== null)

    // Calculate sentiment color based on score (-5 to +5 scale)
    const getSentimentColor = (score: number): string => {
        if (score >= 3) return '#22c55e' // Green - positive
        if (score >= 1) return '#84cc16' // Light green - somewhat positive
        if (score >= -1) return '#eab308' // Yellow - neutral/mixed
        if (score >= -3) return '#f97316' // Orange - somewhat negative
        return '#ef4444' // Red - negative
    }

    // Convert score to percentage for bar width (map -5 to +5 to 0% to 100%)
    const scoreToPercentage = (score: number): number => {
        return ((score + 5) / 10) * 100
    }

    // Get sentiment label from score
    const getSentimentLabel = (score: number): string => {
        if (score >= 3) return 'Positive'
        if (score >= 1) return 'Somewhat Positive'
        if (score >= -1) return 'Mixed/Neutral'
        if (score >= -3) return 'Somewhat Negative'
        return 'Negative'
    }

    return (
        <div className="o-sentiment-expander">
            <div className="o-sentiment-header">
                <strong>Overall Sentiment:</strong> {overallSentiment}
                {sourcesWithScores.length > 0 && (
                    <button
                        className="o-expand-button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Show source sentiment breakdown"
                    >
                        <span className="o-expand-icon">
                            {isExpanded ? '➖' : '➕'}
                        </span>
                    </button>
                )}
            </div>

            {isExpanded && sourcesWithScores.length > 0 && (
                <div className="o-sentiment-breakdown">
                    <h4>📊 Product Sentiment by Platform</h4>
                    <div className="o-sentiment-chart">
                        {sourcesWithScores.map((item, idx) => (
                            <div key={idx} className="o-sentiment-bar-container">
                                <div className="o-sentiment-source-label">
                                    <span className="o-source-name">{item.name}</span>
                                    <span className="o-source-sample">
                                        ({item.sampleSize} {item.unit})
                                    </span>
                                </div>
                                <div className="o-sentiment-bar-wrapper">
                                    <div className="o-sentiment-bar-track">
                                        <div className="o-sentiment-bar-center-line" />
                                        <div
                                            className="o-sentiment-bar-fill"
                                            style={{
                                                width: `${scoreToPercentage(item.score!)}%`,
                                                backgroundColor: getSentimentColor(item.score!)
                                            }}
                                        />
                                    </div>
                                    <div className="o-sentiment-bar-labels">
                                        <span className="o-label-negative">Negative</span>
                                        <span className="o-label-neutral">Neutral</span>
                                        <span className="o-label-positive">Positive</span>
                                    </div>
                                </div>
                                <div className="o-sentiment-score">
                                    <span className="o-score-value" style={{ color: getSentimentColor(item.score!) }}>
                                        {item.score! > 0 ? '+' : ''}{item.score!.toFixed(1)}
                                    </span>
                                    <span className="o-score-label">{getSentimentLabel(item.score!)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {sourcesWithScores.length === 0 && (
                        <p className="o-no-sentiment-data">
                            No sentiment scores available from sources.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

export default SentimentExpander
