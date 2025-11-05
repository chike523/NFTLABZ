"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import StatsCard from "@/components/admin/stats-card"
import { Users, Layers, CreditCard, TrendingUp } from "lucide-react"
import { adminQueries } from "@/lib/queries/admin"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNFTs: 0,
    totalTransactions: 0,
    platformRevenue: "0 ETH"
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true)

        // Fetch dashboard stats using admin queries
        const { data: dashboardStats, error: statsError } = await adminQueries.getDashboardStats()
        
        if (statsError) {
          console.error('Error fetching dashboard stats:', statsError)
        } else if (dashboardStats) {
          setStats({
            totalUsers: dashboardStats.totalUsers,
            totalNFTs: dashboardStats.totalNFTs,
            totalTransactions: dashboardStats.totalTransactions,
            platformRevenue: dashboardStats.platformRevenue
          })
        }

        // Fetch recent transactions
        const { data: transactions, error: txError } = await adminQueries.getAllTransactions(10, 0)
        
        if (txError) {
          console.error('Error fetching transactions:', txError)
        } else {
          setRecentTransactions(transactions || [])
        }

      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminStats()
  }, [])

  return (
    <AdminLayout>
      <AdminHeader title="Dashboard" />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers.toString()}
            change="+0%"
            iconColor="text-blue-500"
          />
          <StatsCard
            icon={Layers}
            label="Total NFTs"
            value={stats.totalNFTs.toString()}
            change="+0%"
            iconColor="text-green-500"
          />
          <StatsCard
            icon={CreditCard}
            label="Total Transactions"
            value={stats.totalTransactions.toString()}
            change="+0%"
            iconColor="text-purple-500"
          />
          <StatsCard
            icon={TrendingUp}
            label="Platform Revenue"
            value={stats.platformRevenue}
            change="+0%"
            iconColor="text-orange-500"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
                             <thead className="bg-gray-700/50">
                 <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      Loading transactions...
                    </td>
                  </tr>
                ) : recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="text-sm text-gray-300 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono">{transaction.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 capitalize">
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{transaction.user?.username || `User ${transaction.user_id?.slice(0, 8)}...`}</td>
                      <td className="px-6 py-4 font-medium">{transaction.amount_eth} ETH</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed" ? "bg-green-500/10 text-green-400" :
                          transaction.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-red-500/10 text-red-400"
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
