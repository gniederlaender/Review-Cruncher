import React, { useState } from 'react'
import '../styles/AnalysisSection.css'

interface AnalysisSectionProps {
    keyTakeaways?: { [key: string]: string[] }
    consensus?: string[]
    divergence?: string[]
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ keyTakeaways, consensus, divergence }) => {
    const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({})

    const toggleSource = (source: string) => {
        setExpandedSources(prev => ({
            ...prev,
            [source]: !prev[source]
        }))
    }

    const getSourceDisplayName = (key: string): string => {
        const names: { [key: string]: string } = {
            'reddit': '🗨️ Reddit',
            'youtube': '🎥 YouTube',
            'bestbuy': '⭐ Best Buy',
            'xtwitter': '𝕏 X/Twitter',
            'twitter': '𝕏 X/Twitter',
            'googlesearch': '📰 Google Search',
            'google': '📰 Google Search'
        }
        return names[key] || key
    }

    const hasContent = keyTakeaways && Object.keys(keyTakeaways).length > 0

    if (!hasContent && (!consensus || consensus.length === 0) && (!divergence || divergence.length === 0)) {
        return null
    }

    return (
        <div className="o-analysis-section">
            {/* Key Takeaways by Source */}
            {hasContent && (
                <div className="o-key-takeaways">
                    <h3>🔍 Key Takeaways by Source</h3>
                    <div className="o-takeaways-grid">
                        {Object.entries(keyTakeaways).map(([source, points]) => (
                            <div key={source} className="o-takeaway-card">
                                <div
                                    className="o-takeaway-header"
                                    onClick={() => toggleSource(source)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            toggleSource(source)
                                        }
                                    }}
                                >
                                    <span className="o-source-title">{getSourceDisplayName(source)}</span>
                                    <span className="o-expand-icon">
                                        {expandedSources[source] ? '▼' : '▶'}
                                    </span>
                                </div>
                                {expandedSources[source] && (
                                    <div className="o-takeaway-content">
                                        <ul>
                                            {points.map((point, idx) => (
                                                <li key={idx}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Consensus Section */}
            {consensus && consensus.length > 0 && (
                <div className="o-consensus-section">
                    <h3>✅ Where Sources Agree (Consensus)</h3>
                    <div className="o-consensus-box">
                        <ul>
                            {consensus.map((point, idx) => (
                                <li key={idx} className="o-consensus-point">{point}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Divergence Section */}
            {divergence && divergence.length > 0 && (
                <div className="o-divergence-section">
                    <h3>⚠️ Where Sources Disagree (Divergence)</h3>
                    <div className="o-divergence-box">
                        <ul>
                            {divergence.map((point, idx) => (
                                <li key={idx} className="o-divergence-point">{point}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AnalysisSection
