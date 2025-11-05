"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSiteName } from '@/hooks/use-settings'

export default function Footer() {
  const siteName = useSiteName()
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-[#1A1A1A] text-white py-12">
      <div className="container mx-auto px-4">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {/* Categories Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/category/arts" className="text-white hover:text-gray-300 transition-colors">Arts</Link></li>
              <li><Link href="/category/gaming" className="text-white hover:text-gray-300 transition-colors">Gaming</Link></li>
              <li><Link href="/category/pfps" className="text-white hover:text-gray-300 transition-colors">PFPS</Link></li>
              <li><Link href="/category/membership" className="text-white hover:text-gray-300 transition-colors">Membership</Link></li>
              <li><Link href="/category/photography" className="text-white hover:text-gray-300 transition-colors">Photography</Link></li>
              <li><Link href="/category/exhibition" className="text-white hover:text-gray-300 transition-colors">Exhibition</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className="text-white hover:text-gray-300 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-white hover:text-gray-300 transition-colors">Terms of service</Link></li>
            </ul>
          </div>

          {/* Account Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-white hover:text-gray-300 transition-colors">Account Overview</Link></li>
              <li><Link href="/dashboard/mint" className="text-white hover:text-gray-300 transition-colors">Mint Nft</Link></li>
              <li><Link href="/dashboard/transactions" className="text-white hover:text-gray-300 transition-colors">Transaction</Link></li>
            </ul>
          </div>

          {/* Stay in touch Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold mb-4">Stay in touch</h3>
            <p className="text-sm text-white mb-4">
              Don't miss anything, Stay in touch with us and get real time update.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                type="email" 
                placeholder="Email Address" 
                className="bg-transparent border-white text-white placeholder:text-gray-400 focus:border-white flex-1"
              />
              <Button 
                type="submit" 
                className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-6 whitespace-nowrap"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom section with copyright */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-600">
          <p className="text-sm text-white">
            © Copyright {currentYear} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
