"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, Trash2, AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { notificationQueries } from "@/lib/queries"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  link?: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      // For now, we'll show empty state since we don't have admin-specific notifications yet
      // In the future, you might want to create admin-specific notification queries
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      // For now, just update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // For now, just update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      // For now, just update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'error':
        return 'border-l-red-500'
      default:
        return 'border-l-blue-500'
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b border-gray-700 p-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-gray-400 hover:text-white"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No notifications</p>
              <p className="text-sm mt-1">Admin notifications will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-700/50 transition-colors cursor-pointer relative group",
                    getNotificationColor(notification.type),
                    !notification.is_read && "bg-gray-700/30"
                  )}
                  style={{ borderLeftWidth: notification.is_read ? '0' : '3px' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        !notification.is_read ? "text-white" : "text-gray-300"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(notification.id, e)}
                      >
                        <Trash2 className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-gray-700 p-3">
            <Link href="/admin/notifications">
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
