import { useState } from 'react'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID, AUCTION_STRATEGIES, STRATEGY_NAMES } from '@/config/constants'

export default function CreateAuctionPage() {
  const [formData, setFormData] = useState({
    coinType: '',
    coinName: '',
    totalSupply: '',
    winnerCount: '',
    strategy: AUCTION_STRATEGIES.TOP_N,
    startTime: '',
    endTime: '',
    treasuryCapId: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.coinType || !formData.coinName || !formData.totalSupply || 
        !formData.winnerCount || !formData.startTime || !formData.endTime ||
        !formData.treasuryCapId) {
      toast.error('请填写所有必填字段')
      return
    }

    const startTimeMs = new Date(formData.startTime).getTime()
    const endTimeMs = new Date(formData.endTime).getTime()

    if (startTimeMs >= endTimeMs) {
      toast.error('结束时间必须晚于开始时间')
      return
    }

    if (endTimeMs <= Date.now()) {
      toast.error('结束时间必须晚于当前时间')
      return
    }

    setIsLoading(true)

    try {
      const tx = new Transaction()

      tx.moveCall({
        target: `${PACKAGE_ID}::auction::create_auction`,
        arguments: [
          tx.object(formData.treasuryCapId),
          tx.pure.string(formData.coinName),
          tx.pure.u64(formData.totalSupply),
          tx.pure.u64(formData.winnerCount),
          tx.pure.u8(formData.strategy),
          tx.pure.u64(startTimeMs),
          tx.pure.u64(endTimeMs),
        ],
        typeArguments: [formData.coinType],
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success('拍卖创建成功!')
            console.log('Transaction digest:', result.digest)
            // 重置表单
            setFormData({
              coinType: '',
              coinName: '',
              totalSupply: '',
              winnerCount: '',
              strategy: AUCTION_STRATEGIES.TOP_N,
              startTime: '',
              endTime: '',
              treasuryCapId: '',
            })
          },
          onError: (error) => {
            toast.error('创建失败: ' + error.message)
          },
        }
      )
    } catch (error: any) {
      toast.error('创建失败: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取最小开始时间（当前时间）
  const getMinStartTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5) // 至少5分钟后
    return now.toISOString().slice(0, 16)
  }

  // 获取最小结束时间（开始时间后至少1小时）
  const getMinEndTime = () => {
    if (!formData.startTime) return getMinStartTime()
    const start = new Date(formData.startTime)
    start.setHours(start.getHours() + 1)
    return start.toISOString().slice(0, 16)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          创建拍卖
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              代币类型 *
            </label>
            <input
              type="text"
              className="input"
              placeholder="0x...::module::COIN"
              value={formData.coinType}
              onChange={(e) => setFormData({ ...formData, coinType: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              完整的代币类型标识符
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              代币名称 *
            </label>
            <input
              type="text"
              className="input"
              placeholder="My Token"
              value={formData.coinName}
              onChange={(e) => setFormData({ ...formData, coinName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              TreasuryCap 对象 ID *
            </label>
            <input
              type="text"
              className="input"
              placeholder="0x..."
              value={formData.treasuryCapId}
              onChange={(e) => setFormData({ ...formData, treasuryCapId: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              用于铸造代币的 TreasuryCap 对象 ID
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                总供应量 *
              </label>
              <input
                type="number"
                className="input"
                placeholder="1000000"
                min="1"
                value={formData.totalSupply}
                onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                中标人数 *
              </label>
              <input
                type="number"
                className="input"
                placeholder="10"
                min="1"
                value={formData.winnerCount}
                onChange={(e) => setFormData({ ...formData, winnerCount: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分配策略 *
            </label>
            <select
              className="input"
              value={formData.strategy}
              onChange={(e) => setFormData({ ...formData, strategy: parseInt(e.target.value) })}
              required
            >
              <option value={AUCTION_STRATEGIES.TOP_N}>
                {STRATEGY_NAMES[AUCTION_STRATEGIES.TOP_N]}
              </option>
              <option value={AUCTION_STRATEGIES.RANDOM_N}>
                {STRATEGY_NAMES[AUCTION_STRATEGIES.RANDOM_N]}
              </option>
              <option value={AUCTION_STRATEGIES.CLOSEST_TO_AVG}>
                {STRATEGY_NAMES[AUCTION_STRATEGIES.CLOSEST_TO_AVG]}
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                开始时间 *
              </label>
              <input
                type="datetime-local"
                className="input"
                min={getMinStartTime()}
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                结束时间 *
              </label>
              <input
                type="datetime-local"
                className="input"
                min={getMinEndTime()}
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💡 提示
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 所有出价将使用 Seal 时间锁加密</li>
              <li>• 只有在结束时间后才能解密查看</li>
              <li>• 请确保有足够的代币供应量用于分配</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? '创建中...' : '创建拍卖'}
          </button>
        </form>
      </div>
    </div>
  )
}

