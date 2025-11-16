import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSuiClient } from '@mysten/dapp-kit'
import { PACKAGE_ID, STRATEGY_NAMES } from '@/config/constants'

interface Auction {
  id: string
  coinName: string
  totalSupply: string
  winnerCount: string
  strategy: number
  startTime: number
  endTime: number
  finalized: boolean
  bidCount: number
}

export default function AuctionListPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all')
  
  const suiClient = useSuiClient()

  useEffect(() => {
    loadAuctions()
  }, [])

  const loadAuctions = async () => {
    try {
      setIsLoading(true)
      const allAuctions: Auction[] = []

      // Query events to get all created auctions
      // Query standard auction creation events
      try {
        const standardEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::auction::AuctionCreated`,
          },
          limit: 50,
          order: 'descending',
        })

        for (const event of standardEvents.data) {
          if (event.parsedJson) {
            const data = event.parsedJson as any
            const auctionId = data.auction_id
            
            // Get auction object details
            try {
              const auctionObj = await suiClient.getObject({
                id: auctionId,
                options: { showContent: true },
              })

              if (auctionObj.data?.content && 'fields' in auctionObj.data.content) {
                const fields = auctionObj.data.content.fields as any
                allAuctions.push({
                  id: auctionId,
                  coinName: fields.coin_name || data.coin_name || 'Unknown',
                  totalSupply: fields.total_supply || data.total_supply || '0',
                  winnerCount: fields.winner_count || data.winner_count || '0',
                  strategy: parseInt(fields.strategy || data.strategy || '0'),
                  startTime: parseInt(fields.start_time || data.start_time || '0'),
                  endTime: parseInt(fields.end_time || data.end_time || '0'),
                  finalized: fields.finalized || false,
                  bidCount: fields.encrypted_bids ? fields.encrypted_bids.length : 0,
                })
              }
            } catch (err) {
              console.warn(`Failed to fetch auction ${auctionId}:`, err)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load standard auction events:', error)
      }

      // Query simple token auction creation events
      try {
        const simpleEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::simple_auction::SimpleAuctionCreated`,
          },
          limit: 50,
          order: 'descending',
        })

        for (const event of simpleEvents.data) {
          if (event.parsedJson) {
            const data = event.parsedJson as any
            const auctionId = data.auction_id
            
            // Get auction object details
            try {
              const auctionObj = await suiClient.getObject({
                id: auctionId,
                options: { showContent: true },
              })

              if (auctionObj.data?.content && 'fields' in auctionObj.data.content) {
                const fields = auctionObj.data.content.fields as any
                allAuctions.push({
                  id: auctionId,
                  coinName: fields.coin_symbol || data.coin_symbol || 'Unknown',
                  totalSupply: fields.total_supply || data.total_supply || '0',
                  winnerCount: fields.winner_count || data.winner_count || '0',
                  strategy: parseInt(fields.strategy || data.strategy || '0'),
                  startTime: parseInt(fields.start_time || data.start_time || '0'),
                  endTime: parseInt(fields.end_time || data.end_time || '0'),
                  finalized: fields.finalized || false,
                  bidCount: fields.encrypted_bids ? fields.encrypted_bids.length : 0,
                })
              }
            } catch (err) {
              console.warn(`Failed to fetch simple auction ${auctionId}:`, err)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load simple auction events:', error)
      }

      // Sort by start time descending (latest first)
      allAuctions.sort((a, b) => b.startTime - a.startTime)

      setAuctions(allAuctions)
      console.log(`Loaded ${allAuctions.length} auctions (${allAuctions.filter(a => !a.finalized).length} active)`)
    } catch (error) {
      console.error('Failed to load auctions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAuctionStatus = (auction: Auction) => {
    const now = Date.now()
    if (auction.finalized) return 'ended'
    if (now < auction.startTime) return 'upcoming'
    if (now >= auction.startTime && now < auction.endTime) return 'active'
    return 'ended'
  }

  const filteredAuctions = auctions.filter((auction) => {
    if (filter === 'all') return true
    const status = getAuctionStatus(auction)
    if (filter === 'active') return status === 'active' || status === 'upcoming'
    if (filter === 'ended') return status === 'ended'
    return true
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusBadge = (auction: Auction) => {
    const status = getAuctionStatus(auction)
    const badges = {
      upcoming: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    const labels = {
      upcoming: 'Upcoming',
      active: 'Active',
      ended: 'Ended',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Auction List
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={loadAuctions}
            className="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : '🔄 Refresh'}
          </button>
          <Link to="/create-auction" className="btn btn-primary">
            Create Auction
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex space-x-2">
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === 'ended'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setFilter('ended')}
        >
          Ended
        </button>
      </div>

      {/* Auction List */}
      {filteredAuctions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {isLoading ? 'Loading...' : 'No auctions'}
          </p>
          {!isLoading && (
            <Link to="/create-auction" className="mt-4 inline-block text-primary-600 hover:underline">
              Create the first auction →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAuctions.map((auction) => (
            <Link
              key={auction.id}
              to={`/auction/${auction.id}`}
              className="card hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {auction.coinName}
                </h3>
                {getStatusBadge(auction)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Supply:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {parseInt(auction.totalSupply).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Winners:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {auction.winnerCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Strategy:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {STRATEGY_NAMES[auction.strategy as keyof typeof STRATEGY_NAMES]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bids:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {auction.bidCount}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div>Start: {formatDate(auction.startTime)}</div>
                  <div>End: {formatDate(auction.endTime)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

