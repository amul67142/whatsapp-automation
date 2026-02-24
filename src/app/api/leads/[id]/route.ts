import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { status } = await request.json()

        if (!['ACTIVE', 'INTERESTED', 'UNSUBSCRIBED', 'COMPLETED', 'ERROR'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const lead = await db.lead.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({ lead })
    } catch (error) {
        console.error('Error updating lead status:', error)
        return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Delete message logs first (in case cascade isn't working)
        await db.messageLog.deleteMany({ where: { leadId: id } })

        await db.lead.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting lead:', error)
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }
}
