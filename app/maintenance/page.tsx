"use client"

import React, { useEffect } from 'react'
import { useMaintenanceMode, useSiteName, useSiteTagline, useSettings } from '@/hooks/use-settings'
import { Loader2, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MaintenancePage() {
  const maintenanceMode = useMaintenanceMode()
  const siteName = useSiteName()
  const siteTagline = useSiteTagline()
  const { loading } = useSettings()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !maintenanceMode) {
      router.replace('/')
    }
  }, [loading, maintenanceMode, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-yellow-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Checking maintenance status…</span>
        </div>
      </div>
    )
  }

  if (!maintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-yellow-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Taking you back…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-6">
            <Wrench className="h-10 w-10 text-yellow-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white">
            {siteName}
          </h1>
          
          <p className="text-xl text-gray-300">
            We're currently performing maintenance
          </p>
          
          <p className="text-gray-400">
            {siteTagline}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-yellow-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Please check back soon</span>
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            <p>We're working hard to improve your experience.</p>
            <p>Expected downtime: 30-60 minutes</p>
          </div>
        </div>

        <div className="pt-8">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
          >
            Check Again
          </button>
        </div>

        <div className="text-xs text-gray-600">
          <p>If you continue to see this page, please contact support.</p>
        </div>
      </div>
    </div>
  )
}

