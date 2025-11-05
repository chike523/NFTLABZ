"use client"

import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TicketList from "@/components/dashboard/ticket-list"
import { HelpCircle, Mail, Plus, Image as ImageIcon, X, Loader2, Send } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function SupportPage() {
  const [view, setView] = useState<'list' | 'create'>('list')
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createFormData, setCreateFormData] = useState({
    subject: "",
    message: "",
  })
  const [createAttachments, setCreateAttachments] = useState<File[]>([])
  const [createPreviewImages, setCreatePreviewImages] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const createFileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const statusParam = statusFilter === 'all' ? '' : `?status=${statusFilter}`
      const res = await fetch(`/api/support/tickets${statusParam}`)
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
    fetchTickets()
  }, [statusFilter])

  // Mark page as read on mount
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

  const handleSelectTicket = (ticketId: string) => {
    router.push(`/dashboard/support/${ticketId}`)
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    const subjectValue = createFormData.subject.trim()
    const messageValue = createFormData.message.trim()

    if (!subjectValue) {
      toast({
        title: "Subject required",
        description: "Please enter a subject for your ticket.",
        variant: "destructive"
      })
      return
    }

    if (messageValue.length === 0 && createAttachments.length === 0) {
      toast({
        title: "Add a message or image",
        description: "Type a message or attach at least one image to continue.",
        variant: "destructive"
      })
      return
    }

    setCreating(true)
    setUploading(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectValue,
          message: messageValue,
          attachments: []
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: "Ticket created",
        description: `Ticket ${data.ticket.ticket_id} created successfully`,
      })

      // Upload attachments to first message if any
      const firstMessageId = data.ticket?.messages?.[0]?.id || null
      if (createAttachments.length > 0 && data.ticket?.id) {
        for (const file of createAttachments) {
          const formData = new FormData()
          formData.append('file', file)

          if (firstMessageId) {
            formData.append('message_id', firstMessageId)
          }

          await fetch(`/api/support/tickets/${data.ticket.id}/upload`, {
            method: 'POST',
            body: formData
          })
        }
      }

      setCreateFormData({ subject: "", message: "" })
      setCreateAttachments([])
      setCreatePreviewImages([])
      
      // Redirect to the new ticket
      router.push(`/dashboard/support/${data.ticket.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create ticket",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024)
    
    if (imageFiles.length > 3) {
      toast({
        title: "Too many images",
        description: "You can only upload up to 3 images",
        variant: "destructive",
      })
      return
    }

    setCreateAttachments(prev => [...prev, ...imageFiles].slice(0, 3))
    
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCreatePreviewImages(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })

    if (createFileInputRef.current) {
      createFileInputRef.current.value = ""
    }
  }

  const removeCreateAttachment = (index: number) => {
    setCreateAttachments(prev => prev.filter((_, i) => i !== index))
    setCreatePreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const openCount = tickets.filter(t => t.status === 'open').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Support Center</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Get help with your account, transactions, or any questions you may have
            </p>
          </div>
          <Button onClick={() => setView(view === 'create' ? 'list' : 'create')} className="whitespace-nowrap">
            {view === 'create' ? (
              <>Cancel</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </>
            )}
          </Button>
        </div>

        {/* Ticket Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tickets.length}</div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{openCount}</div>
              <div className="text-sm text-muted-foreground">Open</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{resolvedCount}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tickets.length - openCount - resolvedCount}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {view === 'create' ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Ticket</CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What can we help you with?"
                    value={createFormData.subject}
                    onChange={(e) => setCreateFormData({ ...createFormData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question..."
                    rows={6}
                    value={createFormData.message}
                    onChange={(e) => setCreateFormData({ ...createFormData, message: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachments (Optional)</Label>
                  <div className="flex gap-2">
                    <input
                      ref={createFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={creating || uploading || createAttachments.length >= 3}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={creating || uploading || createAttachments.length >= 3}
                      onClick={() => createFileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Images (Max 3)
                    </Button>
                  </div>
                  {createPreviewImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {createPreviewImages.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <Image
                            src={preview}
                            alt="Preview"
                            width={100}
                            height={100}
                            className="rounded object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeCreateAttachment(idx)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating || uploading} className="flex-1">
                    {creating || uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setView('list')
                    setCreateFormData({ subject: "", message: "" })
                    setCreateAttachments([])
                    setCreatePreviewImages([])
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'open', 'in_progress', 'closed', 'resolved'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="whitespace-nowrap"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </Button>
              ))}
            </div>
            <TicketList
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              loading={loading}
            />
          </div>
        )}

        {/* FAQ and Contact - Collapsible sections */}
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">How do I deposit funds?</h4>
                    <p className="text-sm text-muted-foreground">
                      Go to the Deposit page and follow the instructions to add funds to your wallet.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">How long do withdrawals take?</h4>
                    <p className="text-sm text-muted-foreground">
                      Withdrawals are typically processed within 24-48 hours after approval.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">How can I view my transactions?</h4>
                    <p className="text-sm text-muted-foreground">
                      Visit the Transactions page in your dashboard to see all your transaction history.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle>Direct Contact</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  For urgent matters, you can also reach us directly at{" "}
                  <a href="mailto:support@yourplatform.com" className="text-primary hover:underline">
                    support@yourplatform.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
