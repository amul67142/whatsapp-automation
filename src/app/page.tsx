'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle2, XCircle, HeartHandshake } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    interested: 0,
    unsubscribed: 0,
    completed: 0
  })
  const [leads, setLeads] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/leads?limit=1000') // get all for stats
      const allLeads = res.data.leads || []

      setLeads(allLeads)

      const s = {
        total: allLeads.length,
        active: allLeads.filter((l: any) => l.status === 'ACTIVE').length,
        interested: allLeads.filter((l: any) => l.status === 'INTERESTED').length,
        unsubscribed: allLeads.filter((l: any) => l.status === 'UNSUBSCRIBED').length,
        completed: allLeads.filter((l: any) => l.status === 'COMPLETED').length
      }

      setStats(s)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const chartData = [
    { name: 'Active', value: stats.active, color: '#3B82F6' },
    { name: 'Interested', value: stats.interested, color: '#10B981' },
    { name: 'Completed', value: stats.completed, color: '#64748B' },
    { name: 'Unsubscribed', value: stats.unsubscribed, color: '#EF4444' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Track your lead nurturing campaigns performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-500">Active Nurturing</CardTitle>
            <RefreshCwIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-500">Interested</CardTitle>
            <HeartHandshake className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.interested}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total ? Math.round((stats.interested / stats.total) * 100) : 0}% conversion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-500">Unsubscribed</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unsubscribed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total ? Math.round((stats.unsubscribed / stats.total) * 100) : 0}% drop-off
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Visualizing funnel conversions</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 h-[410px] flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest imported leads</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pr-2">
            <div className="space-y-6">
              {leads.slice(0, 10).map((l, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold mr-4 shrink-0 border">
                    {l.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5 flex-1 w-0">
                    <p className="text-sm font-medium leading-none truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.phone}</p>
                  </div>
                  <div>
                    {l.status === 'ACTIVE' && <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Active</Badge>}
                    {l.status === 'INTERESTED' && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Win</Badge>}
                    {l.status === 'UNSUBSCRIBED' && <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Lost</Badge>}
                    {l.status === 'COMPLETED' && <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">Done</Badge>}
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="text-center text-slate-500 pt-8 pb-4">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}
