import React, { useState, useEffect } from 'react'
import { sendProductAndSearchRequest, sendEmail, fetchRecentReviews, extractProductFromURL, ScorecardItem } from '../resources/api-request'
import SourceCard from '../components/SourceCard'
import ProductSnapshot from '../components/ProductSnapshot'
import ProductSentiment from '../components/ProductSentiment'
import FinalSynthesis from '../components/FinalSynthesis'
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
     * Helper function to check if input is a URL
     */
    const isURL = (input: string): boolean => {
        try {
            const url = new URL(input)
            return url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
            return false
        }
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

            let productName = product

            // Check if input is a URL
            if (isURL(product)) {
                const extractionResult = await extractProductFromURL(product)

                if (extractionResult.success && extractionResult.productName) {
                    productName = extractionResult.productName
                    setProduct(productName) // Update the product field with extracted name
                } else {
                    // Show error message if extraction failed
                    setIsLoading(false)
                    setErrorMessage(extractionResult.error || 'Could not extract product name from URL. Please enter the product name manually.')
                    return
                }
            }

            const result = await sendProductAndSearchRequest('', productName, 'gpt-4.1', email, expectations)

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

    /**
     * Extract product name from markdown text
     */
    const extractProductName = (text: string): string => {
        const match = text.match(/\*\*Product Name\*\*\s*\n*\s*([^\n]+)/i)
        return match ? match[1].trim() : product
    }

    /**
     * Extract price range from markdown text
     */
    const extractPriceRange = (text: string): string => {
        const match = text.match(/\*\*Price Range:\*\*\s*([^\n]+)/i)
        return match ? match[1].trim() : ''
    }

    /**
     * Extract product alternatives from markdown text
     */
    const extractAlternatives = (text: string): string[] => {
        const alternatives: string[] = []
        const match = text.match(/\*\*Product Alternatives:\*\*\s*\n*([\s\S]*?)(?=\*\*Recommendation:|$)/i)

        if (match) {
            const altText = match[1]
            const lines = altText.split('\n').filter(line => line.trim().match(/^\d+\.\s+\*\*/))
            lines.forEach(line => {
                // Extract the full alternative text including description
                const cleaned = line.replace(/^\d+\.\s+/, '').trim()
                if (cleaned) alternatives.push(cleaned)
            })
        }
        return alternatives
    }

    /**
     * Extract overall sentiment from markdown text
     */
    const extractOverallSentiment = (text: string): string | null => {
        const match = text.match(/\*\*Overall Sentiment:\*\*\s*([^\n]+)/i)
        return match ? match[1].trim() : null
    }

    /**
     * Extract recommendation text from markdown
     */
    const extractRecommendation = (text: string): string => {
        const match = text.match(/\*\*Recommendation:\*\*\s*([\s\S]*?)(?=\*\*Confidence Level:|$)/i)
        return match ? match[1].trim() : ''
    }

    /**
     * Extract confidence level from markdown
     */
    const extractConfidenceLevel = (text: string): string => {
        const match = text.match(/\*\*Confidence Level:\*\*\s*([^\n]+)/i)
        return match ? match[1].trim() : ''
    }

    // Extract all parts from finalResponse
    const productName = extractProductName(finalResponse)
    const priceRange = extractPriceRange(finalResponse)
    const alternatives = extractAlternatives(finalResponse)
    const overallSentiment = extractOverallSentiment(finalResponse)
    const recommendation = extractRecommendation(finalResponse)
    const confidenceLevel = extractConfidenceLevel(finalResponse)

    return (
        <div className="o-page-container">
            <div className="o-claim-banner">
                Skip the Research. <span>Get the Verdict.</span>
            </div>
            <div className="o-pitch-banner">
                Not sure what to buy?<br />
                <strong>ReviewCruncher</strong> gives you fast, AI-powered product recommendations before you commit.
            </div>
            <div className="o-social-proof">
                <span>✅ {recentReviews.length > 0 ? recentReviews.length * 47 : 100}+ products analyzed</span>
                <span className="o-source-badges">📊 Sources: YouTube • Twitter/X • Google</span>
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
                                Get My Recommendation
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

                        {/* Section 1: Product Snapshot */}
                        <ProductSnapshot
                            productName={productName}
                            priceRange={priceRange}
                            alternatives={alternatives}
                        />

                        {/* Section 2: Product Sentiment */}
                        {overallSentiment && (
                            <ProductSentiment
                                overallSentiment={overallSentiment}
                                scorecard={scorecard.filter(s => s.available)}
                                consensus={consensus}
                                divergence={divergence}
                                keyTakeaways={keyTakeaways}
                            />
                        )}

                        {/* Section 3: Final Synthesis */}
                        {recommendation && (
                            <FinalSynthesis
                                recommendation={recommendation}
                                confidenceLevel={confidenceLevel}
                            />
                        )}
                        {/* Section 4: Data Sources */}
                        {sources && (
                            <div className="o-section o-data-sources">
                                <h3 className="o-section-title">📚 Data Sources</h3>
                                <div className="o-section-content">
                                    <div className="o-sources-grid">
                                        <SourceCard
                                            source={sources.youtube}
                                            icon="🎥"
                                            title="YouTube Reviews"
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
