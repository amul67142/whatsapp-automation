import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/aisensy'

export const maxDuration = 300 // Set max duration for serverless function (Vercel)

export async function GET(request: Request) {
    try {
        // Basic security for manual cron trigger (if needed)
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const leads = await db.lead.findMany({
            where: {
                status: 'ACTIVE',
                currentDay: { lt: 7 },
                OR: [
                    { lastMessageSent: null },
                    // Check if it's been ~24 hours since the last message
                    { lastMessageSent: { lte: new Date(Date.now() - 23.5 * 60 * 60 * 1000) } }
                ]
            },
            include: {
                campaign: {
                    include: { messages: true }
                }
            }
        })

        const results = []

        for (const lead of leads) {
            if (!lead.campaign) continue

            const nextDay = lead.currentDay + 1
            const message = lead.campaign.messages.find((m: any) => m.dayNumber === nextDay)

            if (!message) continue

            try {
                const sendResult = await sendWhatsAppMessage(lead, message)

                const isCompleted = nextDay === 7

                await db.lead.update({
                    where: { id: lead.id },
                    data: {
                        currentDay: nextDay,
                        lastMessageSent: new Date(),
                        status: isCompleted ? 'COMPLETED' : 'ACTIVE'
                    }
                })

                await db.messageLog.create({
                    data: {
                        leadId: lead.id,
                        dayNumber: nextDay,
                        messageText: message.messageText,
                        sentAt: new Date()
                    }
                })

                results.push({ lead: lead.id, status: 'success', simulated: sendResult.simulated })
            } catch (error: any) {
                console.error(`Failed to send message to lead ${lead.id}:`, error)
                await db.messageLog.create({
                    data: {
                        leadId: lead.id,
                        dayNumber: nextDay,
                        messageText: `[ERROR] ${message.messageText}`,
                        sentAt: new Date(),
                        response: error.message
                    }
                })
                results.push({ lead: lead.id, status: 'error', reason: error.message })
            }
        }

        return NextResponse.json({ processed: leads.length, results })
    } catch (error) {
        console.error('Error in send-messages cron:', error)
        return NextResponse.json({ error: 'Failed to process messages' }, { status: 500 })
    }
}
