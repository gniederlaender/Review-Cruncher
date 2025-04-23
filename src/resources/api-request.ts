import { AxiosResponse } from 'axios'
import CustomAxios from '../utility/customAxios'

type APIResponse = AxiosResponse
interface ResponseObject {
    responseMessage: string
    reason?: string
}

const sendCompletionURL = 'http://localhost:5000/api/recommend'

export const sendCompletionRequest = async (userToken: string, request: string, selectedModel: string, email: string): Promise<{ error?: any; response?: ResponseObject }> => {
    try {
        const res = await CustomAxios.post(sendCompletionURL, { 
            product: request,
            email: email 
        }).then((response: APIResponse) => {
            return response.data
        })
        return res
    } catch (error: any) {
        return { error }
    }
}
