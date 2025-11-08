import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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
    const userId = resolvedParams.id

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('wallet_address')
      .eq('user_id', userId)

    // Get user's NFT count
    const { count: nftCount, error: nftError } = await supabase
      .from('nfts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)

    // Get user's transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Handle missing tables gracefully
    const finalNftCount = nftError && 
      (nftError.message.includes('relation "nfts" does not exist') ||
       nftError.message.includes('relation "public.nfts" does not exist'))
      ? 0 
      : (nftCount || 0)

    const finalTransactions = txError && 
      (txError.message.includes('relation "transactions" does not exist') ||
       txError.message.includes('relation "public.transactions" does not exist'))
      ? []
      : (transactions || [])

    const userWithData = {
      ...user,
      wallets: wallets || [],
      nftCount: finalNftCount,
      transactions: finalTransactions
    }

    return NextResponse.json({ data: userWithData })
  } catch (error) {
    console.error('Admin user detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createAdminClient()

    const body = await request.json().catch(() => ({}))
    const { status } = body || {}

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabase
      .from('Users')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('[Admin] Update user status failed:', error)
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin] Update user status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('Users')
      .update({
        status: 'banned',
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('[Admin] Delete user failed:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin] Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}