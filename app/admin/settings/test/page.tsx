"use client"

import React, { useState, useEffect } from 'react'
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSiteName, useSiteTagline, useMaintenanceMode, useLogo, useFavicon, useMetaData } from "@/hooks/use-settings"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function SettingsTestPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()
  
  // Get current settings values
  const siteName = useSiteName()
  const siteTagline = useSiteTagline()
  const maintenanceMode = useMaintenanceMode()
  const { light: lightLogo, dark: darkLogo } = useLogo()
  const favicon = useFavicon()
  const { title, description, keywords, socialImage } = useMetaData()

  const runTests = async () => {
    setTesting(true)
    const results: Record<string, any> = {}

    try {
      // Test 1: Fetch all settings
      const settingsResponse = await fetch('/api/admin/settings')
      const settingsData = await settingsResponse.json()
      results.settingsFetch = {
        success: settingsResponse.ok,
        data: settingsData.data?.length || 0,
        error: settingsData.error
      }

      // Test 2: Fetch settings by category
      const generalResponse = await fetch('/api/admin/settings?category=general')
      const generalData = await generalResponse.json()
      results.generalSettings = {
        success: generalResponse.ok,
        data: generalData.data?.length || 0,
        error: generalData.error
      }

      // Test 3: Fetch public settings
      const publicResponse = await fetch('/api/admin/settings?public=true')
      const publicData = await publicResponse.json()
      results.publicSettings = {
        success: publicResponse.ok,
        data: publicData.data?.length || 0,
        error: publicData.error
      }

      // Test 4: Test settings update
      const testUpdate = {
        updates: [
          { key: 'site_name', value: 'Test Update' }
        ],
        updatedBy: null
      }
      
      const updateResponse = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUpdate)
      })
      const updateData = await updateResponse.json()
      results.settingsUpdate = {
        success: updateResponse.ok,
        error: updateData.error
      }

      // Test 5: Revert the test update
      const revertUpdate = {
        updates: [
          { key: 'site_name', value: 'Artistrytonal' }
        ],
        updatedBy: null
      }
      
      const revertResponse = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revertUpdate)
      })
      results.settingsRevert = {
        success: revertResponse.ok,
        error: revertResponse.ok ? null : (await revertResponse.json()).error
      }

      // Test 6: Fetch wallets
      const walletsResponse = await fetch('/api/admin/wallets')
      const walletsData = await walletsResponse.json()
      results.walletsFetch = {
        success: walletsResponse.ok,
        data: walletsData.data?.length || 0,
        error: walletsData.error
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error'
    }

    setTestResults(results)
    setTesting(false)
    
    const successCount = Object.values(results).filter((result: any) => result.success).length
    const totalTests = Object.keys(results).length
    
    toast({
      title: "Tests Complete",
      description: `${successCount}/${totalTests} tests passed`,
      variant: successCount === totalTests ? "default" : "destructive"
    })
  }

  return (
    <AdminLayout>
      <AdminHeader title="Settings Test" />
      
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings System Test</CardTitle>
            <CardDescription>
              Test all settings functionality to ensure everything works correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={testing} className="mb-6">
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Tests'
              )}
            </Button>

            {/* Current Settings Values */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Current Settings Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Site Name:</strong> {siteName}
                </div>
                <div>
                  <strong>Site Tagline:</strong> {siteTagline}
                </div>
                <div>
                  <strong>Maintenance Mode:</strong> {maintenanceMode ? 'Enabled' : 'Disabled'}
                </div>
                <div>
                  <strong>Light Logo:</strong> {lightLogo ? 'Set' : 'Not Set'}
                </div>
                <div>
                  <strong>Dark Logo:</strong> {darkLogo ? 'Set' : 'Not Set'}
                </div>
                <div>
                  <strong>Favicon:</strong> {favicon ? 'Set' : 'Not Set'}
                </div>
                <div>
                  <strong>Meta Title:</strong> {title}
                </div>
                <div>
                  <strong>Meta Description:</strong> {description}
                </div>
              </div>
            </div>

            {/* Test Results */}
            {Object.keys(testResults).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                {Object.entries(testResults).map(([testName, result]) => (
                  <div key={testName} className="flex items-center space-x-2 p-3 border rounded">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium capitalize">
                        {testName.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-500">{result.error}</div>
                      )}
                      {result.data !== undefined && (
                        <div className="text-sm text-gray-500">
                          Data: {typeof result.data === 'number' ? result.data : JSON.stringify(result.data)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
