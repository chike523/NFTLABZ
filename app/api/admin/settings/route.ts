import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      console.warn('Admin client failed, falling back to regular client:', adminError)
      supabase = await createClient()
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const publicOnly = searchParams.get('public') === 'true'

    let query = supabase
      .from('site_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (publicOnly) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Admin settings API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      console.warn('Admin client failed, falling back to regular client:', adminError)
      supabase = await createClient()
    }

    const body = await request.json()
    const { updates, updatedBy } = body

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 })
    }

    // Update each setting
    const results = await Promise.all(
      updates.map((update: { key: string; value: string }) => {
        const updateData: any = { 
          value: update.value,
          updated_at: new Date().toISOString()
        }
        
        // Only add updated_by if it's a valid UUID
        if (updatedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedBy)) {
          updateData.updated_by = updatedBy
        }
        
        return supabase
          .from('site_settings')
          .update(updateData)
          .eq('key', update.key)
      })
    )

    // Check if any update failed
    const hasError = results.some(result => result.error)
    if (hasError) {
      console.error('Some settings failed to update:', results)
      return NextResponse.json({ error: 'Some settings failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin settings update error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

