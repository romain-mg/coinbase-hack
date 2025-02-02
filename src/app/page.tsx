'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MotionHeader } from "@/app/components/MotionHeader"
import { WalletStats } from './types/wallet'
import { WalletStatsTable } from './components/WalletStatsTable'
const CHAT_SUGGESTIONS = [
  "🔍 Analyze my wallet activity",
  "💰 Check my investment performance",
  "📊 Get portfolio insights",
  "🌟 Recommend investment strategies",
  "📈 Compare with market trends",
  "🤔 Explain recent transactions",
];

function parseWalletStats(content: string): WalletStats | null {
  try {
    // Look for the Wallet Details section
    const walletDetailsMatch = content.match(/Wallet Details:[\s\S]*?(?=\n\n|$)/);
    if (!walletDetailsMatch) return null;

    const walletDetails = walletDetailsMatch[0];
    
    // Extract individual components using regex
    const addressMatch = walletDetails.match(/Address: (0x[a-fA-F0-9]+)/);
    const protocolMatch = walletDetails.match(/Protocol Family: (\w+)/);
    const networkIdMatch = walletDetails.match(/Network ID: ([^\n]+)/);
    const chainIdMatch = walletDetails.match(/Chain ID: (\d+)/);
    const ethBalanceMatch = walletDetails.match(/ETH Balance: ([0-9.]+)/);
    
    if (!addressMatch) return null;

    return {
      provider: "cdp_wallet_provider",
      address: addressMatch[1],
      network: {
        protocolFamily: protocolMatch?.[1] || "evm",
        networkId: networkIdMatch?.[1].trim() || "base-sepolia",
        chainId: parseInt(chainIdMatch?.[1] || "84532"),
      },
      ethBalance: ethBalanceMatch?.[1] || "0",
      balances: {} // Add any additional token balances if needed
    };
  } catch (error) {
    console.error('Error parsing wallet stats:', error);
    return null;
  }
}

export default function Home() {
  const [currentResponse, setCurrentResponse] = useState<string | null>(null)
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setCurrentResponse(null)
    setWalletStats(null)

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const responseText = data.response;
      
      // Try to parse wallet stats from the response
      const stats = parseWalletStats(responseText);
      if (stats) {
        setWalletStats(stats);
        // Remove the wallet details section from the displayed response
        const cleanResponse = responseText.replace(/Wallet Details:[\s\S]*?\n\n/, '').trim();
        setCurrentResponse(cleanResponse);
      } else {
        setCurrentResponse(responseText);
      }
    } catch (error) {
      console.error('Error:', error)
      setCurrentResponse('Sorry, something went wrong.')
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-br from-blue-100 to-purple-100 pt-20 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-blue-400 bg-blue-200 rounded-full px-4 py-1 font-medium mb-2 w-fit mx-auto"
          >
            AI POWERED
          </motion.div>
          
          <MotionHeader />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="relative">
              <Input
                type="text"
                placeholder="Ask about your wallet or investments..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                className="w-full text-2xl p-6 rounded-full shadow-lg focus:ring-0 
                  transition-all duration-300 bg-white bg-opacity-80 
                  backdrop-blur-md pr-16"
                disabled={isLoading}
              />
              <Button
                type="submit"
                onClick={(e) => handleSubmit(e)}
                className="absolute right-2 top-2 rounded-full 
                  bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {CHAT_SUGGESTIONS.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => {
                    setInput(suggestion)
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                  }}
                  className="px-4 py-2 text-sm bg-white/50 hover:bg-white/80 
                    text-gray-600 rounded-full transition-all duration-200 
                    backdrop-blur-sm border border-gray-200/50 
                    hover:border-gray-300/50 hover:shadow-sm"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Response Container */}
      <div className="mt-[500px] w-full max-w-4xl mx-auto px-4 pb-8">
        {(isLoading || currentResponse || walletStats) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wallet Stats Column */}
            <div>
              <WalletStatsTable stats={walletStats} />
            </div>
            
            {/* Response Column */}
            {(isLoading || currentResponse) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white bg-opacity-80 backdrop-blur-md rounded-lg p-6 shadow-lg h-fit"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                    <p className="text-gray-600">Analyzing...</p>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{currentResponse}</p>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
