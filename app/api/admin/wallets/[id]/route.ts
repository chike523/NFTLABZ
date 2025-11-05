import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      console.warn('Admin client failed, falling back to regular client:', adminError)
      supabase = await createClient()
    }

    const body = await request.json()
    const { name, address, network, description, isActive } = body

    // Validate required fields
    if (!name || !address || !network) {
      return NextResponse.json({ 
        error: 'Name, address, and network are required' 
      }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ 
        error: 'Invalid wallet address format' 
      }, { status: 400 })
    }

    // Validate network
    const validNetworks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base']
    if (!validNetworks.includes(network)) {
      return NextResponse.json({ 
        error: 'Invalid network. Must be one of: ' + validNetworks.join(', ') 
      }, { status: 400 })
    }

    // Check if address already exists (excluding current wallet)
    const { data: existingWallet } = await supabase
      .from('deposit_wallets')
      .select('id')
      .eq('address', address)
      .neq('id', resolvedParams.id)
      .single()

    if (existingWallet) {
      return NextResponse.json({ 
        error: 'Wallet address already exists' 
      }, { status: 400 })
    }

    // Update wallet
    const { error } = await supabase
      .from('deposit_wallets')
      .update({
        name,
        address,
        network,
        description: description || null,
        is_active: isActive !== undefined ? isActive : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Error updating deposit wallet:', error)
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin wallet update error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      console.warn('Admin client failed, falling back to regular client:', adminError)
      supabase = await createClient()
    }

    // Delete wallet
    const { error } = await supabase
      .from('deposit_wallets')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Error deleting deposit wallet:', error)
      return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin wallet deletion error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

