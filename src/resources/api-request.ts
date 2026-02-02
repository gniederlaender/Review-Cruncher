import { AxiosResponse } from 'axios'
import CustomAxios from '../utility/customAxios'

type APIResponse = AxiosResponse

export interface ScorecardItem {
    source: string
    name: string
    score: number | null
    sampleSize: number
    unit: string
    available: boolean
}

interface ResponseObject {
    responseMessage: string
    reason?: string
    sourcesUsed?: string[]
    scorecard?: ScorecardItem[]
    keyTakeaways?: { [key: string]: string[] }
    consensus?: string[]
    divergence?: string[]
}

interface CombinedResponseData {
    error?: any
    recommendation?: ResponseObject
    search?: any[]
    sources?: any
}

const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'

const sendCompletionURL = `${baseURL}/recommend`
const sendSearchURL = `${baseURL}/search`
const sendCombinedURL = `${baseURL}/combined`
const sendEmailURL = `${baseURL}/send-email`
const recentReviewsURL = `${baseURL}/recent-reviews`

export const sendCompletionRequest = async (userToken: string, request: string, selectedModel: string, email: string): Promise<{ error?: any; response?: ResponseObject }> => {
    try {
        const res = await CustomAxios.post(sendCompletionURL, { 
            product: request,
            email: email 
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }).then((response: APIResponse) => {
            console.log(response.data)
            return response.data
        })
        console.log(res)
        return res
    } catch (error: any) {
        console.error('API Error:', error);
        return { error: error.response?.data || error.message }
    }
}

export const sendProductAndSearchRequest = async (
  userToken: string,
  request: string,
  selectedModel: string,
  email: string,
  expectations?: string
): Promise<CombinedResponseData> => {
  try {
    const response = await CustomAxios.post(sendCombinedURL, {
      product: request,
      email: email,
      expectations: expectations || ''
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    return {
      recommendation: response.data.recommendation,
      search: response.data.search,
      sources: response.data.sources
    }
  } catch (error: any) {
    return { error: error.response?.data || error.message }
  }
}

export const sendEmail = async (
    product: string,
    email: string,
    recommendation: string,
    searchResults: any[]
): Promise<{ error?: any; success?: boolean }> => {
    try {
        console.log('Sending email request with:', {
            product,
            email,
            recommendationLength: recommendation.length,
            searchResultsCount: searchResults.length,
            searchResults
        });

        const requestData = {
            product,
            email,
            recommendation,
            searchResults: searchResults.map(result => ({
                title: result.title,
                link: result.link,
                snippet: result.snippet
            }))
        };

        console.log('Formatted request data:', requestData);

        const response = await CustomAxios.post(sendEmailURL, requestData, {
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json' 
            }
        });
        
        console.log('Email response:', response.data);
        return { success: response.data.success }
    } catch (error: any) {
        console.error('Email request error:', error);
        return { error: error.response?.data || error.message }
    }
}

export const fetchRecentReviews = async (): Promise<{ error?: any; reviews?: any[] }> => {
    try {
        const response = await CustomAxios.get(recentReviewsURL, {
            headers: { 'Accept': 'application/json' }
        });
        return { reviews: response.data.reviews };
    } catch (error: any) {
        console.error('Error fetching recent reviews:', error);
        return { error: error.response?.data || error.message };
    }
}
