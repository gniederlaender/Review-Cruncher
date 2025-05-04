import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { sendProductAndSearchRequest, sendEmail, fetchRecentReviews } from '../resources/api-request'
import { jsPDF } from 'jspdf'
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
     * Generates and downloads a PDF report of the response
     */
    const generatePDF = () => {
        const doc = new jsPDF()
        
        // Add title
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('Review Cruncher Report', 20, 20)
        
        // Add product name
        doc.setFontSize(16)
        doc.text(`Product: ${product}`, 20, 35)
        
        // Add timestamp
        const date = new Date().toLocaleString()
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`Generated on: ${date}`, 20, 45)
        
        // Add response content
        doc.setFontSize(12)
        const splitText = doc.splitTextToSize(finalResponse, 170) // Wrap text at 170 units
        doc.text(splitText, 20, 60)
        
        // Add search results if available
        if (searchResults.length > 0) {
            // Add a new page if needed
            const currentY = 60 + splitText.length * 7
            if (currentY > 250) {
                doc.addPage()
            }
            
            // Add search results section
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('Top YouTube Review Videos', 20, currentY + 20)
            
            doc.setFontSize(12)
            doc.setFont('helvetica', 'normal')
            let yPos = currentY + 35
            
            searchResults.forEach((result, index) => {
                if (yPos > 250) {
                    doc.addPage()
                    yPos = 20
                }
                
                // Add video title
                doc.setFont('helvetica', 'bold')
                doc.text(`${index + 1}. ${result.title}`, 20, yPos)
                
                // Add video link
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(0, 0, 255) // Blue color for links
                doc.text(result.link, 20, yPos + 7)
                doc.setTextColor(0, 0, 0) // Reset color
                
                // Add video description
                const description = doc.splitTextToSize(result.snippet, 170)
                doc.text(description, 20, yPos + 14)
                
                yPos += 35 + (description.length * 7)
            })
        }
        
        // Save the PDF
        doc.save(`review-cruncher-${product.toLowerCase().replace(/\s+/g, '-')}.pdf`)
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
                Before deciding to buy - <span>Ask Review Cruncher.</span>
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
                                className="u-button o-pdf-button" 
                                onClick={generatePDF}
                            >
                                Download PDF report
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
                    <div className="o-response-container">
                        <ReactMarkdown>{finalResponse}</ReactMarkdown>
                        </div>
                    </div>
                )}
                {emailSuccess && (
                    <p className="o-success-text-container">
                        {emailSuccess}
                    </p>
                )}
                {searchResults.length > 0 && (
                    <div className="o-search-results">
                        <h3>Live Google Search Results</h3>
                        <ul>
                            {searchResults.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '1em' }}>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#2563eb' }}>
                                        {item.title}
                                    </a>
                                    <p style={{ margin: 0 }}>{item.snippet}</p>
                                </li>
                            ))}
                        </ul>
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
