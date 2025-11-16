import { useState } from 'react'
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID, COIN_REGISTRY_ID } from '@/config/constants'

export default function CreateCoinPage() {
  const currentAccount = useCurrentAccount()
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    totalSupply: '',
    mintable: false,
    description: '',
    iconUrl: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentAccount?.address) {
      toast.error('Please connect wallet first')
      return
    }

    if (!formData.name || !formData.symbol || !formData.totalSupply) {
      toast.error('Please fill in required fields')
      return
    }

    const totalSupply = parseInt(formData.totalSupply)
    if (isNaN(totalSupply) || totalSupply <= 0) {
      toast.error('Total supply must be greater than 0')
      return
    }

    setIsLoading(true)

    try {
      const tx = new Transaction()
      
      // 调用简化代币工厂创建代币
      // 参数顺序：registry, name, symbol, decimals, description, icon_url, initial_supply, mintable, clock
      tx.moveCall({
        target: `${PACKAGE_ID}::simple_coin_factory::create_simple_coin`,
        arguments: [
          tx.object(COIN_REGISTRY_ID),          // registry: &mut SimpleCoinRegistry
          tx.pure.string(formData.name),         // name: vector<u8>
          tx.pure.string(formData.symbol),       // symbol: vector<u8>
          tx.pure.u8(formData.decimals),         // decimals: u8
          tx.pure.string(formData.description),  // description: vector<u8>
          tx.pure.string(formData.iconUrl),      // icon_url: vector<u8>
          tx.pure.u64(totalSupply),              // initial_supply: u64
          tx.pure.bool(formData.mintable),       // mintable: bool
          tx.object('0x6'),                      // clock: &Clock
        ],
      })

      signAndExecute(
        {
          transaction: tx as any,
        },
        {
          onSuccess: (result) => {
            toast.success('Simple coin created successfully!')
            console.log('Transaction digest:', result.digest)
            setFormData({
              name: '',
              symbol: '',
              decimals: 9,
              totalSupply: '',
              mintable: false,
              description: '',
              iconUrl: '',
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Create Simple Coin
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Name *
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g.: My Token"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Full name of your token (e.g., Bitcoin, Ethereum)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Symbol *
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g.: MTK"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for your token (e.g., BTC, ETH, USDT)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Decimals
            </label>
            <input
              type="number"
              className="input"
              min="0"
              max="18"
              value={formData.decimals}
              onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of decimal places (default: 9, similar to SUI)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Supply *
            </label>
            <input
              type="number"
              className="input"
              min="1"
              placeholder="1000000"
              value={formData.totalSupply}
              onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Total amount of tokens to create (cannot be changed later unless mintable)
            </p>
          </div>

          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mintable}
                onChange={(e) => setFormData({ ...formData, mintable: e.target.checked })}
                className="mr-2 h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Make this token mintable (allow creating more tokens in the future)
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Short description of the token..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://example.com/logo.png"
              value={formData.iconUrl}
              onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
            />
            {formData.iconUrl && (
              <div className="mt-2">
                <img
                  src={formData.iconUrl}
                  alt="Token logo preview"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/64'
                  }}
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💡 Simple Coin Features
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• No need to deploy Move modules or OTW</li>
              <li>• Instant creation with just a few clicks</li>
              <li>• Perfect for testing and simple token scenarios</li>
              <li>• Can be used directly in auctions</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading || !currentAccount}
          >
            {isLoading ? 'Creating...' : !currentAccount ? 'Connect Wallet First' : 'Create Simple Coin'}
          </button>
        </form>
      </div>
    </div>
  )
}

