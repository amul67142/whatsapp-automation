'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Message = {
    dayNumber: number;
    messageText: string;
    imageUrl?: string;
    buttons?: any;
}

export default function EditCampaignPage() {
    const router = useRouter()
    const params = useParams()
    const campaignId = params.id as string

    const [name, setName] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [activeTab, setActiveTab] = useState('1')
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCampaign()
    }, [campaignId])

    const fetchCampaign = async () => {
        try {
            const res = await axios.get(`/api/campaigns/${campaignId}`)
            const campaign = res.data.campaign
            setName(campaign.name)
            setMessages(
                campaign.messages.map((m: any) => ({
                    dayNumber: m.dayNumber,
                    messageText: m.messageText,
                    imageUrl: m.imageUrl || '',
                    buttons: m.buttons ? JSON.parse(m.buttons) : undefined
                }))
            )
        } catch (error) {
            toast.error('Failed to load campaign')
            router.push('/campaigns')
        } finally {
            setLoading(false)
        }
    }

    const handleAddDay = () => {
        if (messages.length >= 7) {
            toast.error('Maximum 7 days allowed per campaign')
            return
        }
        const nextDay = messages.length + 1
        setMessages([...messages, { dayNumber: nextDay, messageText: '' }])
        setActiveTab(nextDay.toString())
    }

    const handleMessageChange = (dayNumber: number, field: string, value: string) => {
        setMessages(messages.map(m =>
            m.dayNumber === dayNumber ? { ...m, [field]: value } : m
        ))
    }

    const handleRemoveDay = (dayNum: number) => {
        if (messages.length <= 1) return
        const newMessages = messages.filter(m => m.dayNumber !== dayNum)
            .map((m, index) => ({ ...m, dayNumber: index + 1 }))
        setMessages(newMessages)
        setActiveTab('1')
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Campaign name is required')
            return
        }

        const invalidMessages = messages.filter(m => !m.messageText.trim())
        if (invalidMessages.length > 0) {
            toast.error(`Message text is required for Day ${invalidMessages[0].dayNumber}`)
            setActiveTab(invalidMessages[0].dayNumber.toString())
            return
        }

        setSaving(true)
        try {
            await axios.put(`/api/campaigns/${campaignId}`, { name, messages })
            toast.success('Campaign updated successfully')
            router.push('/campaigns')
        } catch (error) {
            toast.error('Failed to update campaign')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/campaigns"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Campaign</h1>
                        <p className="text-sm text-muted-foreground">Modify your nurturing sequence</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push('/campaigns')}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Campaign Name</label>
                            <Input
                                id="name"
                                placeholder="e.g., Webinar Follow-up Sequence"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="max-w-md text-lg"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Message Sequence</h2>
                            <Button variant="outline" size="sm" onClick={handleAddDay} disabled={messages.length >= 7} className="gap-1">
                                <Plus className="h-4 w-4" /> Add Day
                            </Button>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="mb-6 w-full justify-start overflow-x-auto">
                                {messages.map((m) => (
                                    <TabsTrigger key={m.dayNumber} value={m.dayNumber.toString()} className="min-w-[80px]">
                                        Day {m.dayNumber}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {messages.map((msg) => (
                                <TabsContent key={msg.dayNumber} value={msg.dayNumber.toString()} className="space-y-4">
                                    <div className="flex justify-end">
                                        {messages.length > 1 && (
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1" onClick={() => handleRemoveDay(msg.dayNumber)}>
                                                <Trash2 className="h-4 w-4" /> Remove Day
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-[1fr,300px] gap-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex justify-between">
                                                    Message Content
                                                    <span className="text-xs text-muted-foreground">{msg.messageText.length}/4096</span>
                                                </label>
                                                <Textarea
                                                    placeholder="Type your WhatsApp message here."
                                                    className="min-h-[250px] resize-none"
                                                    value={msg.messageText}
                                                    onChange={(e) => handleMessageChange(msg.dayNumber, 'messageText', e.target.value)}
                                                    maxLength={4096}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" /> Media URL (Optional)
                                                </label>
                                                <Input
                                                    placeholder="https://example.com/image.jpg"
                                                    value={msg.imageUrl || ''}
                                                    onChange={(e) => handleMessageChange(msg.dayNumber, 'imageUrl', e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">Public URL to JPEG, PNG, or WEBP image (max 5MB)</p>
                                            </div>
                                        </div>

                                        {/* Preview Panel */}
                                        <div className="bg-[#EFEAE2] rounded-xl p-4 h-fit border border-slate-200 relative overflow-hidden">
                                            <div className="text-center text-xs text-slate-500 mb-4 bg-white/50 py-1 rounded-full mx-auto w-fit px-3">
                                                Today
                                            </div>
                                            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm text-sm whitespace-pre-wrap word-break flex flex-col pt-2 pb-6 relative">
                                                {msg.imageUrl && (
                                                    <div className="w-full h-32 bg-slate-100 rounded mb-2 overflow-hidden border">
                                                        <img src={msg.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    </div>
                                                )}
                                                {msg.messageText || <span className="text-slate-400 italic">Type a message to see preview...</span>}
                                                <span className="text-[10px] text-slate-400 absolute bottom-1.5 right-2">
                                                    10:00 AM
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
