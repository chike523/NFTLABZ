"use client"

import { useState } from "react"
import { ReactNode } from "react"
import Sidebar from "./sidebar"
import ProfileCard from "./profile-card"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex lg:grid lg:grid-cols-[25%_60%_15%] h-screen overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-80 bg-card border-r border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <Sidebar />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar - Fixed/Sticky */}
        <div className="hidden lg:block bg-card border-r border-border h-screen overflow-y-auto sticky top-0">
          <Sidebar />
        </div>
        
        {/* Main Content Area - Scrollable */}
        <div className="flex-1 lg:bg-background p-4 sm:p-6 h-screen overflow-y-auto">
          {children}
        </div>
        
        {/* Mobile Profile Overlay */}
        {isProfileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsProfileOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsProfileOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <ProfileCard />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Profile Panel - Fixed/Sticky */}
        <div className="hidden lg:block bg-card border-l border-border p-4 h-screen overflow-y-auto sticky top-0">
          <ProfileCard />
        </div>
      </div>
    </div>
  )
}
