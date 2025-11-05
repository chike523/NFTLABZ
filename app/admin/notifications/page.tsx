"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Bell, Search, CheckCheck, Trash2, AlertCircle, CheckCircle2, AlertTriangle, Info, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  timestamp: string
  link?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
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
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = !search || 
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === "all" || n.type === typeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "read" && n.read) ||
      (statusFilter === "unread" && !n.read)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const pagination = usePagination({
    items: filteredNotifications,
    itemsPerPage: 20,
  })

  const handleMarkAsRead = async (id: string) => {
    try {
      // For now, just update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // For now, just update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // For now, just update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-500/5'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/5'
      case 'error':
        return 'border-l-red-500 bg-red-500/5'
      default:
        return 'border-l-blue-500 bg-blue-500/5'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AdminLayout>
      <AdminHeader title="Notifications" />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-white">{unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Read</p>
                <p className="text-2xl font-bold text-white">{notifications.length - unreadCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-start gap-4 p-4">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : pagination.paginatedItems.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">No notifications found</p>
              <p className="text-sm">Admin notifications will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {pagination.paginatedItems.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-6 hover:bg-gray-700/30 transition-colors relative",
                    getNotificationColor(notification.type),
                    !notification.read && "bg-gray-700/20"
                  )}
                  style={{ borderLeftWidth: '4px' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className={cn(
                          "text-base font-semibold",
                          !notification.read ? "text-white" : "text-gray-300"
                        )}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full whitespace-nowrap">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}</span>
                        {notification.link && (
                          <Link 
                            href={notification.link}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            View details →
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredNotifications.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Showing {pagination.startIndex}-{pagination.endIndex} of {pagination.totalItems} notifications</span>
              <Select value={pagination.itemsPerPage.toString()} onValueChange={(value) => pagination.setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-[80px] h-8 bg-gray-700 border-gray-600 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={pagination.prevPage}
                    className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => pagination.goToPage(page)}
                      isActive={pagination.currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={pagination.nextPage}
                    className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
