import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { sendProductAndSearchRequest, sendEmail, fetchRecentReviews, ScorecardItem } from '../resources/api-request'
import SourceCard from '../components/SourceCard'
import SentimentScorecard from '../components/SentimentScorecard'
import AnalysisSection from '../components/AnalysisSection'
import '../styles/HomePage.css'

const HomePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [emailSuccess, setEmailSuccess] = useState('')
    const [lengthIssueText, setLengthIssueText] = useState('')
    const [product, setProduct] = useState('')
    const [email, setEmail] = useState('')
    const [expectations, setExpectations] = useState('')
    const [finalResponse, setFinalResponse] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [recentReviews, setRecentReviews] = useState<any[]>([])
    const [sources, setSources] = useState<any>(null)
    const [sourcesUsed, setSourcesUsed] = useState<string[]>([])
    const [scorecard, setScorecard] = useState<ScorecardItem[]>([])
    const [keyTakeaways, setKeyTakeaways] = useState<{ [key: string]: string[] }>({})
    const [consensus, setConsensus] = useState<string[]>([])
    const [divergence, setDivergence] = useState<string[]>([])

    useEffect(() => {
        const loadRecentReviews = async () => {
            const result = await fetchRecentReviews()
            if (result.reviews) {
                setRecentReviews(result.reviews)
            }
        }
        void loadRecentReviews()
    }, [])

    /**
     * Checks for validity in user's entered data
     * @returns flag that indicates that entered data is valid
     */
    const dataIsValid = (): boolean => {
        return product !== '' && email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    /**
     * Sends the request to OpenAI completion API.
     */
    const sendRequest = async (): Promise<void> => {
        try {
            setIsLoading(true)
            setErrorMessage('')
            setLengthIssueText('')
            setSearchResults([])
            setSources(null)
            setSourcesUsed([])
            setScorecard([])
            setKeyTakeaways({})
            setConsensus([])
            setDivergence([])

            const result = await sendProductAndSearchRequest('', product, 'gpt-4.1', email, expectations)

            if (result.error) throw new Error(result.error.message || 'Something went wrong with the request')

            if (result.recommendation) {
                setFinalResponse(result.recommendation.responseMessage)
                if (result.recommendation.sourcesUsed) {
                    setSourcesUsed(result.recommendation.sourcesUsed)
                }
                if (result.recommendation.scorecard) {
                    setScorecard(result.recommendation.scorecard)
                }
                if (result.recommendation.keyTakeaways) {
                    setKeyTakeaways(result.recommendation.keyTakeaways)
                }
                if (result.recommendation.consensus) {
                    setConsensus(result.recommendation.consensus)
                }
                if (result.recommendation.divergence) {
                    setDivergence(result.recommendation.divergence)
                }
            }
            if (result.search) {
                console.log('Received search results:', result.search);
                setSearchResults(result.search)
            }
            if (result.sources) {
                console.log('Received sources:', result.sources);
                setSources(result.sources)
            }
        } catch (error: any) {
            setErrorMessage(error.message)
        }
        setIsLoading(false)
    }

    /**
     * Sends the report via email
     */
    const handleSendEmail = async () => {
        try {
            setIsSendingEmail(true)
            setErrorMessage('')
            setEmailSuccess('')

            console.log('Sending email with search results:', {
                product,
                email,
                finalResponseLength: finalResponse.length,
                searchResultsCount: searchResults.length,
                searchResults
            });

            const result = await sendEmail(product, email, finalResponse, searchResults)

            if (result.error) throw new Error(result.error.message || 'Failed to send email')
            
            setEmailSuccess('Email sent successfully!')
        } catch (error: any) {
            setErrorMessage(error.message)
        }
        setIsSendingEmail(false)
    }

    /**
     * Handles form submission
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (dataIsValid()) {
            void sendRequest()
        }
    }

    return (
        <div className="o-page-container">
            <div className="o-claim-banner">
                Before you buy - <span>Ask Review Cruncher.</span>
            </div>
            <div className="o-pitch-banner">
                Not sure what to buy?<br />
                <strong>ReviewCruncher</strong> gives you fast, AI-powered product recommendations before you commit.
            </div>
            <div className="o-main-page-container">
                <form onSubmit={handleSubmit}>
                    <div className="u-input-row u-input-row-product">
                        <p>Which are you planning to buy?</p>
                        <input
                            role="textbox"
                            className="o-product-input"
                            placeholder="Enter product..."
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                        />
                    </div>
                    {recentReviews.length > 0 && (
                        <div className="o-recent-reviews">
                            <div className="o-recent-reviews-chips">
                                <span className="o-recent-reviews-label">Recent searches:</span>
                                {recentReviews.map((review, idx) => (
                                    <span
                                        key={idx}
                                        className="o-chip"
                                        onClick={() => setProduct(review.product)}
                                        title={review.response?.responseMessage?.slice(0, 100) || ''}
                                    >
                                        {review.product}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="u-input-row">
                        <p>What do you expect from the product?<br />What is important for you?</p>
                        <input
                            role="textbox"
                            className="o-product-input"
                            placeholder="Enter expectations (optional)..."
                            value={expectations}
                            onChange={(e) => setExpectations(e.target.value)}
                        />
                    </div>
                    <div className="u-input-row">
                        <p>Your email address:</p>
                        <input
                            type="email"
                            role="textbox"
                            className="o-product-input"
                            placeholder="Enter your email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="o-main-actions-container">
                        <div className="u-input-row">
                            <button 
                                type="submit"
                                role="button" 
                                disabled={isLoading || !dataIsValid()} 
                                className="u-button o-action-button"
                            >
                                Recommend Product
                            </button>
                            {isLoading && <span className="o-loading-text">... loading</span>}
                        </div>
                    </div>
                </form>
                {errorMessage && (
                    <p data-testid="errorTextContainer" className="o-error-text-container">
                        {errorMessage}
                    </p>
                )}
                {finalResponse && (
                    <div className="o-response-wrapper">
                        <div className="o-action-buttons">
                            <button
                                role="button"
                                className="u-button o-copy-button"
                                onClick={() => navigator.clipboard.writeText(finalResponse)}
                            >
                                Copy
                            </button>
                            <button
                                role="button"
                                className="u-button o-email-button"
                                onClick={handleSendEmail}
                                disabled={isSendingEmail}
                            >
                                {isSendingEmail ? 'Sending...' : 'Send via Email'}
                            </button>
                        </div>
                        {emailSuccess && (
                            <p className="o-success-text-container">
                                {emailSuccess}
                            </p>
                        )}
                        {sourcesUsed.length > 0 && (
                            <div className="o-sources-badge">
                                <strong>Sources analyzed:</strong> {sourcesUsed.join(', ')}
                            </div>
                        )}

                        {/* Section 1: Sentiment Scorecard */}
                        {scorecard.length > 0 && (
                            <SentimentScorecard scorecard={scorecard} />
                        )}

                        {/* Section 2 & 3: Key Takeaways, Consensus, Divergence */}
                        <AnalysisSection
                            keyTakeaways={keyTakeaways}
                            consensus={consensus}
                            divergence={divergence}
                        />

                        {/* Section 4: Final Synthesis */}
                        <div className="o-response-container">
                            <h3>📋 Final Synthesis</h3>
                            <ReactMarkdown
                                components={{
                                    a: (props) => (
                                        <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
                                    )
                                }}
                            >{finalResponse}</ReactMarkdown>
                        </div>
                        {sources && (
                            <div className="o-sources-container">
                                <h3>Data Sources</h3>
                                <div className="o-sources-grid">
                                    <SourceCard
                                        source={sources.reddit}
                                        icon="🗨️"
                                        title="Reddit Discussions"
                                    />
                                    <SourceCard
                                        source={sources.youtube}
                                        icon="🎥"
                                        title="YouTube Reviews"
                                    />
                                    <SourceCard
                                        source={sources.bestbuy}
                                        icon="⭐"
                                        title="Best Buy Reviews"
                                    />
                                    <SourceCard
                                        source={sources.twitter}
                                        icon="𝕏"
                                        title="X (Twitter) Opinions"
                                    />
                                    <SourceCard
                                        source={sources.google}
                                        icon="📰"
                                        title="Expert Reviews"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {lengthIssueText && (
                    <p data-testid="lengthIssueTextContainer" className="o-subtitle-info-text">
                        {lengthIssueText}
                    </p>
                )}
            </div>
        </div>
    )
}

export default HomePage
