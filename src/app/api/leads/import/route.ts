import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/aisensy'

export async function POST(request: Request) {
    try {
        const { leads, campaignId } = await request.json()

        if (!Array.isArray(leads) || leads.length === 0) {
            return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
        }

        // Fetch campaign with Day 1 message if campaignId is provided
        let day1Message: any = null
        if (campaignId) {
            const campaign = await db.campaign.findUnique({
                where: { id: campaignId },
                include: { messages: true }
            })
            if (campaign) {
                day1Message = campaign.messages.find(m => m.dayNumber === 1)
            }
        }

        let successCount = 0
        let errors: any[] = []

        for (const lead of leads) {
            if (!lead.name || !lead.phone) {
                errors.push({ lead, error: 'Name and phone are required' })
                continue
            }

            const sanitizedPhone = lead.phone.toString().replace(/\D/g, '')
            if (sanitizedPhone.length < 10) {
                errors.push({ lead, error: 'Invalid phone format' })
                continue
            }

            try {
                const savedLead = await db.lead.upsert({
                    where: { phone: sanitizedPhone },
                    update: {
                        name: lead.name,
                        email: lead.email || null,
                        campaignId: campaignId || null,
                        status: 'ACTIVE',
                        currentDay: 0,
                        lastMessageSent: null
                    },
                    create: {
                        name: lead.name,
                        phone: sanitizedPhone,
                        email: lead.email || null,
                        campaignId: campaignId || null,
                    }
                })

                // Auto-send Day 1 message if campaign is assigned and has Day 1
                if (campaignId && day1Message) {
                    try {
                        await sendWhatsAppMessage(savedLead, day1Message)

                        await db.lead.update({
                            where: { id: savedLead.id },
                            data: {
                                currentDay: 1,
                                lastMessageSent: new Date(),
                            }
                        })

                        await db.messageLog.create({
                            data: {
                                leadId: savedLead.id,
                                dayNumber: 1,
                                messageText: day1Message.messageText,
                                sentAt: new Date()
                            }
                        })
                    } catch (sendErr: any) {
                        console.error(`Day 1 auto-send failed for ${sanitizedPhone}:`, sendErr.message)
                        // Don't fail the import, just log it — cron will pick it up later
                    }
                }

                successCount++
            } catch (err: any) {
                errors.push({ lead, error: err.message })
            }
        }

        return NextResponse.json({ success: successCount, errors })
    } catch (error) {
        console.error('Error importing leads:', error)
        return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 })
    }
}
