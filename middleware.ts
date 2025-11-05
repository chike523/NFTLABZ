import { updateSession } from './lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url)
  
  // Skip maintenance check for admin routes, API routes, and maintenance page itself
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname === '/maintenance' ||
    pathname.startsWith('/_next')
  ) {
    return await updateSession(request)
  }

  // Check for maintenance mode
  try {
    const response = await fetch(`${request.url.split('/')[0]}//${request.headers.get('host')}/api/admin/settings?category=general`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      const maintenanceSetting = data.data?.find((setting: any) => setting.key === 'maintenance_mode')
      
      if (maintenanceSetting?.value === 'true') {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch (error) {
    // If we can't check maintenance mode, continue normally
    console.warn('Could not check maintenance mode:', error)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
