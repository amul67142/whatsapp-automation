import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const skip = (page - 1) * limit

        let whereClause: any = {}

        if (status && status !== 'ALL') {
            whereClause.status = status
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search } },
                { phone: { contains: search } }
            ]
        }

        const [leads, total] = await Promise.all([
            db.lead.findMany({
                where: whereClause,
                include: {
                    campaign: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.lead.count({ where: whereClause })
        ])

        return NextResponse.json({ leads, total })
    } catch (error) {
        console.error('Error fetching leads:', error)
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }
}
