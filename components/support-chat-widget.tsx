"use client"

import { useEffect, useState } from 'react'
import { useSettings } from '@/contexts/settings-context'

export default function SupportChatWidget() {
  const { getSetting, loading } = useSettings()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Don't inject script until settings are loaded and component is mounted
    if (!mounted || loading) return

    const chatCode = getSetting('support_chat_code')
    
    console.log('🔍 Support Chat Widget - Debug:', {
      mounted,
      loading,
      chatCode: chatCode ? `${chatCode.substring(0, 50)}...` : 'null/empty',
      hasCode: !!chatCode
    })
    
    // Only inject if chat code exists
    if (!chatCode || chatCode.trim() === '') {
      console.log('⚠️ No chat code found in settings')
      return
    }

    try {
      // Create a container for the script
      const scriptContainer = document.createElement('div')
      scriptContainer.id = 'support-chat-widget-container'
      scriptContainer.innerHTML = chatCode

      // Append to body
      document.body.appendChild(scriptContainer)

      // Execute any scripts in the injected code
      const scripts = scriptContainer.getElementsByTagName('script')
      Array.from(scripts).forEach((oldScript) => {
        const newScript = document.createElement('script')
        
        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value)
        })
        
        // Copy content
        newScript.textContent = oldScript.textContent
        
        // Replace old script with new one to trigger execution
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })

      console.log('✅ Support chat widget loaded successfully')

      // Cleanup function
      return () => {
        const container = document.getElementById('support-chat-widget-container')
        if (container) {
          container.remove()
          console.log('🧹 Support chat widget cleaned up')
        }
      }
    } catch (error) {
      console.error('❌ Error loading support chat widget:', error)
    }
  }, [mounted, loading, getSetting])

  // This component doesn't render anything visible
  return null
}

