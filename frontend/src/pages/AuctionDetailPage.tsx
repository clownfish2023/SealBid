import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID, SEAL_SERVERS, SEAL_PACKAGE_ID, STRATEGY_NAMES } from '@/config/constants'

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
  const suiClient = useSuiClient()

  useEffect(() => {
    loadAuctionDetail()
  }, [id])

  const loadAuctionDetail = async () => {
    try {
      setIsLoading(true)
      // 从链上加载拍卖详情
      // 示例数据
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
      toast.error('加载拍卖详情失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceBid = async () => {
    if (!auction || !currentAccount) {
      toast.error('请先连接钱包')
      return
    }

    if (!bidAmount || !paymentAmount) {
      toast.error('请填写出价金额和支付金额')
      return
    }

    const now = Date.now()
    if (now < auction.startTime) {
      toast.error('拍卖尚未开始')
      return
    }
    if (now >= auction.endTime) {
      toast.error('拍卖已结束')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 使用 Seal 加密出价
      toast.info('正在加密出价...')
      
      // 实际应用中需要使用 Seal SDK 加密
      // import { SealClient } from '@mysten/seal-sdk'
      // const sealClient = new SealClient({ ... })
      // const keyId = generateKeyId(auction.endTime)
      // const encryptedBid = await sealClient.encrypt(bidAmount, keyId)
      
      // 这里简化处理，使用模拟的加密数据
      const encryptedBidData = new TextEncoder().encode(bidAmount)

      // 2. 提交加密的出价到链上
      const tx = new Transaction()

      // 分割 SUI 用于支付
      const [coin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(parseInt(paymentAmount) * 1000000000), // 转换为 MIST
      ])

      tx.moveCall({
        target: `${PACKAGE_ID}::auction::place_bid`,
        arguments: [
          tx.object(auction.id),
          tx.pure(Array.from(encryptedBidData)),
          coin,
          tx.object('0x6'), // Clock object
        ],
        typeArguments: ['YOUR_COIN_TYPE'], // 需要实际的代币类型
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success('出价成功!')
            console.log('Transaction digest:', result.digest)
            setBidAmount('')
            setPaymentAmount('')
            loadAuctionDetail()
          },
          onError: (error) => {
            toast.error('出价失败: ' + error.message)
          },
        }
      )
    } catch (error: any) {
      toast.error('出价失败: ' + error.message)
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
          transaction: tx,
        },
        {
          onSuccess: () => {
            toast.success('拍卖已完成!')
            loadAuctionDetail()
          },
          onError: (error) => {
            toast.error('操作失败: ' + error.message)
          },
        }
      )
    } catch (error: any) {
      toast.error('操作失败: ' + error.message)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const getTimeRemaining = () => {
    if (!auction) return ''
    const now = Date.now()
    if (now < auction.startTime) {
      const diff = auction.startTime - now
      return `距开始还有 ${Math.floor(diff / 3600000)} 小时 ${Math.floor((diff % 3600000) / 60000)} 分钟`
    }
    if (now < auction.endTime) {
      const diff = auction.endTime - now
      return `距结束还有 ${Math.floor(diff / 3600000)} 小时 ${Math.floor((diff % 3600000) / 60000)} 分钟`
    }
    return '已结束'
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
        <p className="text-gray-500 dark:text-gray-400">拍卖不存在</p>
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
              已完成
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              总供应量
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {parseInt(auction.totalSupply).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              中标人数
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {auction.winnerCount}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              分配策略
            </h3>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {STRATEGY_NAMES[auction.strategy as keyof typeof STRATEGY_NAMES]}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              当前出价数
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {auction.encryptedBids.length}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">开始时间:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {formatDate(auction.startTime)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">结束时间:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {formatDate(auction.endTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 出价表单 */}
      {isActive && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            提交出价
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                出价金额（代币数量）
              </label>
              <input
                type="number"
                className="input"
                placeholder="输入你愿意支付的代币数量"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                支付金额（SUI）
              </label>
              <input
                type="number"
                className="input"
                placeholder="作为保证金的 SUI 数量"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                未中标将退还保证金
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🔒 你的出价将使用 Seal 时间锁加密，只有在拍卖结束后才会公开。
              </p>
            </div>
            <button
              onClick={handlePlaceBid}
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交出价'}
            </button>
          </div>
        </div>
      )}

      {/* 完成拍卖按钮 */}
      {canFinalize && (
        <div className="card mt-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            拍卖管理
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            拍卖已结束，可以开始解密出价并分配代币。
          </p>
          <button
            onClick={handleFinalizeAuction}
            className="btn btn-primary"
          >
            完成拍卖并分配代币
          </button>
        </div>
      )}
    </div>
  )
}

