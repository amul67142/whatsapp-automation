'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Papa from 'papaparse'
import { Plus, Search, Filter, Trash2, UploadCloud, RefreshCw, X, UserPlus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [search, setSearch] = useState('')
    const [importOpen, setImportOpen] = useState(false)
    const [addLeadOpen, setAddLeadOpen] = useState(false)
    const [campaigns, setCampaigns] = useState<any[]>([])

    // Import State
    const [file, setFile] = useState<File | null>(null)
    const [selectedCampaign, setSelectedCampaign] = useState<string>('')
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Add Lead State
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '' })
    const [addLeadCampaign, setAddLeadCampaign] = useState<string>('')
    const [addingLead, setAddingLead] = useState(false)

    useEffect(() => {
        fetchLeads()
    }, [statusFilter, search])

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`/api/leads?status=${statusFilter}&search=${search}`)
            setLeads(res.data.leads)
            setTotal(res.data.total)
        } catch (error) {
            toast.error('Failed to load leads')
        } finally {
            setLoading(false)
        }
    }

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get('/api/campaigns')
            setCampaigns(res.data.campaigns)
        } catch (error) {
            toast.error('Failed to load campaigns')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <Badge className="bg-blue-500">Active</Badge>
            case 'INTERESTED': return <Badge className="bg-green-500">Interested</Badge>
            case 'UNSUBSCRIBED': return <Badge variant="destructive">Unsubscribed</Badge>
            case 'COMPLETED': return <Badge variant="secondary">Completed</Badge>
            case 'ERROR': return <Badge variant="outline" className="text-red-500 border-red-500">Error</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/leads/${id}`)
            toast.success('Lead deleted')
            fetchLeads()
        } catch (error: any) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.error || 'Failed to delete lead')
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await axios.patch(`/api/leads/${id}`, { status: newStatus })
            toast.success('Status updated')
            fetchLeads()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const processCsv = () => {
        if (!file) return

        setImporting(true)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const res = await axios.post('/api/leads/import', {
                        leads: results.data,
                        campaignId: selectedCampaign === 'none' ? null : selectedCampaign
                    })

                    toast.success(`Imported ${res.data.success} leads successfully`)
                    if (res.data.errors && res.data.errors.length > 0) {
                        toast.warning(`${res.data.errors.length} leads failed to import`)
                        console.error('Import errors:', res.data.errors)
                    }

                    setImportOpen(false)
                    setFile(null)
                    setSelectedCampaign('')
                    fetchLeads()
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Failed to import leads')
                } finally {
                    setImporting(false)
                }
            },
            error: (error) => {
                toast.error(`CSV Parse Error: ${error.message}`)
                setImporting(false)
            }
        })
    }

    const handleAddLead = async () => {
        if (!newLead.name.trim() || !newLead.phone.trim()) {
            toast.error('Name and phone number are required')
            return
        }
        setAddingLead(true)
        try {
            const res = await axios.post('/api/leads/import', {
                leads: [newLead],
                campaignId: addLeadCampaign === 'none' || !addLeadCampaign ? null : addLeadCampaign
            })
            if (res.data.success > 0) {
                toast.success('Lead added successfully')
                setAddLeadOpen(false)
                setNewLead({ name: '', phone: '', email: '' })
                setAddLeadCampaign('')
                fetchLeads()
            } else if (res.data.errors?.length > 0) {
                toast.error(res.data.errors[0].error || 'Failed to add lead')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add lead')
        } finally {
            setAddingLead(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Total {total} leads matching filters</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchLeads} size="icon">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline" onClick={() => { setAddLeadOpen(true); fetchCampaigns(); }} className="gap-2">
                        <UserPlus className="h-4 w-4" /> Add Lead
                    </Button>
                    <Button onClick={() => { setImportOpen(true); fetchCampaigns(); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <UploadCloud className="h-4 w-4" /> Import CSV
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-4 flex flex-row items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs border-none shadow-none bg-transparent focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] border-slate-200">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INTERESTED">Interested</SelectItem>
                                <SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="ERROR">Error</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white">
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Campaign</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading leads...</TableCell>
                                </TableRow>
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <UsersIcon className="h-10 w-10 text-slate-300 mb-2" />
                                            <h3 className="text-lg font-medium text-slate-900">No leads found</h3>
                                            <p className="text-sm text-slate-500">Adjust filters or import some leads</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : leads.map((lead) => (
                                <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-medium">{lead.name}</TableCell>
                                    <TableCell className="text-slate-600 font-mono text-sm">{lead.phone}</TableCell>
                                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {lead.campaign?.name || <span className="italic text-slate-400">None</span>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 w-[100px]">
                                            <div className="text-xs font-medium text-slate-500 flex justify-between">
                                                <span>Day {lead.currentDay}</span>
                                                <span>{Math.round((lead.currentDay / 7) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-gray-700">
                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(lead.currentDay / 7) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select value={lead.status} onValueChange={(val) => updateStatus(lead.id, val)}>
                                            <SelectTrigger className="w-[130px] inline-flex h-8 shadow-none border-blue-200 focus:ring-1 bg-blue-50/50">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Make Active</SelectItem>
                                                <SelectItem value="INTERESTED">Mark Interested</SelectItem>
                                                <SelectItem value="UNSUBSCRIBED">Unsubscribe</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon" className="ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(lead.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <UploadCloud className="text-blue-500" />
                            Import Leads CSV
                        </DialogTitle>
                        <DialogDescription>
                            Upload a CSV with columns: <strong>name</strong>, <strong>phone</strong>, and optionally <strong>email</strong> and <strong>campaign</strong>. If your CSV has a &quot;campaign&quot; column, each lead will be assigned to the matching campaign by name.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">

                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-white hover:border-blue-400 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-2 min-h-[160px]" onClick={() => fileInputRef.current?.click()}>
                            {file ? (
                                <>
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                        <span className="text-blue-600 font-bold text-sm">CSV</span>
                                    </div>
                                    <p className="font-semibold text-sm">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </>
                            ) : (
                                <>
                                    <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center border group-hover:scale-110 transition-transform">
                                        <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <p className="font-medium text-slate-600">Click to upload or drag and drop</p>
                                    <p className="text-xs text-slate-400">CSV format only, up to 5MB.</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="space-y-2 mt-2">
                            <label className="text-sm font-medium text-slate-700">Assign to Campaign (Optional)</label>
                            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                                <SelectTrigger className="w-full bg-slate-50">
                                    <SelectValue placeholder="Select a campaign..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Campaign (Do not assign)</SelectItem>
                                    {campaigns.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                    <div className="flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-lg border-t">
                        <Button variant="outline" onClick={() => { setImportOpen(false); setFile(null); }}>Cancel</Button>
                        <Button onClick={processCsv} disabled={!file || importing} className="bg-blue-600 hover:bg-blue-700">
                            {importing ? 'Processing...' : 'Import Leads'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Lead Dialog */}
            <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <UserPlus className="text-blue-500" />
                            Add New Lead
                        </DialogTitle>
                        <DialogDescription>
                            Manually add a single lead to your database.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="lead-name">Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="lead-name"
                                placeholder="John Doe"
                                value={newLead.name}
                                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lead-phone">Phone Number <span className="text-red-500">*</span></Label>
                            <Input
                                id="lead-phone"
                                placeholder="919876543210"
                                value={newLead.phone}
                                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Format: 91XXXXXXXXXX (with country code)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lead-email">Email (Optional)</Label>
                            <Input
                                id="lead-email"
                                placeholder="john@example.com"
                                type="email"
                                value={newLead.email}
                                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Assign to Campaign (Optional)</Label>
                            <Select value={addLeadCampaign} onValueChange={setAddLeadCampaign}>
                                <SelectTrigger className="w-full bg-slate-50">
                                    <SelectValue placeholder="Select a campaign..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Campaign</SelectItem>
                                    {campaigns.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-lg border-t">
                        <Button variant="outline" onClick={() => { setAddLeadOpen(false); setNewLead({ name: '', phone: '', email: '' }); }}>Cancel</Button>
                        <Button onClick={handleAddLead} disabled={addingLead} className="bg-blue-600 hover:bg-blue-700">
                            {addingLead ? 'Adding...' : 'Add Lead'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
