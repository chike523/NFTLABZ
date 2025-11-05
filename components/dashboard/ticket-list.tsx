"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Clock, MessageSquare, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface Ticket {
  id: string
  ticket_id: string
  subject: string
  status: 'open' | 'in_progress' | 'closed' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  last_message_at?: string
  last_message?: string
}

interface TicketListProps {
  tickets: Ticket[]
  selectedTicketId?: string
  onSelectTicket: (ticketId: string) => void
  loading?: boolean
}

export default function TicketList({ tickets, selectedTicketId, onSelectTicket, loading }: TicketListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        )
      case 'closed':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No tickets yet</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first support ticket to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onSelectTicket(ticket.id)}
          className={cn(
            "w-full text-left bg-card border border-border rounded-lg p-3 sm:p-4 hover:bg-accent transition-colors",
            selectedTicketId === ticket.id && "ring-2 ring-primary"
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-mono text-xs text-muted-foreground font-semibold truncate">{ticket.ticket_id}</span>
              {getStatusBadge(ticket.status)}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(ticket.last_message_at || ticket.created_at)}
            </span>
          </div>
          
          <h3 className="font-medium text-sm sm:text-base mb-1 line-clamp-2">{ticket.subject}</h3>
          
          {ticket.last_message && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {ticket.last_message}
            </p>
          )}
        </button>
      ))}
    </div>
  )
}

