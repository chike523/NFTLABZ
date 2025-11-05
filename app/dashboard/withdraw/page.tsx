"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clipboard, Info, Loader2, Send } from "lucide-react"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { userQueries } from "@/lib/queries"
import { useToast } from "@/hooks/use-toast"

export default function WithdrawPage() {
  const [transactionType, setTransactionType] = useState<'onchain' | 'internal'>('internal')
  const [recipientValue, setRecipientValue] = useState('')
  const [network, setNetwork] = useState('ETH')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [balance, setBalance] = useState(0)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch user balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return
      
      setLoadingBalance(true)
      try {
        const result = await userQueries.getUserWalletBalance(user.id)
        setBalance(result.balance_eth)
      } catch (error) {
        console.error('Error fetching balance:', error)
      } finally {
        setLoadingBalance(false)
      }
    }

    fetchBalance()
  }, [user?.id])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRecipientValue(text)
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err)
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!recipientValue.trim()) {
      newErrors.recipient = 'Recipient is required'
    } else if (transactionType === 'internal' && !/\S+@\S+\.\S+/.test(recipientValue)) {
      newErrors.recipient = 'Please enter a valid email address'
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    } else if (Number(amount) < 0.02) {
      newErrors.amount = 'Minimum withdrawal amount is 0.02'
    } else if (transactionType === 'onchain' && Number(amount) > balance) {
      newErrors.amount = 'You do not have enough in your wallet'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleWithdraw = async () => {
    console.log('Withdraw button clicked')
    console.log('Transaction type:', transactionType)
    console.log('Recipient:', recipientValue)
    console.log('Amount:', amount)
    console.log('Balance:', balance)
    
    const isValid = validateForm()
    console.log('Form validation result:', isValid)
    console.log('Errors:', errors)
    
    if (!isValid) {
      console.log('Validation failed, stopping')
      return
    }

    setIsLoading(true)
    try {
      if (transactionType === 'onchain') {
        console.log('Processing onchain withdrawal...')
        
        // Real API call for onchain withdrawal
        const response = await fetch('/api/dashboard/withdrawals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: recipientValue,
            amount: parseFloat(amount),
            network
          })
        })

        const data = await response.json()
        console.log('API response:', data)

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create withdrawal request')
        }

        toast({
          title: 'Withdrawal initiated',
          description: `Your withdrawal request for ${amount} ${network} has been submitted for approval.`
        })

        // Reset form
        setRecipientValue('')
        setAmount('')

        // Redirect to transactions page
        router.push(`/dashboard/transactions?newWithdrawal=1&amount=${amount}&symbol=${network}`)
      } else {
        console.log('Processing internal transfer...')
        
        // Keep internal transaction as mock for now
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log('Internal withdrawal submitted:', {
          recipientEmail: recipientValue,
          network,
          amount
        })
        
        toast({
          title: 'Internal transfer',
          description: 'Internal transfer functionality coming soon.'
        })
        
        setRecipientValue('')
        setAmount('')
      }
    } catch (error) {
      console.error('Withdrawal failed:', error)
      toast({
        title: 'Withdrawal failed',
        description: error instanceof Error ? error.message : 'Failed to process withdrawal',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Withdrawal</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Withdraw your funds to external wallet or internal account
            </p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available Balance</span>
            <span className="text-lg font-semibold text-foreground">
              {loadingBalance ? '...' : `${balance.toFixed(4)} ETH`}
            </span>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <form className="space-y-6">
            {/* Transaction Type Selection */}
            <div className="space-y-4">
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTransactionType('onchain')}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                    transactionType === 'onchain'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  On chain
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('internal')}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                    transactionType === 'internal'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  Internal
                </button>
              </div>

              {/* Internal Transaction Info */}
              {transactionType === 'internal' && (
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        What is internal transaction?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Internal transactions are transactions between users within the app. 
                        It would not be processed through the blockchain and requires no gas fee.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recipient Input Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {transactionType === 'onchain' ? 'Wallet Address' : 'Recipient Email'}
              </label>
              <div className="flex gap-2">
                <Input
                  value={recipientValue}
                  onChange={(e) => setRecipientValue(e.target.value)}
                  placeholder={
                    transactionType === 'onchain' 
                      ? 'Enter wallet address (0x...)' 
                      : 'Enter recipient email address'
                  }
                  type={transactionType === 'internal' ? 'email' : 'text'}
                  className={cn(
                    "flex-1 text-sm sm:text-base",
                    errors.recipient && "border-red-500 focus:border-red-500"
                  )}
                />
                {transactionType === 'onchain' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePaste}
                    className="px-3"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.recipient && (
                <p className="text-xs text-red-400">{errors.recipient}</p>
              )}
            </div>

            {/* Network Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Network</label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Withdrawal Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Withdrawal Amount</label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "text-sm sm:text-base",
                  errors.amount && "border-red-500 focus:border-red-500"
                )}
              />
              <p className="text-xs text-muted-foreground">Min 0.02</p>
              {errors.amount && (
                <p className="text-xs text-red-400">{errors.amount}</p>
              )}
            </div>

            {/* Withdraw Button */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleWithdraw}
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Withdrawal...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Withdraw
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
