import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/aisensy'

export async function POST(request: Request) {
    try {
        const { leads, campaignId } = await request.json()

        if (!Array.isArray(leads) || leads.length === 0) {
            return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
        }

        // Pre-fetch all campaigns for lookup by name (for CSV column mapping)
        const allCampaigns = await db.campaign.findMany({
            include: { messages: true }
        })
        const campaignByName: Record<string, any> = {}
        for (const c of allCampaigns) {
            campaignByName[c.name.toLowerCase().trim()] = c
        }

        // Also fetch the selected dropdown campaign (if any)
        let dropdownCampaign: any = null
        if (campaignId) {
            dropdownCampaign = allCampaigns.find((c: any) => c.id === campaignId) || null
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

            // Determine which campaign this lead belongs to:
            // 1. If CSV has a "campaign" column, use that to look up by name
            // 2. Otherwise, fall back to the dropdown selection
            let assignedCampaign: any = null
            let assignedCampaignId: string | null = null

            if (lead.campaign && typeof lead.campaign === 'string') {
                const csvCampaignName = lead.campaign.toLowerCase().trim()
                assignedCampaign = campaignByName[csvCampaignName] || null
                if (assignedCampaign) {
                    assignedCampaignId = assignedCampaign.id
                } else {
                    errors.push({ lead, error: `Campaign "${lead.campaign}" not found` })
                    continue
                }
            } else if (campaignId) {
                assignedCampaign = dropdownCampaign
                assignedCampaignId = campaignId
            }

            try {
                const savedLead = await db.lead.upsert({
                    where: { phone: sanitizedPhone },
                    update: {
                        name: lead.name,
                        email: lead.email || null,
                        campaignId: assignedCampaignId,
                        status: 'ACTIVE',
                        currentDay: 0,
                        lastMessageSent: null
                    },
                    create: {
                        name: lead.name,
                        phone: sanitizedPhone,
                        email: lead.email || null,
                        campaignId: assignedCampaignId,
                    }
                })

                // Auto-send Day 1 message if campaign is assigned
                if (assignedCampaign) {
                    const day1Message = assignedCampaign.messages.find((m: any) => m.dayNumber === 1)
                    if (day1Message) {
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
                        }
                    }
                }

                successCount++
            } catch (err: any) {
                errors.push({ lead, error: err.message })
            }
        }

        return NextResponse.json({ success: successCount, errors })
    } catch (error: any) {
        console.error('Error importing leads:', error)
        return NextResponse.json({ error: 'Failed to import leads', details: error.message }, { status: 500 })
    }
}
