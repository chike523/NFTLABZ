"use client"

import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { FolderOpen } from "lucide-react"

export default function CategoriesPage() {
  return (
    <AdminLayout>
      <AdminHeader title="Categories Management" />
      
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-700 rounded-full mb-4">
            <FolderOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Categories Management</h2>
          <p className="text-gray-400 max-w-md">
            Category management features will be available soon. This section will allow you to manage NFT categories, their settings, and display preferences.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
