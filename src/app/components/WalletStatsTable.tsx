'use client'

import { motion } from 'framer-motion'
import { WalletStats } from '../types/wallet'

interface WalletStatsTableProps {
  stats: WalletStats | null;
}

export function WalletStatsTable({ stats }: WalletStatsTableProps) {
  if (!stats) return null;

  // Function to shorten address
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-md 
        rounded-2xl p-8 shadow-lg border border-white/20 h-fit space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Wallet Details</h2>
        <span className="text-base bg-blue-100 text-blue-600 px-4 py-2 rounded-full font-medium">
          {stats.network.networkId}
        </span>
      </div>

      <div className="space-y-6">
        {/* Address */}
        <div className="bg-white/50 p-6 rounded-xl border border-gray-100">
          <p className="text-lg text-gray-500 mb-2 font-medium">Address</p>
          <p className="font-mono text-2xl font-medium text-gray-800">
            {shortenAddress(stats.address)}
          </p>
        </div>

        {/* Protocol */}
        <div className="bg-white/50 p-6 rounded-xl border border-gray-100">
          <p className="text-lg text-gray-500 mb-2 font-medium">Protocol</p>
          <p className="text-2xl font-medium text-gray-800">
            {stats.network.protocolFamily}
          </p>
        </div>

        {/* Chain ID */}
        <div className="bg-white/50 p-6 rounded-xl border border-gray-100">
          <p className="text-lg text-gray-500 mb-2 font-medium">Chain ID</p>
          <p className="text-2xl font-medium text-gray-800">
            {stats.network.chainId}
          </p>
        </div>

        {/* Balances */}
        <div className="bg-white/50 p-6 rounded-xl border border-gray-100">
          <p className="text-lg text-gray-500 mb-4 font-medium">Balances</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xl text-gray-600">ETH</span>
              <span className="text-xl font-medium text-gray-800">{stats.ethBalance}</span>
            </div>
            {stats.balances && Object.entries(stats.balances).map(([token, amount]) => (
              <div key={token} className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xl text-gray-600">{token}</span>
                <span className="text-xl font-medium text-gray-800">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
} 