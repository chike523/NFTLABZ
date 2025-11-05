"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, QrCode, AlertTriangle, Wallet, Info, Loader2, CheckCircle2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import QRCode from "qrcode"

interface DepositWallet {
  id: string
  name: string
  address: string
  network: string
  is_active: boolean
  description: string | null
}

const NETWORK_METADATA: Record<string, {
  label: string
  symbol: string
  minDeposit: string
  confirmations: string
  unlockTime: string
}> = {
  ethereum: {
    label: "Ethereum (ERC20)",
    symbol: "ETH",
    minDeposit: "0.0001 ETH",
    confirmations: "≈ 12 network confirmations",
    unlockTime: "≈ 56 confirmations"
  },
  polygon: {
    label: "Polygon (PoS)",
    symbol: "MATIC",
    minDeposit: "1.0 MATIC",
    confirmations: "≈ 128 confirmations",
    unlockTime: "≈ 256 confirmations"
  },
  bsc: {
    label: "BNB Smart Chain (BEP20)",
    symbol: "BNB",
    minDeposit: "0.01 BNB",
    confirmations: "≈ 15 confirmations",
    unlockTime: "≈ 30 confirmations"
  },
  arbitrum: {
    label: "Arbitrum One",
    symbol: "ETH",
    minDeposit: "0.0001 ETH",
    confirmations: "≈ 40 confirmations",
    unlockTime: "≈ 80 confirmations"
  },
  optimism: {
    label: "Optimism",
    symbol: "ETH",
    minDeposit: "0.0001 ETH",
    confirmations: "≈ 30 confirmations",
    unlockTime: "≈ 60 confirmations"
  },
  base: {
    label: "Base",
    symbol: "ETH",
    minDeposit: "0.0001 ETH",
    confirmations: "≈ 24 confirmations",
    unlockTime: "≈ 48 confirmations"
  }
}

export default function DepositPage() {
  return (
    <DashboardLayout>
      <DepositContent />
    </DashboardLayout>
  )
}

