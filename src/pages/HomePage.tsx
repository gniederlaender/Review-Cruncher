import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { sendProductAndSearchRequest, sendEmail, fetchRecentReviews } from '../resources/api-request'
import '../styles/HomePage.css'

const HomePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [emailSuccess, setEmailSuccess] = useState('')
    const [lengthIssueText, setLengthIssueText] = useState('')
    const [product, setProduct] = useState('')
    const [email, setEmail] = useState('')
    const [finalResponse, setFinalResponse] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [recentReviews, setRecentReviews] = useState<any[]>([])

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

            const result = await sendProductAndSearchRequest('', product, 'gpt-4.1', email)

            if (result.error) throw new Error(result.error.message || 'Something went wrong with the request')

            if (result.recommendation) {
                setFinalResponse(result.recommendation.responseMessage)
            }
            if (result.search) {
                console.log('Received search results:', result.search);
                setSearchResults(result.search)
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
            <div className="o-main-page-container">
                <form onSubmit={handleSubmit}>
                    <div className="u-input-row u-input-row-product">
                        <p>Which product would you like to review?</p>
                        <input
                            role="textbox"
                            className="o-product-input"
                            placeholder="Enter product name..."
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
                                Provide a Product review
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
                        <div className="o-response-container">
                            <ReactMarkdown
                                components={{
                                    a: (props) => (
                                        <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
                                    )
                                }}
                            >{finalResponse}</ReactMarkdown>
                        </div>
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
