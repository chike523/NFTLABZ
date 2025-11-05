"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
  attachments?: {
    id?: string
    file_url: string
    file_name: string
    file_type: string
    file_size: number
  }[]
}

interface TicketChatProps {
  ticketId?: string
  ticket: {
    id: string
    ticket_id: string
    subject: string
    status: string
    messages: Message[]
  } | null
  loading?: boolean
  onSendMessage: (message: string, hasAttachments?: boolean) => Promise<{ id: string } | null>
  onRefreshTicket?: () => Promise<void>
  onCloseTicket?: () => void
  isUser?: boolean
}

export default function TicketChat({ ticketId, ticket, loading, onSendMessage, onRefreshTicket, onCloseTicket, isUser = true }: TicketChatProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [ticket?.messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024)
    
    if (imageFiles.length > 3) {
      alert('You can only upload up to 3 images at once')
      return
    }

    setAttachments(prev => [...prev, ...imageFiles].slice(0, 3))
    
    // Create preview URLs
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim().length === 0 && attachments.length === 0) || sending || !ticketId) return

    setSending(true)
    try {
      const result = await onSendMessage(message, attachments.length > 0)
      const newMessageId = result?.id

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

      if (onRefreshTicket) {
        await onRefreshTicket()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (!ticketId || loading) {
    return (
      <div className="flex-1 flex flex-col bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground">Select a ticket to view messages</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col bg-card border border-border rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-lg truncate">{ticket.subject}</h2>
                <Badge variant="outline" className="text-xs">{ticket.ticket_id}</Badge>
              </div>
              <p className="text-sm text-muted-foreground capitalize">{ticket.status}</p>
            </div>
            {isUser && ticket.status === 'open' && onCloseTicket && (
              <Button variant="outline" size="sm" onClick={onCloseTicket}>
                Close Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {ticket.messages.map((msg) => {
            const trimmed = msg.message?.trim() || ''
            const isAttachmentOnly = trimmed === '[Attachment]' && (msg.attachments?.length || 0) > 0
            return (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.is_admin ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={msg.is_admin ? 'bg-primary' : 'bg-secondary'}>
                  {msg.is_admin ? 'A' : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 ${msg.is_admin ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[80%] sm:max-w-[70%] rounded-lg p-3 ${
                  msg.is_admin ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
                }`}>
                  {!isAttachmentOnly && (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  )}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att, idx) => (
                        <div key={idx} className="relative">
                          <Image
                            src={att.file_url}
                            alt={att.file_name}
                            width={200}
                            height={200}
                            className="rounded cursor-pointer object-cover"
                            onClick={() => setViewingImage(att.file_url)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {msg.is_admin ? 'Admin' : 'You'} · {formatDate(msg.created_at)}
                </p>
              </div>
            </div>
          )})}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-border space-y-2">
            {/* Attachment Previews */}
            {previewImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {previewImages.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <Image
                      src={preview}
                      alt="Preview"
                      width={80}
                      height={80}
                      className="rounded object-cover"
                    />
                    <button
                      type="button"
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
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 resize-none"
                disabled={sending || uploading}
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
                <Button type="submit" size="icon" disabled={(message.trim().length === 0 && attachments.length === 0) || sending || uploading}>
                  {sending || uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {attachments.length >= 3 && (
              <p className="text-xs text-muted-foreground">Maximum 3 images per message</p>
            )}
          </form>
        )}
      </div>

      {/* Image View Dialog */}
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
    </>
  )
}

