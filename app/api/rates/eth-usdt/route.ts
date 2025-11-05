import { NextResponse } from 'next/server'
import { getTokenToUsdtRate } from '@/lib/utils/currency'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'
    const symbol = (searchParams.get('symbol') || 'ETH').toUpperCase()

    const rate = await getTokenToUsdtRate(symbol, forceRefresh)

    return NextResponse.json({ rate, symbol })
  } catch (error) {
    console.error('Token→USDT rate fetch failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch token to USDT rate'
      },
      { status: 502 }
    )
  }
}

