'use client'

import { motion } from 'framer-motion'
import { WalletStats } from '../types/wallet'

interface WalletStatsTableProps {
  stats: WalletStats | null;
}

export function WalletStatsTable({ stats }: WalletStatsTableProps) {
  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white bg-opacity-80 backdrop-blur-md rounded-lg p-6 shadow-lg mb-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-sm font-medium text-gray-500">Provider</h3>
          <p className="text-gray-900">{stats.provider}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-sm font-medium text-gray-500">Address</h3>
          <p className="text-gray-900 font-mono text-sm">{stats.address}</p>
        </div>
        <div className="col-span-2">
          <h3 className="text-sm font-medium text-gray-500">Network</h3>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <p className="text-xs text-gray-500">Protocol Family</p>
              <p className="text-gray-900">{stats.network.protocolFamily}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Network ID</p>
              <p className="text-gray-900">{stats.network.networkId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Chain ID</p>
              <p className="text-gray-900">{stats.network.chainId}</p>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <h3 className="text-sm font-medium text-gray-500">Balances</h3>
          <div className="mt-1">
            <p className="text-gray-900">{stats.ethBalance} ETH</p>
            {stats.balances && Object.entries(stats.balances).map(([token, amount]) => (
              <p key={token} className="text-gray-900">
                {amount} {token}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
} 