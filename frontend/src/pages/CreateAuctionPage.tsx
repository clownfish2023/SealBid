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
      toast.error('Please fill in all required fields')
      return
    }

    const startTimeMs = new Date(formData.startTime).getTime()
    const endTimeMs = new Date(formData.endTime).getTime()

    if (startTimeMs >= endTimeMs) {
      toast.error('End time must be later than start time')
      return
    }

    if (endTimeMs <= Date.now()) {
      toast.error('End time must be later than current time')
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
            toast.success('Auction created successfully!')
            console.log('Transaction digest:', result.digest)
            // Reset form
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
            toast.error('Creation failed: ' + error.message)
          },
        }
      )
    } catch (error: any) {
      toast.error('Creation failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Get minimum start time (current time)
  const getMinStartTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5) // At least 5 minutes later
    return now.toISOString().slice(0, 16)
  }

  // Get minimum end time (at least 1 hour after start time)
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
          Create Auction
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Type *
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
              Complete token type identifier
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Name *
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
              TreasuryCap Object ID *
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
              TreasuryCap object ID used for minting tokens
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Supply *
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
                Number of Winners *
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
              Allocation Strategy *
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
                Start Time *
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
                End Time *
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
              💡 Tips
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• All bids will be encrypted using Seal time-lock</li>
              <li>• Can only be decrypted and viewed after end time</li>
              <li>• Please ensure sufficient token supply for allocation</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Auction'}
          </button>
        </form>
      </div>
    </div>
  )
}

