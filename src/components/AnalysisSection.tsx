import React, { useState } from 'react'
import '../styles/AnalysisSection.css'

interface AnalysisSectionProps {
    keyTakeaways?: { [key: string]: string[] }
    consensus?: string[]
    divergence?: string[]
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ keyTakeaways, consensus, divergence }) => {
    // Start with all sources expanded for better visibility
    const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>(() => {
        const initial: { [key: string]: boolean } = {}
        if (keyTakeaways) {
            Object.keys(keyTakeaways).forEach(key => {
                initial[key] = true
            })
        }
        return initial
    })

    const toggleSource = (source: string) => {
        setExpandedSources(prev => ({
            ...prev,
            [source]: !prev[source]
        }))
    }

    const getSourceInfo = (key: string): { name: string; icon: string; color: string } => {
        const sources: { [key: string]: { name: string; icon: string; color: string } } = {
            'reddit': { name: 'Reddit', icon: '🗨️', color: '#ff4500' },
            'youtube': { name: 'YouTube', icon: '🎥', color: '#ff0000' },
            'bestbuy': { name: 'Best Buy', icon: '⭐', color: '#0046be' },
            'xtwitter': { name: 'X/Twitter', icon: '𝕏', color: '#000000' },
            'twitter': { name: 'X/Twitter', icon: '𝕏', color: '#000000' },
            'googlesearch': { name: 'Google Search', icon: '📰', color: '#4285f4' },
            'google': { name: 'Google Search', icon: '📰', color: '#4285f4' }
        }
        return sources[key] || { name: key, icon: '📊', color: '#6c757d' }
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
                        {Object.entries(keyTakeaways).map(([source, points]) => {
                            const sourceInfo = getSourceInfo(source)
                            return (
                                <div key={source} className="o-takeaway-card" style={{ borderLeftColor: sourceInfo.color }}>
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
                                        <span className="o-source-badge" style={{ backgroundColor: sourceInfo.color }}>
                                            {sourceInfo.icon} {sourceInfo.name}
                                        </span>
                                        <span className="o-expand-icon">
                                            {expandedSources[source] !== false ? '▼' : '▶'}
                                        </span>
                                    </div>
                                    {expandedSources[source] !== false && (
                                        <div className="o-takeaway-content">
                                            <ul>
                                                {points.map((point, idx) => (
                                                    <li key={idx}>{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
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
