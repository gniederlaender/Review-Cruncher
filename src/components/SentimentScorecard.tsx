import React from 'react'
import { ScorecardItem } from '../resources/api-request'
import '../styles/SentimentScorecard.css'

interface SentimentScorecardProps {
    scorecard: ScorecardItem[]
}

const SentimentScorecard: React.FC<SentimentScorecardProps> = ({ scorecard }) => {
    const getScoreColor = (score: number | null): string => {
        if (score === null) return 'grey'
        if (score >= 2) return 'green'
        if (score >= -1) return 'yellow'
        return 'red'
    }

    const getScoreBarWidth = (score: number | null): number => {
        if (score === null) return 0
        // Map -5 to +5 scale to 0% to 100%
        return ((score + 5) / 10) * 100
    }

    const getSourceIcon = (source: string): string => {
        const icons: { [key: string]: string } = {
            'reddit': '🗨️',
            'youtube': '🎥',
            'bestbuy': '⭐',
            'twitter': '𝕏',
            'google': '📰'
        }
        return icons[source] || '📊'
    }

    const formatSampleSize = (size: number, unit: string): string => {
        if (size === 0) return 'no data'
        if (size >= 1000) {
            return `${(size / 1000).toFixed(1)}K ${unit}`
        }
        return `${size} ${unit}`
    }

    return (
        <div className="o-sentiment-scorecard">
            <h3>📊 Source Sentiment Overview</h3>
            <div className="o-scorecard-grid">
                {scorecard.map((item) => (
                    <div
                        key={item.source}
                        className={`o-scorecard-item ${!item.available ? 'unavailable' : ''}`}
                    >
                        <div className="o-scorecard-header">
                            <span className="o-source-icon">{getSourceIcon(item.source)}</span>
                            <span className="o-source-name">{item.name}</span>
                        </div>
                        <div className="o-scorecard-body">
                            {item.available && item.score !== null && item.score !== undefined ? (
                                <>
                                    <div className="o-score-bar-container">
                                        <div
                                            className={`o-score-bar ${getScoreColor(item.score)}`}
                                            style={{ width: `${Math.max(10, getScoreBarWidth(item.score))}%` }}
                                        >
                                            <span className="o-score-value">
                                                {item.score > 0 ? '+' : ''}{item.score.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="o-sample-size">
                                        {formatSampleSize(item.sampleSize, item.unit)}
                                    </div>
                                </>
                            ) : item.available ? (
                                <div className="o-no-score-available">
                                    <span className="o-available-badge">✓ Available</span>
                                    <div className="o-sample-size">
                                        {formatSampleSize(item.sampleSize, item.unit)}
                                    </div>
                                </div>
                            ) : (
                                <div className="o-no-data">
                                    no data available
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SentimentScorecard
