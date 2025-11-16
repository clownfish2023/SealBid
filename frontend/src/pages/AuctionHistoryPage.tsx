import { useState, useEffect } from 'react'
// import { useSuiClient } from '@mysten/dapp-kit'
// import { createAuctionHistoryManager, createWalrusClient } from '@/utils/walrus-client'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface HistoryRecord {
  historyId: string
  auctionId: string
  projectName: string
  coinSymbol: string
  totalSupply: string
  winnerCount: string
  finalizedAt: number
  statistics: {
    totalBids: number
    totalVolume: string
    averageBid: string
    participantCount: number
  }
  winners: Array<{
    address: string
    amount: string
  }>
}

export default function AuctionHistoryPage() {
  const [histories, setHistories] = useState<HistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | '30d' | '7d'>('all')

  // const suiClient = useSuiClient()
  // const historyManager = createAuctionHistoryManager()
  // const walrusClient = createWalrusClient()

  useEffect(() => {
    loadHistories()
  }, [filter])

  const loadHistories = async () => {
    try {
      setIsLoading(true)

      // In real implementation, query from chain
      // const events = await suiClient.queryEvents({
      //   query: { MoveEventType: '...::AuctionHistoryArchived' }
      // })

      // Mock data for demo
      const mockHistories: HistoryRecord[] = [
        {
          historyId: '0x123',
          auctionId: '0x456',
          projectName: 'Amazing Token',
          coinSymbol: 'AMZG',
          totalSupply: '1000000',
          winnerCount: '10',
          finalizedAt: Date.now() - 86400000,
          statistics: {
            totalBids: 25,
            totalVolume: '5000',
            averageBid: '200',
            participantCount: 20,
          },
          winners: [
            { address: '0xabc', amount: '100000' },
            { address: '0xdef', amount: '100000' },
          ],
        },
        {
          historyId: '0x789',
          auctionId: '0xabc',
          projectName: 'Super Project',
          coinSymbol: 'SUPER',
          totalSupply: '500000',
          winnerCount: '5',
          finalizedAt: Date.now() - 172800000,
          statistics: {
            totalBids: 15,
            totalVolume: '3000',
            averageBid: '200',
            participantCount: 12,
          },
          winners: [
            { address: '0x111', amount: '100000' },
          ],
        },
      ]

      setHistories(mockHistories)
    } catch (error) {
      console.error('Failed to load histories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
          Auction History
        </h1>

        {/* Filter */}
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === '30d'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setFilter('30d')}
          >
            Last 30 Days
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === '7d'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setFilter('7d')}
          >
            Last 7 Days
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Auctions
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {histories.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Volume
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {histories
              .reduce((sum, h) => sum + parseInt(h.statistics.totalVolume), 0)
              .toLocaleString()}{' '}
            SUI
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Bids
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {histories.reduce((sum, h) => sum + h.statistics.totalBids, 0)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Participants
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {histories.reduce((sum, h) => sum + h.statistics.participantCount, 0)}
          </p>
        </div>
      </div>

      {/* History List */}
      {histories.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No auction history found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {histories.map((history) => (
            <div key={history.historyId} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {history.projectName}
                    </h3>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${history.coinSymbol}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-sm font-medium text-green-800 dark:text-green-200">
                      Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Supply:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {parseInt(history.totalSupply).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Winners:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {history.winnerCount}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Bids:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {history.statistics.totalBids}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Avg Bid:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {history.statistics.averageBid} SUI
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Finalized:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(history.finalizedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Winners */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Winners:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {history.winners.slice(0, 5).map((winner, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full text-sm text-primary-700 dark:text-primary-300"
                        >
                          {formatAddress(winner.address)}
                        </span>
                      ))}
                      {history.winners.length > 5 && (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300">
                          +{history.winners.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Link
                    to={`/auction/${history.auctionId}`}
                    className="btn btn-secondary text-sm"
                  >
                    View Details
                  </Link>
                  <button
                    className="btn bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm"
                    onClick={async () => {
                      // Download detailed history from Walrus
                      toast('Loading detailed history...', { icon: '📊' })
                      // const history = await historyManager.loadAuctionHistory(summaryBlobId)
                    }}
                  >
                    📊 Statistics
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          📦 About History Storage
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          All auction history data is stored on Walrus for permanent availability at minimal cost.
          You can access detailed statistics, bid data, and winner information anytime.
        </p>
      </div>
    </div>
  )
}

