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
      // 查询所有拍卖对象
      // 注意：实际应用中需要根据合约实际情况调整查询逻辑
      
      // 示例数据（实际应从链上查询）
      const mockAuctions: Auction[] = [
        {
          id: '0x123...',
          coinName: 'Test Token',
          totalSupply: '1000000',
          winnerCount: '10',
          strategy: 0,
          startTime: Date.now() - 3600000,
          endTime: Date.now() + 3600000,
          finalized: false,
          bidCount: 5,
        },
        {
          id: '0x456...',
          coinName: 'Another Token',
          totalSupply: '500000',
          winnerCount: '5',
          strategy: 1,
          startTime: Date.now() - 7200000,
          endTime: Date.now() - 1800000,
          finalized: true,
          bidCount: 12,
        },
      ]

      setAuctions(mockAuctions)
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
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const getStatusBadge = (auction: Auction) => {
    const status = getAuctionStatus(auction)
    const badges = {
      upcoming: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    const labels = {
      upcoming: '即将开始',
      active: '进行中',
      ended: '已结束',
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
          拍卖列表
        </h1>
        <Link to="/create-auction" className="btn btn-primary">
          创建拍卖
        </Link>
      </div>

      {/* 筛选器 */}
      <div className="mb-6 flex space-x-2">
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setFilter('active')}
        >
          进行中
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === 'ended'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setFilter('ended')}
        >
          已结束
        </button>
      </div>

      {/* 拍卖列表 */}
      {filteredAuctions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">暂无拍卖</p>
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
                  <span className="text-gray-600 dark:text-gray-400">总供应:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {parseInt(auction.totalSupply).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">中标人数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {auction.winnerCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">策略:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {STRATEGY_NAMES[auction.strategy as keyof typeof STRATEGY_NAMES]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">出价数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {auction.bidCount}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div>开始: {formatDate(auction.startTime)}</div>
                  <div>结束: {formatDate(auction.endTime)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

