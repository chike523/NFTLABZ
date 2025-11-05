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

    const { data, error } = await supabase
      .from('deposit_wallets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching deposit wallets:', error)
      return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Admin wallets API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      console.warn('Admin client failed, falling back to regular client:', adminError)
      supabase = await createClient()
    }

    const body = await request.json()
    const { name, address, network, description, isActive, createdBy } = body

    // Validate required fields
    if (!name || !address || !network) {
      return NextResponse.json({ 
        error: 'Name, address, and network are required' 
      }, { status: 400 })
    }

    // Validate wallet address format (basic Ethereum address validation)
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

    // Check if address already exists
    const { data: existingWallet } = await supabase
      .from('deposit_wallets')
      .select('id')
      .eq('address', address)
      .single()

    if (existingWallet) {
      return NextResponse.json({ 
        error: 'Wallet address already exists' 
      }, { status: 400 })
    }

    // Create wallet
    const walletData: any = {
      name,
      address,
      network,
      description: description || null,
      is_active: isActive !== undefined ? isActive : true
    }
    
    // Only add created_by if it's a valid UUID
    if (createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(createdBy)) {
      walletData.created_by = createdBy
    }
    
    const { data, error } = await supabase
      .from('deposit_wallets')
      .insert(walletData)
      .select()
      .single()

    if (error) {
      console.error('Error creating deposit wallet:', error)
      return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Admin wallet creation error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

