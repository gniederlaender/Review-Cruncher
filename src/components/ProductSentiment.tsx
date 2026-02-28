import React from 'react'
import { ScorecardItem } from '../resources/api-request'
import SentimentExpander from './SentimentExpander'
import '../styles/ProductSentiment.css'

interface ProductSentimentProps {
    overallSentiment: string
    scorecard: ScorecardItem[]
    consensus: string[]
    divergence: string[]
    keyTakeaways: { [key: string]: string[] }
}

const ProductSentiment: React.FC<ProductSentimentProps> = ({
    overallSentiment,
    scorecard,
    consensus,
    divergence,
    keyTakeaways
}) => {
    return (
        <div className="o-section o-product-sentiment">
            <h3 className="o-section-title">📊 Product Sentiment</h3>
            <div className="o-section-content">
                {/* Overall Sentiment with Expander */}
                <div className="o-area">
                    <SentimentExpander
                        overallSentiment={overallSentiment}
                        scorecard={scorecard}
                    />
                </div>

                {/* Where Sources Agree */}
                {consensus && consensus.length > 0 && (
                    <div className="o-area">
                        <h4 className="o-area-title">✅ Where Sources Agree</h4>
                        <div className="o-area-content">
                            <ul className="o-consensus-list">
                                {consensus.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Where Sources Disagree */}
                {divergence && divergence.length > 0 && (
                    <div className="o-area">
                        <h4 className="o-area-title">⚠️ Where Sources Disagree</h4>
                        <div className="o-area-content">
                            <ul className="o-divergence-list">
                                {divergence.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Key Takeaways by Platform */}
                {keyTakeaways && Object.keys(keyTakeaways).length > 0 && (
                    <div className="o-area">
                        <h4 className="o-area-title">🔑 Key Takeaways by Platform</h4>
                        <div className="o-area-content">
                            {Object.entries(keyTakeaways).map(([source, points]) => (
                                <div key={source} className="o-takeaway-source">
                                    <div className="o-takeaway-source-name">{getSourceDisplayName(source)}:</div>
                                    <ul className="o-takeaway-list">
                                        {points.map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Helper function to display source names consistently
const getSourceDisplayName = (source: string): string => {
    const nameMap: { [key: string]: string } = {
        'youtube': 'YouTube',
        'xtwitter': 'X/Twitter',
        'expertreviews': 'Expert Reviews',
        'googlesearch': 'Expert Reviews'
    }
    return nameMap[source] || source
}

export default ProductSentiment
