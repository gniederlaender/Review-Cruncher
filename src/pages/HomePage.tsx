import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Header from '../components/Header'
import { sendCompletionRequest } from '../resources/api-request'
import '../styles/HomePage.css'

const HomePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [lengthIssueText, setLengthIssueText] = useState('')
    const [product, setProduct] = useState('')
    const [email, setEmail] = useState('')
    const [finalResponse, setFinalResponse] = useState('')

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
            const completionResponse = await sendCompletionRequest('', product, 'gpt-4.1', email)

            // Error management
            if (completionResponse.error) {
                throw new Error(completionResponse.error.message || 'Something went wrong with the request')
            }

            // Success management
            if (completionResponse.response) {
                if (!completionResponse.response.responseMessage) {
                    throw new Error('System was unable to satisfy your request, please retry.')
                }
                if (completionResponse.response.reason && completionResponse.response.reason === 'length') {
                    setLengthIssueText(`This completion was interrupted because it was limited to 600 characters.`)
                }
                setFinalResponse(completionResponse.response.responseMessage)
            }
        } catch (error: any) {
            console.error(error)
            setErrorMessage(error.message)
        }
        setIsLoading(false)
    }

    return (
        <div className="o-page-container">
            <Header />
            <div className="o-main-page-container">
                <div className="u-input-row">
                    <p>Which product would you like to review?</p>
                    <input
                        role="textbox"
                        className="o-product-input"
                        placeholder="Enter product name..."
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
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
                        <button role="button" disabled={isLoading || !dataIsValid()} className="u-button o-action-button" onClick={() => void sendRequest()}>
                            Provide an alternative and comparison
                        </button>
                        {isLoading && <span className="o-loading-text">... loading</span>}
                    </div>
                    {finalResponse && (
                        <button role="button" className="u-button o-ghost-button" onClick={() => navigator.clipboard.writeText(finalResponse)}>
                            Copy
                        </button>
                    )}
                </div>
                {errorMessage && (
                    <p data-testid="errorTextContainer" className="o-error-text-container">
                        {errorMessage}
                    </p>
                )}
                {finalResponse && (
                    <div className="o-response-container">
                        <ReactMarkdown>{finalResponse}</ReactMarkdown>
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
