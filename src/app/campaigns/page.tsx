'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Plus, BarChart2, MessageSquareShare, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
// Delete confirmation is handled inline below

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get('/api/campaigns')
            setCampaigns(res.data.campaigns)
        } catch (error) {
            toast.error('Failed to load campaigns')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await axios.delete(`/api/campaigns/${deleteId}`)
            toast.success('Campaign deleted successfully')
            fetchCampaigns()
        } catch (error) {
            toast.error('Failed to delete campaign')
        } finally {
            setDeleteId(null)
        }
    }

    if (loading) {
        return <div className="space-y-4">Loading campaigns...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground mt-1">Manage your 7-day automated messaging sequences.</p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/campaigns/new">
                        <Plus className="h-4 w-4" />
                        Create Campaign
                    </Link>
                </Button>
            </div>

            {campaigns.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <MessageSquareShare className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first 7-day nurturing sequence to get started.</p>
                    <Button asChild variant="outline">
                        <Link href="/campaigns/new">Create Campaign</Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="flex flex-col hover:border-blue-200 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl truncate pr-2">{campaign.name}</CardTitle>
                                        <CardDescription className="mt-1">
                                            Created {new Date(campaign.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={campaign.isActive ? 'default' : 'secondary'} className={campaign.isActive ? 'bg-green-500 hover:bg-green-600' : ''}>
                                        {campaign.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex items-center text-sm text-muted-foreground bg-slate-50 p-3 rounded-md">
                                    <UsersIcon className="h-4 w-4 mr-2 text-slate-400" />
                                    <span className="font-medium text-slate-700 mr-1">{campaign._count.leads}</span> leads assigned
                                </div>
                            </CardContent>
                            <CardFooter className="pt-3 border-t flex justify-between gap-2">
                                <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                                    <Link href={`/campaigns/${campaign.id}/edit`}>
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => setDeleteId(campaign.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Manual alert dialog since Shadcn adds it as separate components usually */}
            {deleteId && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h2 className="text-lg font-semibold mb-2">Delete Campaign</h2>
                        <p className="text-muted-foreground mb-6">Are you sure you want to delete this campaign? Active leads might stop receiving messages.</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
