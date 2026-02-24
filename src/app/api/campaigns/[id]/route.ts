import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const campaign = await db.campaign.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { dayNumber: 'asc' }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        return NextResponse.json({ campaign })
    } catch (error) {
        console.error('Error fetching campaign:', error)
        return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { name, messages, isActive } = await request.json()

        if (!name || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Name and at least one message are required' }, { status: 400 })
        }

        // Update campaign and recreate messages
        const campaign = await db.campaign.update({
            where: { id },
            data: {
                name,
                isActive: isActive !== undefined ? isActive : true,
                messages: {
                    deleteMany: {}, // Delete old messages
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
        console.error('Error updating campaign:', error)
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await db.campaign.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting campaign:', error)
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
    }
}
