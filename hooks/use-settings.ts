import { useSettings as useSettingsContext } from '@/contexts/settings-context'

export function useSettings() {
  return useSettingsContext()
}

// Convenience hooks for specific settings
export function useSiteName() {
  const { getSetting } = useSettings()
  return getSetting('site_name') || ''
}

export function useSiteTagline() {
  const { getSetting } = useSettings()
  return getSetting('site_tagline') || 'Discover and trade unique digital art'
}

export function useMaintenanceMode() {
  const { getSetting } = useSettings()
  return getSetting('maintenance_mode') || false
}

export function useLogo() {
  const { getSetting } = useSettings()
  return {
    light: getSetting('logo_light') || '',
    dark: getSetting('logo_dark') || ''
  }
}

export function useFavicon() {
  const { getSetting } = useSettings()
  return getSetting('favicon') || ''
}

export function useMetaData() {
  const { getSetting } = useSettings()
  return {
    title: getSetting('meta_title') || 'NFT Marketplace - Digital Art Platform',
    description: getSetting('meta_description') || 'Discover, create, and trade unique digital art on our NFT marketplace',
    keywords: getSetting('meta_keywords') || 'nft, digital art, blockchain, ethereum, marketplace, collectibles',
    socialImage: getSetting('social_preview_image') || ''
  }
}

// Email settings hooks
export function useEmail() {
  const { getSetting } = useSettings()
  return getSetting('email') || 'contact@artistrytonal.com'
}

// Convenience aliases for the same email
export function useContactEmail() {
  return useEmail()
}

export function useSupportEmail() {
  return useEmail()
}

export function useLegalEmail() {
  return useEmail()
}

export function usePrivacyEmail() {
  return useEmail()
}

export function useFromEmail() {
  const { getSetting } = useSettings()
  return getSetting('smtp_from_email') || 'noreply@artistrytonal.com'
}

export function useFromName() {
  const { getSetting } = useSettings()
  return getSetting('smtp_from_name') || 'Artistrytonal'
}

