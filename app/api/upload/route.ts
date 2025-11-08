import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!folder || !['avatars', 'banners', 'nfts', 'settings'].includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (10MB max for NFTs, 5MB for others)
    const maxSize = folder === 'nfts' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` }, { status: 400 })
    }

    // Create unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}_${randomString}.${extension}`
    const storagePath = `${folder}/${filename}`

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const supabase = createAdminClient()

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_UPLOADS_BUCKET || 'uploads'

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error (Supabase):', uploadError)
      if (uploadError.message?.includes('already exists')) {
        return NextResponse.json({ error: 'File already exists. Please try again.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
    const publicUrl = publicUrlData?.publicUrl

    if (!publicUrl) {
      console.error('Failed to generate public URL for upload:', storagePath)
      return NextResponse.json({ error: 'Failed to generate file URL' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    )
  }
}
