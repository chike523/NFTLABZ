const CACHE_TTL_MS = 60_000
const DEFAULT_SYMBOL = 'ETH'

type RateCacheEntry = {
  rate: number
  cachedAt: number
}

const rateCache: Record<string, RateCacheEntry> = {}

function getCache(symbol: string): RateCacheEntry | null {
  const key = symbol.toUpperCase()
  const entry = rateCache[key]
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    delete rateCache[key]
    return null
  }
  return entry
}

async function fetchRate(symbol: string, forceRefresh = false): Promise<number> {
  const key = symbol.toUpperCase()

  if (!forceRefresh) {
    const cached = getCache(key)
    if (cached) {
      return cached.rate
    }
  }

  const apiKey = process.env.CRYPTOCOMPARE_API_KEY
  const headers: Record<string, string> = {
    accept: 'application/json'
  }

  if (apiKey) {
    headers.authorization = `Apikey ${apiKey}`
  }

  const url = `https://min-api.cryptocompare.com/data/price?fsym=${encodeURIComponent(key)}&tsyms=USDT`
  const response = await fetch(url, {
    headers,
    next: { revalidate: CACHE_TTL_MS / 1000 }
  })

  if (!response.ok) {
    throw new Error(`CryptoCompare request failed: ${response.status}`)
  }

  const data = (await response.json()) as { USDT?: number }

  if (typeof data.USDT !== 'number') {
    throw new Error(`CryptoCompare response missing USDT rate for ${key}`)
  }

  rateCache[key] = {
    rate: data.USDT,
    cachedAt: Date.now()
  }

  return data.USDT
}

export async function getTokenToUsdtRate(symbol = DEFAULT_SYMBOL, forceRefresh = false): Promise<number> {
  return fetchRate(symbol, forceRefresh)
}

export async function getEthToUsdtRate(forceRefresh = false): Promise<number> {
  return fetchRate(DEFAULT_SYMBOL, forceRefresh)
}

export function convertTokenToUsdt(value?: number | null, symbol = DEFAULT_SYMBOL, rateOverride?: number): number | null {
  if (value === undefined || value === null) {
    return null
  }

  const key = symbol.toUpperCase()
  const rate = typeof rateOverride === 'number' ? rateOverride : getCache(key)?.rate

  if (typeof rate !== 'number') {
    return null
  }

  return value * rate
}

export function convertEthToUsdt(ethValue?: number | null, rate?: number): number | null {
  return convertTokenToUsdt(ethValue, DEFAULT_SYMBOL, rate)
}

export function formatCurrency(value: number | null | undefined, minimumFractionDigits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0.00'
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits
  })
}

export function formatEth(value: number | null | undefined, maximumFractionDigits = 4): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0'
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits
  })
}

