"use client"

import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageCircle, 
  Search, 
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Users,
  MessageSquare,
  ChevronRight
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface TicketStats {
  total: number
  open: number
  in_progress: number
  closed: number
  resolved: number
  avg_response_time?: string
}

interface Ticket {
  id: string
  ticket_id: string
  subject: string
  status: 'open' | 'in_progress' | 'closed' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  last_message_at?: string
  user_email?: string
  message_count?: number
}

export default function AdminSupportPage() {
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    closed: 0,
    resolved: 0
  })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const router = useRouter()

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/support/stats')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      let url = '/api/admin/support/tickets?'
      if (statusFilter !== 'all') url += `status=${statusFilter}&`
      if (priorityFilter !== 'all') url += `priority=${priorityFilter}&`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTickets(data.data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchTickets()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats()
      fetchTickets()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [statusFilter, priorityFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Open
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        )
      case 'closed':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Medium</Badge>
      case 'low':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        ticket.ticket_id.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        ticket.user_email?.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <AdminLayout>
      <AdminHeader title="Support Tickets" />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Tickets</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Open</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.in_progress}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Closed</p>
                  <p className="text-2xl font-bold text-gray-400">{stats.closed}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">All Tickets</CardTitle>
            <CardDescription className="text-gray-400">
              Manage and respond to user support tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ticket ID, subject, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Priority:</span>
                {['all', 'high', 'medium', 'low'].map(priority => (
                  <Button
                    key={priority}
                    variant={priorityFilter === priority ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPriorityFilter(priority)}
                    className="capitalize"
                  >
                    {priority}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading tickets...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No tickets found</div>
              ) : (
                filteredTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => router.push(`/admin/support/${ticket.id}`)}
                    className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-400">{ticket.ticket_id}</span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <h4 className="text-white font-medium truncate">{ticket.subject}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        {ticket.user_email && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {ticket.user_email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </span>
                        {ticket.message_count && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.message_count} messages
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
