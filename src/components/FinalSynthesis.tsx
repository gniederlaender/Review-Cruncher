import React from 'react'
import ReactMarkdown from 'react-markdown'
import '../styles/FinalSynthesis.css'

interface FinalSynthesisProps {
    recommendation: string
    confidenceLevel: string
}

const FinalSynthesis: React.FC<FinalSynthesisProps> = ({ recommendation, confidenceLevel }) => {
    return (
        <div className="o-section o-final-synthesis">
            <h3 className="o-section-title">🎯 Final Synthesis</h3>
            <div className="o-section-content">
                <div className="o-recommendation-content">
                    <ReactMarkdown
                        components={{
                            a: (props) => (
                                <a href={props.href} target="_blank" rel="noopener noreferrer">
                                    {props.children}
                                </a>
                            ),
                            p: (props) => <p className="o-synthesis-paragraph">{props.children}</p>
                        }}
                    >
                        {recommendation}
                    </ReactMarkdown>
                </div>

                {confidenceLevel && (
                    <div className="o-confidence-level">
                        <span className="o-confidence-label">Confidence Level:</span>
                        <span className={`o-confidence-value o-confidence-${confidenceLevel.toLowerCase()}`}>
                            {confidenceLevel}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FinalSynthesis
