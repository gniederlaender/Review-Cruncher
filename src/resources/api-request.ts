import { AxiosResponse } from 'axios'
import CustomAxios from '../utility/customAxios'

type APIResponse = AxiosResponse
interface ResponseObject {
    responseMessage: string
    reason?: string
}

const sendCompletionURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/recommend'

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
