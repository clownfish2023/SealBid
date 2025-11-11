import { useState } from 'react'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID, COIN_REGISTRY_ID } from '@/config/constants'

export default function CreateCoinPage() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    description: '',
    iconUrl: '',
    otwObjectId: '', // OTW 对象 ID
    coinType: '', // 代币类型（如：0x123::my_coin::MY_COIN）
  })
  const [isLoading, setIsLoading] = useState(false)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.symbol) {
      toast.error('Please fill in required fields')
      return
    }

    if (!formData.otwObjectId) {
      toast.error('Please provide OTW Object ID. See documentation for how to create one.', {
        duration: 6000
      })
      return
    }

    if (!formData.coinType) {
      toast.error('Please provide Coin Type (e.g., 0x123::my_coin::MY_COIN)', {
        duration: 6000
      })
      return
    }

    setIsLoading(true)

    try {
      // First, we need to get the CoinRegistry object ID
      // In a real app, this should be stored in constants or fetched from chain
      toast('Note: You need to provide the CoinRegistry object ID', {
        icon: 'ℹ️',
        duration: 4000
      })

      // For now, we'll show instructions
      toast('To create a token:', {
        icon: '📖',
        duration: 5000
      })
      toast('1. Deploy an OTW module (see docs/OTW_TOKEN_CREATION_GUIDE.md)', {
        icon: '1️⃣',
        duration: 5000
      })
      toast('2. Get the OTW Object ID from deployment output', {
        icon: '2️⃣',
        duration: 5000
      })
      toast('3. Fill in the form and submit', {
        icon: '3️⃣',
        duration: 5000
      })

      // Get REGISTRY_ID from chain
      // The CoinRegistry is a shared object created during coin_factory module initialization
      // We need to query for it or store it in constants
      const tx = new Transaction()

      // Get REGISTRY_ID from constants
      // CoinRegistry is a shared object created during coin_factory module initialization
      // To get this ID: Deploy coin_factory module and check "Shared Objects" in deployment output
      // Then add it to .env as VITE_COIN_REGISTRY_ID
      
      if (!COIN_REGISTRY_ID || COIN_REGISTRY_ID === '0x0') {
        toast.error('CoinRegistry ID not configured. Please add VITE_COIN_REGISTRY_ID to .env file', {
          duration: 8000
        })
        toast('To get REGISTRY_ID: Deploy coin_factory module and check "Shared Objects" in output', {
          icon: 'ℹ️',
          duration: 8000
        })
        setIsLoading(false)
        return
      }

      tx.moveCall({
        target: `${PACKAGE_ID}::coin_factory::create_coin`,
        arguments: [
          tx.object(COIN_REGISTRY_ID),
          tx.object(formData.otwObjectId), // OTW 对象
          tx.pure.u8(formData.decimals),
          tx.pure.string(formData.symbol),
          tx.pure.string(formData.name),
          tx.pure.string(formData.description || ''),
          tx.pure.string(formData.iconUrl || ''),
        ],
        typeArguments: [formData.coinType], // 如：0x123::my_coin::MY_COIN
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success('Token created successfully!')
            console.log('Transaction digest:', result.digest)
            console.log('Created TreasuryCap and CoinMetadata objects')
            
            setFormData({
              name: '',
              symbol: '',
              decimals: 9,
              description: '',
              iconUrl: '',
              otwObjectId: '',
              coinType: '',
            })
          },
          onError: (error) => {
            toast.error('Creation failed: ' + error.message)
            console.error('Error details:', error)
          },
        }
      )

    } catch (error: any) {
      toast.error('Creation failed: ' + error.message)
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Create New Token
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Precision (Decimal Places)
            </label>
            <input
              type="number"
              className="input"
              min="0"
              max="18"
              value={formData.decimals}
              onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) })}
            />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OTW Object ID *
            </label>
            <input
              type="text"
              className="input"
              placeholder="0x..."
              value={formData.otwObjectId}
              onChange={(e) => setFormData({ ...formData, otwObjectId: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get this from deploying an OTW module. See documentation for details.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Coin Type *
            </label>
            <input
              type="text"
              className="input"
              placeholder="0x123::my_coin::MY_COIN"
              value={formData.coinType}
              onChange={(e) => setFormData({ ...formData, coinType: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: 0x&lt;PACKAGE_ID&gt;::&lt;MODULE&gt;::&lt;TYPE&gt;
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📖 How to Create a Token
            </h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
              <li>Deploy an OTW module (see <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">docs/OTW_TOKEN_CREATION_GUIDE.md</code>)</li>
              <li>Get the OTW Object ID from the deployment output</li>
              <li>Fill in the form above with your token details</li>
              <li>Enter the OTW Object ID and Coin Type</li>
              <li>Submit to create your token</li>
            </ol>
            <div className="mt-3">
              <a
                href="/docs/OTW_TOKEN_CREATION_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                📚 View Complete Guide →
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Token'}
          </button>
        </form>
      </div>
    </div>
  )
}

