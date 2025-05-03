import { AxiosResponse } from 'axios'
import CustomAxios from '../utility/customAxios'

type APIResponse = AxiosResponse
interface ResponseObject {
    responseMessage: string
    reason?: string
}

const sendCompletionURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/recommend'
const sendSearchURL = process.env.REACT_APP_API_SEARCH_URL || 'http://localhost:5000/api/search'
const sendCombinedURL = process.env.REACT_APP_API_COMBINED_URL || 'http://localhost:5000/api/combined'
const sendEmailURL = process.env.REACT_APP_API_EMAIL_URL || 'http://localhost:5000/api/send-email'

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
  email: string
): Promise<{ error?: any; recommendation?: ResponseObject; search?: any[] }> => {
  try {
    const response = await CustomAxios.post(sendCombinedURL, { 
      product: request,
      email: email 
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    return {
      recommendation: response.data.recommendation,
      search: response.data.search
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
