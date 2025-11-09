import { useState } from 'react'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID } from '@/config/constants'

export default function CreateCoinPage() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    description: '',
    iconUrl: '',
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

    setIsLoading(true)

    try {
      const tx = new Transaction()
      
      // Note: Actual usage requires users to provide their own OTW (One-Time-Witness)
      // This is simplified here, users should deploy a module containing OTW first
      
      toast.info('Token creation requires users to deploy a module containing OTW first')
      toast.info('Please refer to documentation for how to create custom tokens')

      // Sample code (requires actual OTW):
      // tx.moveCall({
      //   target: `${PACKAGE_ID}::coin_factory::create_coin`,
      //   arguments: [
      //     tx.object('REGISTRY_ID'),
      //     tx.pure('WITNESS'),
      //     tx.pure.u8(formData.decimals),
      //     tx.pure.string(formData.symbol),
      //     tx.pure.string(formData.name),
      //     tx.pure.string(formData.description),
      //     tx.pure.string(formData.iconUrl),
      //   ],
      //   typeArguments: ['YOUR_COIN_TYPE'],
      // })

      // signAndExecute(
      //   {
      //     transaction: tx,
      //   },
      //   {
      //     onSuccess: (result) => {
      //       toast.success('Token created successfully!')
      //       console.log('Transaction digest:', result.digest)
      //       setFormData({
      //         name: '',
      //         symbol: '',
      //         decimals: 9,
      //         description: '',
      //         iconUrl: '',
      //       })
      //     },
      //     onError: (error) => {
      //       toast.error('Creation failed: ' + error.message)
      //     },
      //   }
      // )

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

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ Important Notice
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Creating tokens requires deploying a Move module containing OTW (One-Time-Witness) first.
              Please refer to documentation for detailed steps. This interface is mainly for UI interaction demonstration.
            </p>
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

