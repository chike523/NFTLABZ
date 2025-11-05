"use client"

import { Search, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NotificationsDropdown } from "./notifications-dropdown"

interface AdminHeaderProps {
  title: string
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Notifications */}
          <NotificationsDropdown />
        </div>
      </div>
    </div>
  )
}
