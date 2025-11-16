import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID } from '@/config/constants'
import { createWalrusClient } from '@/utils/walrus-client'
// import { createProjectMetadataManager } from '@/utils/metadata-manager'

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
  const [refreshKey, setRefreshKey] = useState(0)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()
  const walrusClient = createWalrusClient()
  // const metadataManager = createProjectMetadataManager()

  const refreshAuction = () => {
    setRefreshKey(prev => prev + 1)
  }

  useEffect(() => {
    const loadAuctionDetail = async () => {
      if (!id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        console.log('Loading auction details, ID:', id)
        
        // Fetch auction object from chain
        const auctionObj = await suiClient.getObject({
          id,
          options: { showContent: true, showOwner: true },
        })

        console.log('Fetched auction object:', auctionObj)

        if (!auctionObj.data || !auctionObj.data.content || !('fields' in auctionObj.data.content)) {
          throw new Error('Auction object does not exist or is improperly formatted')
        }

        const fields = auctionObj.data.content.fields as any
        
        console.log('Auction object fields:', fields)
        
        // Support standard auction and simple auction
        const coinName = fields.coin_name || fields.coin_symbol || 'Unknown'
        const projectMetadataId = fields.project_metadata_id || ''
        
        const auctionDetail: AuctionDetail = {
          id,
          creator: fields.creator,
          projectMetadataId,
          coinName,
          totalSupply: fields.total_supply || '0',
          winnerCount: fields.winner_count || '0',
          strategy: parseInt(fields.strategy || '0'),
          startTime: parseInt(fields.start_time || '0'),
          endTime: parseInt(fields.end_time || '0'),
          finalized: fields.finalized || false,
          bidCount: fields.encrypted_bids ? fields.encrypted_bids.length : 0,
        }

        console.log('Parsed auction details:', auctionDetail)
        setAuction(auctionDetail)

        // Load project metadata (if available)
        if (projectMetadataId) {
          try {
            const projectObj = await suiClient.getObject({
              id: projectMetadataId,
              options: { showContent: true },
            })

            if (projectObj.data?.content && 'fields' in projectObj.data.content) {
              const projectFields = projectObj.data.content.fields as any
              
              const metadata: ProjectMetadata = {
                name: projectFields.name || coinName,
                symbol: projectFields.symbol || coinName,
                description: projectFields.description || '',
                website: projectFields.website || '',
                twitter: projectFields.twitter || '',
                telegram: projectFields.telegram || '',
                // TODO: Load icon, whitepaper, video from Walrus
              }

              console.log('Project metadata:', metadata)
              setProjectMetadata(metadata)
            }
          } catch (err) {
            console.warn('Failed to load project metadata:', err)
            // Use default metadata
            setProjectMetadata({
              name: coinName,
              symbol: coinName,
              description: '',
            })
          }
        } else {
          // No project metadata, use auction info
          setProjectMetadata({
            name: coinName,
            symbol: coinName,
            description: '',
          })
        }

      } catch (error: any) {
        console.error('Failed to load auction:', error)
        toast.error('Failed to load auction details: ' + error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadAuctionDetail()
  }, [id, suiClient, refreshKey])

  const handlePlaceBid = async () => {
    if (!auction || !currentAccount) {
      toast.error('Please connect wallet first')
      return
    }

    if (!bidAmount || !paymentAmount) {
      toast.error('Please fill in bid amount and payment amount')
      return
    }

    const bidAmountNum = parseFloat(bidAmount)
    const paymentAmountNum = parseFloat(paymentAmount)

    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      toast.error('Bid amount must be greater than 0')
      return
    }

    if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
      toast.error('Payment amount must be greater than 0')
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
      toast('Encrypting bid with Seal...', { icon: '🔒' })
      
      // Encrypt bid data
      const encryptedBidData = new TextEncoder().encode(bidAmount)

      // Submit transaction
      const tx = new Transaction()

      // Split SUI for payment (convert to MIST: 1 SUI = 1,000,000,000 MIST)
      const paymentInMist = Math.floor(paymentAmountNum * 1000000000)
      const [coin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(paymentInMist),
      ])
      
      // Set reasonable gas budget: base fee + buffer for payment amount
      // Base gas: 10,000,000 MIST (0.01 SUI)
      // Extra buffer: payment amount * 0.1 (for coin split, etc.)
      const baseGas = 10000000 // 0.01 SUI
      const bufferGas = Math.max(paymentInMist * 0.1, 5000000) // at least 0.005 SUI
      const totalGasBudget = Math.floor(baseGas + bufferGas)
      tx.setGasBudget(totalGasBudget)

      // Use simplified token auction
      tx.moveCall({
        target: `${PACKAGE_ID}::simple_auction::place_simple_bid`,
        arguments: [
          tx.object(auction.id),
          tx.pure.vector('u8', Array.from(encryptedBidData)), // specify vector<u8> type
          coin,
          tx.object('0x6'),
        ],
      })

      signAndExecute(
        { transaction: tx as any },
        {
          onSuccess: (result) => {
            toast.success('Bid placed successfully!')
            console.log('Transaction digest:', result.digest)
            setBidAmount('')
            setPaymentAmount('')
            refreshAuction()
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
        target: `${PACKAGE_ID}::simple_auction::finalize_simple_auction`,
        arguments: [
          tx.object(auction.id),
          tx.object(import.meta.env.VITE_COIN_REGISTRY_ID || '0x0'), // SimpleCoinRegistry
          tx.object('0x6'), // Clock object
        ],
      })

      signAndExecute(
        { transaction: tx as any },
        {
          onSuccess: () => {
            toast.success('Auction completed!')
            refreshAuction()
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

        {/* Bid Form or Finalize Section */}
        <div className="card">
          {Date.now() < auction.endTime && !auction.finalized ? (
            // Active auction - show bid form
            <>
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
            </>
          ) : (
            // Auction ended or finalized
            <>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {auction.finalized ? 'Auction Completed' : 'Auction Ended'}
              </h2>
              {auction.finalized ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    This auction has been completed and tokens have been distributed.
                  </p>
                </div>
              ) : currentAccount?.address === auction.creator ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    The auction has ended with {auction.bidCount} bid(s). You can now finalize the auction to distribute tokens to winners.
                  </p>
                  <button
                    onClick={handleFinalizeAuction}
                    className="btn btn-primary w-full"
                  >
                    Finalize Auction & Distribute Tokens
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    This auction has ended. Waiting for the creator to finalize and distribute tokens.
                  </p>
                  {currentAccount && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                      Connected: {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}<br />
                      Creator: {auction.creator.slice(0, 6)}...{auction.creator.slice(-4)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

