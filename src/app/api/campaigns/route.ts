import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const campaigns = await db.campaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { leads: true }
                }
            }
        })
        return NextResponse.json({ campaigns })
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { name, messages } = await request.json()

        if (!name || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Name and at least one message are required' }, { status: 400 })
        }

        const campaign = await db.campaign.create({
            data: {
                name,
                messages: {
                    create: messages.map((m: any) => ({
                        dayNumber: parseInt(m.dayNumber),
                        messageText: m.messageText,
                        imageUrl: m.imageUrl || null,
                        buttons: m.buttons ? JSON.stringify(m.buttons) : null
                    }))
                }
            },
            include: {
                messages: true
            }
        })

        return NextResponse.json({ campaign })
    } catch (error) {
        console.error('Error creating campaign:', error)
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }
}