function DepositContent() {
  const router = useRouter()
  const [wallets, setWallets] = useState<DepositWallet[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [amountError, setAmountError] = useState<string | null>(null)
  const [usdPreview, setUsdPreview] = useState<string>(formatCurrency(0))
  const [tokenRate, setTokenRate] = useState<number | null>(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin/wallets', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load deposit wallets')
        }

        const activeWallets = (data.data || []).filter((wallet: DepositWallet) => wallet.is_active)

        setWallets(activeWallets)
        setSelectedWalletId((prev) => {
          if (prev && activeWallets.some((wallet) => wallet.id === prev)) {
            return prev
          }
          return activeWallets[0]?.id ?? null
        })
      } catch (fetchError) {
        console.error('Failed to fetch deposit wallets:', fetchError)
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load wallets')
      } finally {
        setLoading(false)
      }
    }

    loadWallets()
  }, [])

  const selectedWallet = useMemo(
    () => wallets.find(wallet => wallet.id === selectedWalletId) ?? null,
    [wallets, selectedWalletId]
  )

  useEffect(() => {
    let isMounted = true

    const createQrCode = async () => {
      if (!selectedWallet) {
        setQrDataUrl(null)
        return
      }

      const networkKey = selectedWallet.network?.toLowerCase() || 'ethereum'
      const cleanAddress = selectedWallet.address.trim()
      const payload = cleanAddress

      try {
        const dataUrl = await QRCode.toDataURL(payload, {
          margin: 2,
          width: 320,
          color: {
            dark: '#07090d',
            light: '#ffffff'
          }
        })
        if (isMounted) {
          setQrDataUrl(dataUrl)
        }
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError)
        if (isMounted) {
          setQrDataUrl(null)
        }
      }
    }

    createQrCode()

    return () => {
      isMounted = false
    }
  }, [selectedWallet])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopyAddress = async () => {
    if (!selectedWallet) return
    try {
      await navigator.clipboard.writeText(selectedWallet.address)
      setCopied(true)
    } catch (err) {
      console.error('Failed to copy address: ', err)
    }
  }

  const networkKey = selectedWallet?.network?.toLowerCase() || 'ethereum'
  const networkInfo = NETWORK_METADATA[networkKey] || NETWORK_METADATA.ethereum
  const tokenSymbol = networkInfo.symbol

  useEffect(() => {
    if (!selectedWallet) {
      setTokenRate(null)
      return
    }

    const controller = new AbortController()

    const fetchRate = async () => {
      try {
        setRateLoading(true)
        const response = await fetch(`/api/rates/eth-usdt?symbol=${encodeURIComponent(tokenSymbol)}`, {
          cache: 'no-store',
          signal: controller.signal
        })
        const data = await response.json()

        if (!response.ok || typeof data.rate !== 'number') {
          throw new Error(data.error || 'Unable to fetch conversion rate')
        }

        setTokenRate(data.rate)
      } catch (rateError) {
        if (rateError instanceof DOMException && rateError.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch token rate:', rateError)
        setTokenRate(null)
      } finally {
        setRateLoading(false)
      }
    }

    fetchRate()

    return () => controller.abort()
  }, [selectedWalletId, tokenSymbol, selectedWallet])

  useEffect(() => {
    if (!tokenRate) {
      setUsdPreview(formatCurrency(0))
      return
    }

    const parsed = parseFloat(amount)
    if (Number.isFinite(parsed) && parsed > 0) {
      setUsdPreview(formatCurrency(parsed * tokenRate))
    } else {
      setUsdPreview(formatCurrency(0))
    }
  }, [amount, tokenRate])

  const handleAmountChange = (value: string) => {
    if (!selectedWallet) {
      setAmount(value)
      return
    }

    if (value === '' || /^\d*\.?\d{0,8}$/.test(value)) {
      setAmount(value)
      setAmountError(null)
    }
  }

  const validateAmount = () => {
    const parsed = parseFloat(amount)
    if (!selectedWallet) {
      setAmountError('Select a wallet before entering an amount')
      return false
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setAmountError('Enter a valid deposit amount greater than zero')
      return false
    }
    setAmountError(null)
    return true
  }

  const handleSubmit = async () => {
    if (!selectedWallet) {
      toast({ title: 'Select a wallet', description: 'Choose a deposit wallet before submitting.', variant: 'destructive' })
      return
    }

    if (!validateAmount()) {
      return
    }

    const parsedAmount = parseFloat(amount)
    const usdAmount = tokenRate ? parsedAmount * tokenRate : null

    try {
      setSubmitting(true)
      const response = await fetch('/api/dashboard/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: selectedWallet.id,
          amount: parsedAmount,
          symbol: tokenSymbol,
          usdAmount,
          network: networkKey
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deposit request')
      }

      toast({
        title: 'Deposit initiated',
        description: 'We created a pending deposit. Send funds to the selected address and wait for confirmations.'
      })

      setAmount('')
      setUsdPreview(formatCurrency(0))

      const params = new URLSearchParams({ newDeposit: '1', amount: parsedAmount.toString(), symbol: tokenSymbol })
      router.push(`/dashboard/transactions?${params.toString()}`)
    } catch (submitError) {
      console.error('Deposit submission failed:', submitError)
      toast({
        title: 'Deposit failed',
        description: submitError instanceof Error ? submitError.message : 'Unable to submit deposit request.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Deposit</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Deposit cryptocurrency to your wallet
            </p>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="h-52 w-52 rounded-lg" />
                  <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-start gap-3 text-sm text-red-200">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Unable to load deposit wallets.</p>
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            ) : wallets.length === 0 ? (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3 text-sm text-yellow-100">
                  <Info className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">No deposit wallets configured.</p>
                    <p className="text-xs text-yellow-200">Please contact support or an administrator to add a deposit wallet before continuing.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Wallet Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Deposit wallet</label>
                  <Select
                    value={selectedWalletId ?? undefined}
                    onValueChange={setSelectedWalletId}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Choose a wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => {
                        const info = NETWORK_METADATA[wallet.network?.toLowerCase()] || NETWORK_METADATA.ethereum
                        return (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{wallet.name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-2">
                                <Wallet className="h-3 w-3" />
                                {info.label}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedWallet?.description && (
                    <p className="text-xs text-muted-foreground">{selectedWallet.description}</p>
                  )}
                </div>

                {/* QR Code Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Scan QR Code</h3>
                    <div className="inline-block rounded-lg border border-border bg-white p-4">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR code for ${selectedWallet?.name}`}
                          className="h-48 w-48 select-none"
                        />
                      ) : (
                        <div className="flex h-48 w-48 items-center justify-center rounded bg-muted">
                          <QrCode className="h-24 w-24 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Only send {networkInfo.symbol} on {networkInfo.label} to this address.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deposit Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Deposit Address</label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1 rounded-lg border border-border bg-muted p-3">
                      <code className="break-all text-sm text-foreground">
                        {selectedWallet?.address}
                      </code>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyAddress}
                      className="justify-center px-3"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="ml-2 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>

                {/* Deposit Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Amount ({tokenSymbol})</label>
                  <Input
                    value={amount}
                    onChange={(event) => handleAmountChange(event.target.value)}
                    placeholder={`Enter ${tokenSymbol} amount`}
                    inputMode="decimal"
                    className={amountError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      ≈ {rateLoading ? 'Fetching rate…' : `$${usdPreview}`} {rateLoading ? '' : 'USD'}
                    </span>
                    <span>Minimum deposit: {networkInfo.minDeposit}</span>
                  </div>
                  {amountError && (
                    <p className="text-xs text-red-400">{amountError}</p>
                  )}
                </div>

                {/* Network Information */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Network</label>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs uppercase">
                        {networkInfo.symbol}
                      </Badge>
                      <span className="text-sm text-foreground">{networkInfo.label}</span>
                    </div>
                  </div>
                </div>

                {/* Deposit Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Deposit Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Minimum deposit</span>
                      <p className="text-sm font-medium text-foreground">{networkInfo.minDeposit}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Expected arrival</span>
                      <p className="text-sm font-medium text-foreground">{networkInfo.confirmations}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Expected unlock</span>
                      <p className="text-sm font-medium text-foreground">{networkInfo.unlockTime}</p>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Important Notes</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Only send {networkInfo.symbol} via the {networkInfo.label} network to this address.</li>
                    <li>• Deposits are processed automatically after sufficient confirmations.</li>
                    <li>• Minimum deposit amount: {networkInfo.minDeposit}</li>
                    <li>• Deposits may take several minutes to appear in your balance.</li>
                    <li>• Sending other assets may result in permanent loss.</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedWallet || loading}
                    className="min-w-[160px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Submit Deposit
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  )
}
