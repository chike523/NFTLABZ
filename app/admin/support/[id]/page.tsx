"use client"

import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Send,
  Loader2,
  Clock,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  X
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
  admin_name?: string
  attachments?: any[]
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
  user_name?: string
  messages: Message[]
}

export default function AdminTicketDetailPage() {
  const params = useParams()
  const ticketId = params?.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchTicket = async () => {
    if (!ticketId) return
    
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTicket(data.data)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast({
        title: "Error",
        description: "Failed to load ticket",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      
      // Auto-refresh every 30 seconds
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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticketId) return
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: "Status updated",
        description: `Ticket status changed to ${newStatus}`,
      })

      await fetchTicket()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdatePriority = async (newPriority: string) => {
    if (!ticketId) return
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: "Priority updated",
        description: `Ticket priority changed to ${newPriority}`,
      })

      await fetchTicket()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!ticketId || (message.trim().length === 0 && attachments.length === 0)) return

    setSending(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, has_attachments: attachments.length > 0 })
      })

      const data = await res.json()

      if (!res.ok || (data.error && !data.success)) {
        const errorMsg = data?.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to send message')
        throw new Error(errorMsg)
      }

      const newMessageId = data.message?.id

      if (!newMessageId) {
        throw new Error('Failed to create message')
      }

      if (attachments.length > 0) {
        setUploading(true)
        for (const file of attachments) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('message_id', newMessageId)

          const uploadRes = await fetch(`/api/support/tickets/${ticketId}/upload`, {
            method: 'POST',
            body: formData
          })

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => null)
            throw new Error(errorData?.error || 'Failed to upload attachment')
          }
        }
        setUploading(false)
      }

      setMessage("")
      setAttachments([])
      setPreviewImages([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      await fetchTicket()
      scrollToBottom()
    } catch (error) {
      await fetchTicket()
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
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

    setAttachments(prev => [...prev, ...imageFiles].slice(0, 3))
    
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImages(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Loading..." />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    )
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <AdminHeader title="Ticket Not Found" />
        <div className="p-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-8">
              <p className="text-gray-400">Ticket not found</p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/support')}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title={`Ticket ${ticket.ticket_id}`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/support')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Info Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-400 text-xs">Status</Label>
                  <Select 
                    value={ticket.status} 
                    onValueChange={handleUpdateStatus}
                    disabled={updating}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-400 text-xs">Priority</Label>
                  <Select 
                    value={ticket.priority} 
                    onValueChange={handleUpdatePriority}
                    disabled={updating}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-gray-700 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">User:</span>
                    <span className="text-white">{ticket.user_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white text-xs">{ticket.user_email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white text-xs">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Messages:</span>
                    <span className="text-white">{ticket.messages.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700 flex flex-col min-h-[400px]">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white">{ticket.subject}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {ticket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.is_admin ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={msg.is_admin ? 'bg-primary' : 'bg-gray-600'}>
                          {msg.is_admin ? 'A' : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${msg.is_admin ? 'flex justify-end' : ''}`}>
                        <div className={`max-w-[80%] ${msg.is_admin ? 'ml-auto' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">
                              {msg.is_admin ? (msg.admin_name || 'Admin') : ticket.user_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 ${
                            msg.is_admin 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-gray-700 text-white'
                          }`}>
                            {!(msg.message?.trim() === '[Attachment]' && (msg.attachments?.length || 0) > 0) && (
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            )}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {msg.attachments.map((att: any, idx: number) => (
                                  <div 
                                    key={idx}
                                    className="relative cursor-pointer"
                                    onClick={() => setViewingImage(att.file_url)}
                                  >
                                    <Image
                                      src={att.file_url}
                                      alt={att.file_name}
                                      width={100}
                                      height={100}
                                      className="rounded object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                  <div className="border-t border-gray-700 p-4 space-y-2">
                    {previewImages.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {previewImages.map((preview, idx) => (
                          <div key={idx} className="relative">
                            <Image
                              src={preview}
                              alt="Preview"
                              width={60}
                              height={60}
                              className="rounded object-cover"
                            />
                            <button
                              onClick={() => removeAttachment(idx)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your response..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 bg-gray-700 border-gray-600 text-white resize-none"
                        rows={2}
                        disabled={sending || uploading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (message.trim().length > 0 || attachments.length > 0) {
                              handleSendMessage()
                            }
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={sending || uploading || attachments.length >= 3}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          disabled={sending || uploading || attachments.length >= 3}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={(message.trim().length === 0 && attachments.length === 0) || sending || uploading}
                          size="icon"
                        >
                          {sending || uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <div className="relative w-full h-[600px]">
              <Image
                src={viewingImage}
                alt="Full size"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

