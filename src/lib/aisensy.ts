import axios from 'axios'
import { Lead, CampaignMessage } from '@prisma/client'

const AISENSY_API_KEY = process.env.AISENSY_API_KEY
const AISENSY_BASE_URL = 'https://backend.aisensy.com/campaign/t1/api/v2'

export async function sendWhatsAppMessage(lead: Lead, message: CampaignMessage) {
    if (!AISENSY_API_KEY) {
        console.warn('AISENSY_API_KEY is not set. Simulating message send.')
        return { success: true, simulated: true, timestamp: new Date() }
    }

    try {
        const payload: any = {
            apiKey: AISENSY_API_KEY,
            campaignName: process.env.AISENSY_CAMPAIGN_NAME || 'lead_nurturing_campaign',
            destination: lead.phone,
            userName: lead.name,
            templateParams: [lead.name],
        }

        if (message.imageUrl) {
            payload.media = {
                url: message.imageUrl,
                filename: message.imageUrl.split('/').pop() || 'image.jpg'
            }
        }

        if (message.buttons) {
            try {
                const buttons = JSON.parse(message.buttons)
                payload.buttonParams = { quickReplyButtons: buttons }
            } catch (e) {
                console.error('Invalid button JSON format:', e)
            }
        }

        console.log('Sending AI Sensy message to:', lead.phone, 'Campaign:', payload.campaignName)

        const response = await axios.post(AISENSY_BASE_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        })

        console.log('AI Sensy Response:', response.data)
        return { success: true, response: response.data }
    } catch (error: any) {
        console.error('AI Sensy API Error:', error.response?.data || error.message)
        throw new Error(error.response?.data?.message || error.message)
    }
}
