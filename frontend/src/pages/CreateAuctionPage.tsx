import { useState, useEffect } from 'react'
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID, COIN_REGISTRY_ID, AUCTION_STRATEGIES, STRATEGY_NAMES } from '@/config/constants'
import { useUserProjects, useUserTreasuryCaps, useUserSimpleTreasuryCaps } from '@/hooks/useUserAssets'

export default function CreateAuctionPage() {
  const account = useCurrentAccount()
  const [formData, setFormData] = useState({
    coinType: '',
    coinName: '',
    totalSupply: '',
    winnerCount: '',
    strategy: AUCTION_STRATEGIES.TOP_N,
    startTime: '',
    endTime: '',
    treasuryCapId: '',
    projectMetadataId: '', // Added: project metadata ID
  })
  const [isLoading, setIsLoading] = useState(false)
  const [coinSource, setCoinSource] = useState<'standard' | 'simple'>('simple') // token source

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  
  // Fetch user assets
  const { projects, loading: projectsLoading } = useUserProjects()
  const { treasuryCaps, loading: treasuryCapsLoading } = useUserTreasuryCaps()
  const { simpleTreasuryCaps, loading: simpleTreasuryCapsLoading } = useUserSimpleTreasuryCaps()

  // Auto-fill info when selecting token
  const handleTreasuryCapChange = (treasuryCapId: string) => {
    setFormData(prev => ({ ...prev, treasuryCapId }))
    
    if (coinSource === 'simple') {
      const cap = simpleTreasuryCaps.find(c => c.id === treasuryCapId)
      if (cap) {
        setFormData(prev => ({
          ...prev,
          coinName: cap.symbol,
          coinType: `${PACKAGE_ID}::simple_coin_factory::SimpleCoin`,
        }))
      }
    } else {
      const cap = treasuryCaps.find(c => c.id === treasuryCapId)
      if (cap) {
        setFormData(prev => ({
          ...prev,
          coinName: cap.coinName,
          coinType: cap.coinType,
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!account?.address) {
      toast.error('Please connect your wallet first')
      return
    }

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

      if (coinSource === 'simple') {
        // Use simplified token auction
        tx.moveCall({
          target: `${PACKAGE_ID}::simple_auction::create_simple_auction`,
          arguments: [
            tx.object(COIN_REGISTRY_ID), // SimpleCoinRegistry
            tx.object(formData.treasuryCapId), // SimpleTreasuryCap
            tx.pure.u64(formData.totalSupply),
            tx.pure.u64(formData.winnerCount),
            tx.pure.u8(formData.strategy),
            tx.pure.u64(startTimeMs),
            tx.pure.u64(endTimeMs),
            tx.object('0x6'), // Clock
          ],
        })
      } else {
        // Use standard token auction
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
      }

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
              projectMetadataId: '',
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
          {/* Project selection (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Associate Project (optional)
            </label>
            {projectsLoading ? (
              <div className="text-sm text-gray-500">Loading projects...</div>
            ) : projects.length > 0 ? (
              <select
                className="input"
                value={formData.projectMetadataId}
                onChange={(e) => setFormData({ ...formData, projectMetadataId: e.target.value })}
              >
                <option value="">Do not associate project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.symbol})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500">
                No projects found.
                <a href="/create-project" className="text-primary-600 hover:underline ml-1">
                  Create Project
                </a>
              </div>
            )}
          </div>

          {/* Token source selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Type *
            </label>
            <div className="flex space-x-6 mb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="coinSource"
                  value="simple"
                  checked={coinSource === 'simple'}
                  onChange={() => {
                    setCoinSource('simple')
                    setFormData(prev => ({ ...prev, treasuryCapId: '', coinType: '', coinName: '' }))
                  }}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm text-gray-900 dark:text-white">Simple Token (Recommended)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="coinSource"
                  value="standard"
                  checked={coinSource === 'standard'}
                  onChange={() => {
                    setCoinSource('standard')
                    setFormData(prev => ({ ...prev, treasuryCapId: '', coinType: '', coinName: '' }))
                  }}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm text-gray-900 dark:text-white">Standard Token</span>
              </label>
            </div>
          </div>

          {/* Token selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Token *
            </label>
            {(coinSource === 'simple' ? simpleTreasuryCapsLoading : treasuryCapsLoading) ? (
              <div className="text-sm text-gray-500">Loading tokens...</div>
            ) : coinSource === 'simple' ? (
              simpleTreasuryCaps.length > 0 ? (
                <select
                  className="input"
                  value={formData.treasuryCapId}
                  onChange={(e) => handleTreasuryCapChange(e.target.value)}
                  required
                >
                  <option value="">Please select a token</option>
                  {simpleTreasuryCaps.map((cap) => (
                    <option key={cap.id} value={cap.id}>
                      {cap.symbol} (Total supply: {cap.totalSupply}, {cap.mintable ? 'Mintable' : 'Fixed supply'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500">
                  No simple tokens found.
                  <a href="/create-coin" className="text-primary-600 hover:underline ml-1">
                    Create Token
                  </a>
                </div>
              )
            ) : (
              treasuryCaps.length > 0 ? (
                <select
                  className="input"
                  value={formData.treasuryCapId}
                  onChange={(e) => handleTreasuryCapChange(e.target.value)}
                  required
                >
                  <option value="">Please select a token</option>
                  {treasuryCaps.map((cap) => (
                    <option key={cap.id} value={cap.id}>
                      {cap.coinName} ({cap.symbol})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500">
                  No standard tokens found. Please use a simple token or create a standard token.
                </div>
              )
            )}
            {formData.treasuryCapId && (
              <p className="text-xs text-gray-500 mt-1">
                TreasuryCap ID: {formData.treasuryCapId.slice(0, 8)}...{formData.treasuryCapId.slice(-6)}
              </p>
            )}
          </div>

          {/* Display selected token info */}
          {formData.coinName && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm">
                <div className="text-gray-600 dark:text-gray-400">Token Name: {formData.coinName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 break-all">
                  Type: {formData.coinType}
                </div>
              </div>
            </div>
          )}

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

