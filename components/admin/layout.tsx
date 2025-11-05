"use client"

import { ReactNode } from "react"
import AdminSidebar from "./sidebar"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 fixed h-screen">
        <AdminSidebar />
      </div>
      
      {/* Spacer for fixed sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0"></div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-gray-900 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <AdminSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5 text-gray-400" />
          </Button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-gray-800">
          {children}
        </div>
      </div>
    </div>
  )
}
