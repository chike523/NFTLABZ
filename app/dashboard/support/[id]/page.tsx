"use client"

import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TicketChat from "@/components/dashboard/ticket-chat"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"

export default function TicketChatPage() {
  const params = useParams()
  const ticketId = params?.id as string
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch ticket details
  const fetchTicket = async () => {
    if (!ticketId) return
    
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTicket(data.data)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast({
        title: "Error",
        description: "Failed to load ticket details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      
      // Auto-refresh every 30 seconds if ticket is active
      refreshIntervalRef.current = setInterval(() => {
        if (ticket?.status !== 'closed' && ticket?.status !== 'resolved') {
          fetchTicket()
        }
      }, 30000)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [ticketId])

  // Mark support page as read when viewing a ticket
  useEffect(() => {
    const markPageRead = async () => {
      try {
        await fetch('/api/dashboard/mark-page-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_name: 'support' })
        })
      } catch (error) {
        console.error('Failed to mark page as read:', error)
      }
    }

    markPageRead()
  }, [])

  const handleSendMessage = async (message: string, hasAttachments = false) => {
    if (!ticketId) return null

    const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, has_attachments: hasAttachments })
    })

    const data = await res.json()

    if (!res.ok || (data.error && !data.success)) {
      const errorMsg = data?.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to send message')
      throw new Error(errorMsg)
    }

    return data.message
  }

  const handleCloseTicket = async () => {
    if (!ticketId) return

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: "Ticket closed",
        description: "Your ticket has been closed",
      })

      await fetchTicket()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close ticket",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Ticket not found</p>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/support')}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Button>
            </div>
          </CardHeader>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Back button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/support')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>

        {/* Chat interface */}
        <TicketChat
          ticketId={ticketId}
          ticket={ticket}
          loading={loading}
          onSendMessage={handleSendMessage}
          onRefreshTicket={fetchTicket}
          onCloseTicket={handleCloseTicket}
        />
      </div>
    </DashboardLayout>
  )
}

