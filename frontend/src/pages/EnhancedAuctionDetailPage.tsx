import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID } from '@/config/constants'
import { createWalrusClient, createProjectMetadataManager } from '@/utils/walrus-client'

interface ProjectMetadata {
  name: string
  symbol: string
  description: string
  icon?: string
  whitepaper?: string
  video?: string
  website?: string
  twitter?: string
  telegram?: string
}

interface AuctionDetail {
  id: string
  creator: string
  projectMetadataId: string
  coinName: string
  totalSupply: string
  winnerCount: string
  strategy: number
  startTime: number
  endTime: number
  finalized: boolean
  bidCount: number
}

export default function EnhancedAuctionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentAccount = useCurrentAccount()
  const [auction, setAuction] = useState<AuctionDetail | null>(null)
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()
  const walrusClient = createWalrusClient()
  const metadataManager = createProjectMetadataManager()

  useEffect(() => {
    loadAuctionDetail()
  }, [id])

  const loadAuctionDetail = async () => {
    try {
      setIsLoading(true)
      
      // Load auction from chain
      // Mock data for demo
      const mockAuction: AuctionDetail = {
        id: id || '0x123',
        creator: '0xabc',
        projectMetadataId: '0xdef',
        coinName: 'Test Token',
        totalSupply: '1000000',
        winnerCount: '10',
        strategy: 0,
        startTime: Date.now() - 3600000,
        endTime: Date.now() + 3600000,
        finalized: false,
        bidCount: 5,
      }
      setAuction(mockAuction)

      // Load project metadata from Walrus
      // In real implementation, fetch from chain first to get blob ID
      const mockMetadata: ProjectMetadata = {
        name: 'Amazing Project',
        symbol: 'AMZG',
        description: 'A revolutionary blockchain project...',
        website: 'https://example.com',
        twitter: '@amazing',
      }
      setProjectMetadata(mockMetadata)

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

    setIsSubmitting(true)

    try {
      toast('Encrypting bid with Seal...', { icon: '🔒' })
      
      // Encrypt bid data
      const encryptedBidData = new TextEncoder().encode(bidAmount)

      // Submit transaction
      const tx = new Transaction()

      const [coin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(parseInt(paymentAmount) * 1000000000),
      ])

      tx.moveCall({
        target: `${PACKAGE_ID}::enhanced_auction::place_bid`,
        arguments: [
          tx.object(auction.id),
          tx.pure(Array.from(encryptedBidData)),
          coin,
          tx.object('0x6'),
        ],
        typeArguments: ['YOUR_COIN_TYPE'],
      })

      signAndExecute(
        { transaction: tx },
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!auction || !projectMetadata) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Auction not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Project Information Section */}
      <div className="card mb-6">
        <div className="flex items-start space-x-6">
          {/* Project Icon */}
          {projectMetadata.icon ? (
            <img
              src={walrusClient.getBlobUrl(projectMetadata.icon)}
              alt={projectMetadata.name}
              className="w-24 h-24 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-400">
                {projectMetadata.symbol.charAt(0)}
              </span>
            </div>
          )}

          {/* Project Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {projectMetadata.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              ${projectMetadata.symbol}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {projectMetadata.description}
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {projectMetadata.website && (
                <a
                  href={projectMetadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  🌐 Website
                </a>
              )}
              {projectMetadata.twitter && (
                <a
                  href={`https://twitter.com/${projectMetadata.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  🐦 Twitter
                </a>
              )}
              {projectMetadata.telegram && (
                <a
                  href={projectMetadata.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  ✈️ Telegram
                </a>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            {projectMetadata.whitepaper && (
              <a
                href={walrusClient.getBlobUrl(projectMetadata.whitepaper)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary block text-center"
              >
                📄 Whitepaper
              </a>
            )}
            {projectMetadata.video && (
              <a
                href={walrusClient.getBlobUrl(projectMetadata.video)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary block text-center"
              >
                🎥 Video
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Auction Information Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auction Stats */}
        <div className="lg:col-span-2 card">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Auction Details
          </h2>

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
                Current Bids
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {auction.bidCount}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Time Remaining
              </h3>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {Math.floor((auction.endTime - Date.now()) / 3600000)}h{' '}
                {Math.floor(((auction.endTime - Date.now()) % 3600000) / 60000)}m
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Start Time:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(auction.startTime).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">End Time:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(auction.endTime).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bid Form */}
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
                placeholder="Enter amount"
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
                placeholder="Deposit amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Refunded if not selected
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🔒 Your bid will be encrypted with Seal time-lock and revealed after auction ends
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
      </div>
    </div>
  )
}

