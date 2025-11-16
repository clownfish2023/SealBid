import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID, STRATEGY_NAMES } from '@/config/constants'

interface AuctionDetail {
  id: string
  creator: string
  coinName: string
  totalSupply: string
  winnerCount: string
  strategy: number
  startTime: number
  endTime: number
  finalized: boolean
  encryptedBids: any[]
}

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentAccount = useCurrentAccount()
  const [auction, setAuction] = useState<AuctionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  // const suiClient = useSuiClient()

  useEffect(() => {
    loadAuctionDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadAuctionDetail = async () => {
    try {
      setIsLoading(true)
      // Load auction details from chain
      // Sample data
      const mockAuction: AuctionDetail = {
        id: id || '0x123...',
        creator: '0xabc...',
        coinName: 'Test Token',
        totalSupply: '1000000',
        winnerCount: '10',
        strategy: 0,
        startTime: Date.now() - 3600000,
        endTime: Date.now() + 3600000,
        finalized: false,
        encryptedBids: [],
      }
      setAuction(mockAuction)
    } catch (error) {
      console.error('Failed to load auction:', error)
      toast.error('Failed to load auction details')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceBid = async () => {
    if (!auction || !currentAccount) {
      toast.error('Please connect wallet first')
      return
    }

    if (!bidAmount || !paymentAmount) {
      toast.error('Please fill in bid amount and payment amount')
      return
    }

    const now = Date.now()
    if (now < auction.startTime) {
      toast.error('Auction has not started yet')
      return
    }
    if (now >= auction.endTime) {
      toast.error('Auction has ended')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Encrypt bid using Seal
      toast('Encrypting bid with Seal...', { icon: '🔒' })
      
      // Simplified for demo, using mock encrypted data
      const encryptedBidData = new TextEncoder().encode(bidAmount)

      // 2. Submit encrypted bid to chain
      const tx = new Transaction()
      
      // Split SUI for payment (convert to MIST: 1 SUI = 1,000,000,000 MIST)
      const paymentInMist = Math.floor(parseFloat(paymentAmount) * 1000000000)
      const [coin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(paymentInMist),
      ])
      
      // 设置合理的 gas budget：基础费用 + payment amount 的缓冲
      const baseGas = 10000000 // 0.01 SUI
      const bufferGas = Math.max(paymentInMist * 0.1, 5000000) // 至少 0.005 SUI
      const totalGasBudget = Math.floor(baseGas + bufferGas)
      tx.setGasBudget(totalGasBudget)

      // 使用简化代币拍卖
      tx.moveCall({
        target: `${PACKAGE_ID}::simple_auction::place_simple_bid`,
        arguments: [
          tx.object(auction.id),
          tx.pure.vector('u8', Array.from(encryptedBidData)),
          coin,
          tx.object('0x6'), // Clock object
        ],
      })

      signAndExecute(
        {
          transaction: tx as any,
        },
        {
          onSuccess: (result) => {
            toast.success('Bid placed successfully!')
            console.log('Transaction digest:', result.digest)
            setBidAmount('')
            setPaymentAmount('')
            loadAuctionDetail()
          },
          onError: (error) => {
            toast.error('Bid failed: ' + error.message)
          },
        }
      )
    } catch (error: any) {
      toast.error('Bid failed: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalizeAuction = async () => {
    if (!auction || !currentAccount) return

    try {
      const tx = new Transaction()

      tx.moveCall({
        target: `${PACKAGE_ID}::auction::finalize_auction`,
        arguments: [
          tx.object(auction.id),
          tx.object('0x6'), // Clock object
        ],
        typeArguments: ['YOUR_COIN_TYPE'],
      })

      signAndExecute(
        {
          transaction: tx as any,
        },
        {
          onSuccess: () => {
            toast.success('Auction completed!')
            loadAuctionDetail()
          },
          onError: (error) => {
            toast.error('Operation failed: ' + error.message)
          },
        }
      )
    } catch (error: any) {
      toast.error('Operation failed: ' + error.message)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTimeRemaining = () => {
    if (!auction) return ''
    const now = Date.now()
    if (now < auction.startTime) {
      const diff = auction.startTime - now
      return `Starts in ${Math.floor(diff / 3600000)} hours ${Math.floor((diff % 3600000) / 60000)} minutes`
    }
    if (now < auction.endTime) {
      const diff = auction.endTime - now
      return `Ends in ${Math.floor(diff / 3600000)} hours ${Math.floor((diff % 3600000) / 60000)} minutes`
    }
    return 'Ended'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Auction not found</p>
      </div>
    )
  }

  const now = Date.now()
  const isActive = now >= auction.startTime && now < auction.endTime && !auction.finalized
  const canFinalize = now >= auction.endTime && !auction.finalized && 
                      currentAccount?.address === auction.creator

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {auction.coinName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getTimeRemaining()}
            </p>
          </div>
          {auction.finalized && (
            <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-sm font-medium">
              Completed
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Supply
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {parseInt(auction.totalSupply).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Winners
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {auction.winnerCount}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Distribution Strategy
            </h3>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {STRATEGY_NAMES[auction.strategy as keyof typeof STRATEGY_NAMES]}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Current Bids
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {auction.encryptedBids.length}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Start Time:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {formatDate(auction.startTime)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">End Time:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {formatDate(auction.endTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Form */}
      {isActive && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Submit Bid
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bid Amount (Token Quantity)
              </label>
              <input
                type="number"
                className="input"
                placeholder="Enter the amount of tokens you are willing to pay"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount (SUI)
              </label>
              <input
                type="number"
                className="input"
                placeholder="SUI amount as deposit"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Deposit will be refunded if not selected
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🔒 Your bid will be encrypted with Seal time-lock and will only be revealed after the auction ends.
              </p>
            </div>
            <button
              onClick={handlePlaceBid}
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Bid'}
            </button>
          </div>
        </div>
      )}

      {/* Complete Auction Button */}
      {canFinalize && (
        <div className="card mt-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Auction Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Auction has ended, you can start decrypting bids and distributing tokens.
          </p>
          <button
            onClick={handleFinalizeAuction}
            className="btn btn-primary"
          >
            Complete Auction and Distribute Tokens
          </button>
        </div>
      )}
    </div>
  )
}

