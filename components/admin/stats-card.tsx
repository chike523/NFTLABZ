import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: number
  iconColor?: string
}

export default function StatsCard({ icon: Icon, label, value, change, iconColor = "text-blue-500" }: StatsCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", iconColor === "text-blue-500" && "bg-blue-500/10", iconColor === "text-green-500" && "bg-green-500/10", iconColor === "text-purple-500" && "bg-purple-500/10", iconColor === "text-orange-500" && "bg-orange-500/10")}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        {change !== undefined && (
          <span className={cn(
            "text-sm font-medium px-2 py-1 rounded-full",
            isPositive && "bg-green-500/10 text-green-400",
            isNegative && "bg-red-500/10 text-red-400",
            !isPositive && !isNegative && "bg-gray-700 text-gray-400"
          )}>
            {isPositive && "+"}{change}%
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}
