"use client"

interface Transaction {
  id?: string
  type: string
  amount_eth?: number
  amount?: string
  created_at?: string
  date?: string
  status: 'pending' | 'completed' | 'failed'
  nft?: {
    title?: string
  }
  from_address?: string
  to_address?: string
  admin_note?: string | null
}

interface TransactionTableProps {
  transactions: Transaction[]
  emptyMessage?: string
}

export default function TransactionTable({ transactions, emptyMessage = "No transactions available" }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  const parseTransactionMeta = (transaction: Transaction): { label: string; note?: string | null } => {
    if (transaction.admin_note) {
      try {
        const parsed = JSON.parse(transaction.admin_note)
        if (parsed && typeof parsed === 'object') {
          const label =
            typeof parsed.label === 'string' && parsed.label.trim()
              ? parsed.label.trim()
              : transaction.type

          const note =
            typeof parsed.note === 'string' && parsed.note.trim() ? parsed.note.trim() : null

          return { label, note }
        }
      } catch (error) {
        console.warn('Failed to parse transaction admin_note metadata:', error)
      }
    }

    return { label: transaction.type }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'pending':
        return 'text-yellow-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const getTypeColor = (type: string) => {
    const typeStr = type.toLowerCase()
    if (typeStr === 'withdrawal') return 'text-red-500'
    if (typeStr === 'deposit') return 'text-green-500'
    if (typeStr === 'buy') return 'text-blue-500'
    if (typeStr === 'sell') return 'text-green-500'
    return 'text-foreground'
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-muted px-4 py-3 border-b border-border">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
          <div>Type</div>
          <div>Amount</div>
          <div>Date</div>
          <div>Status</div>
        </div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y divide-border">
        {transactions.map((transaction, index) => {
          // Handle both old mock data format and new database format
          const amount = transaction.amount || `${transaction.amount_eth || 0} ETH`
          const date = transaction.date || (transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'Unknown')
          const transactionMeta = parseTransactionMeta(transaction)
          const type = transactionMeta.label.charAt(0).toUpperCase() + transactionMeta.label.slice(1)

          return (
            <div key={transaction.id || index} className="px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className={`font-medium ${getTypeColor(transaction.type)}`}>
                  {type}
                  {transaction.nft?.title && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {transaction.nft.title}
                    </div>
                  )}
                  {transactionMeta.note && (
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {transactionMeta.note}
                    </div>
                  )}
                </div>
                <div className="text-foreground">
                  {(transaction.type === 'withdrawal' || transaction.type === 'buy') ? '-' : ''}{amount}
                </div>
                <div className="text-muted-foreground">{date}</div>
                <div className={`font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
