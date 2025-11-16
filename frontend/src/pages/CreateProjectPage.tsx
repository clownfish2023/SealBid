import { useState } from 'react'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import { PACKAGE_ID } from '@/config/constants'
import { createProjectMetadataManager } from '@/utils/walrus-client'

/**
 * Convert hex string to byte array (browser-compatible)
 */
function hexToBytes(hex: string): number[] {
  // Remove '0x' prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  
  // Ensure even length
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex
  
  const bytes: number[] = []
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes.push(parseInt(paddedHex.substring(i, i + 2), 16))
  }
  return bytes
}

export default function CreateProjectPage() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
  })

  const [files, setFiles] = useState<{
    icon?: File
    whitepaper?: File
    video?: File
  }>({})

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()
  const metadataManager = createProjectMetadataManager()

  const handleFileChange = (type: 'icon' | 'whitepaper' | 'video', file: File | undefined) => {
    setFiles(prev => ({ ...prev, [type]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.symbol) {
      toast.error('Please fill in required fields')
      return
    }

    setIsUploading(true)

    try {
      // Step 1: Upload files to Walrus
      setUploadProgress('Uploading files to Walrus...')
      toast('Uploading files to Walrus...', { icon: '📤' })
      
      const uploadResult = await metadataManager.uploadProjectMetadata({
        metadata: formData,
        icon: files.icon,
        whitepaper: files.whitepaper,
        video: files.video,
      })

      toast.success('Files uploaded to Walrus successfully!')

      // Step 2: Create project metadata on-chain
      setUploadProgress('Creating project metadata on-chain...')

      const tx = new Transaction()

      // Create project metadata
      tx.moveCall({
        target: `${PACKAGE_ID}::project_metadata::create_and_share_metadata`,
        arguments: [
          tx.pure.string(formData.name),
          tx.pure.string(formData.symbol),
          tx.object('0x6'), // Clock
        ],
      })

      // Execute transaction and get metadata ID
      const result = await new Promise<string>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: async (result) => {
              console.log('Transaction successful:', result.digest)
              
              // Wait for transaction to be indexed
              await new Promise(r => setTimeout(r, 2000))
              
              // Get created object
              const txResult = await suiClient.getTransactionBlock({
                digest: result.digest,
                options: { showObjectChanges: true },
              })

              const createdObjects = txResult.objectChanges?.filter(
                (change: any) => change.type === 'created'
              )

              const metadataObject = createdObjects?.find((obj: any) => 
                obj.objectType?.includes('ProjectMetadata')
              )

              if (metadataObject && 'objectId' in metadataObject) {
                resolve(metadataObject.objectId)
              } else {
                reject(new Error('Could not find created metadata object'))
              }
            },
            onError: (error) => {
              reject(error)
            },
          }
        )
      })

      // Step 3: Update metadata with Walrus blob references
      setUploadProgress('Linking Walrus data...')

      const updateTx = new Transaction()

      // Update icon if uploaded
      if (uploadResult.iconBlob) {
        updateTx.moveCall({
          target: `${PACKAGE_ID}::project_metadata::update_icon`,
          arguments: [
            updateTx.object(result),
            updateTx.pure.vector('u8', hexToBytes(uploadResult.iconBlob.blobId)),
            updateTx.pure.u64(uploadResult.iconBlob.size),
            updateTx.pure.string(uploadResult.iconBlob.contentType),
            updateTx.object('0x6'), // Clock
          ],
        })
      }

      // Update whitepaper if uploaded
      if (uploadResult.whitepaperBlob) {
        updateTx.moveCall({
          target: `${PACKAGE_ID}::project_metadata::update_whitepaper`,
          arguments: [
            updateTx.object(result),
            updateTx.pure.vector('u8', hexToBytes(uploadResult.whitepaperBlob.blobId)),
            updateTx.pure.u64(uploadResult.whitepaperBlob.size),
            updateTx.object('0x6'), // Clock
          ],
        })
      }

      // Update video if uploaded
      if (uploadResult.videoBlob) {
        updateTx.moveCall({
          target: `${PACKAGE_ID}::project_metadata::update_video`,
          arguments: [
            updateTx.object(result),
            updateTx.pure.vector('u8', hexToBytes(uploadResult.videoBlob.blobId)),
            updateTx.pure.u64(uploadResult.videoBlob.size),
            updateTx.pure.string(uploadResult.videoBlob.contentType),
            updateTx.object('0x6'), // Clock
          ],
        })
      }

      // Update description metadata
      updateTx.moveCall({
        target: `${PACKAGE_ID}::project_metadata::update_description`,
        arguments: [
          updateTx.object(result),
          updateTx.pure.vector('u8', hexToBytes(uploadResult.metadataBlob.blobId)),
          updateTx.pure.u64(uploadResult.metadataBlob.size),
          updateTx.object('0x6'), // Clock
        ],
      })

      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: updateTx },
          {
            onSuccess: () => {
              toast.success('Project created successfully!')
              console.log('Metadata ID:', result)
              
              // Reset form
              setFormData({
                name: '',
                symbol: '',
                description: '',
                website: '',
                twitter: '',
                telegram: '',
                discord: '',
              })
              setFiles({})
              resolve()
            },
            onError: reject,
          }
        )
      })

    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Failed to create project: ' + error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Create Project
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name *
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
                Description
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Detailed project description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Project Assets (Stored on Walrus)
            </h2>

            {/* Icon Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Icon/Logo
              </label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={(e) => handleFileChange('icon', e.target.files?.[0])}
              />
              {files.icon && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(files.icon)}
                    alt="Icon preview"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Size: {(files.icon.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            {/* Whitepaper Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Whitepaper (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                className="input"
                onChange={(e) => handleFileChange('whitepaper', e.target.files?.[0])}
              />
              {files.whitepaper && (
                <p className="text-sm text-gray-500 mt-1">
                  📄 {files.whitepaper.name} ({(files.whitepaper.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Introduction Video
              </label>
              <input
                type="file"
                accept="video/*"
                className="input"
                onChange={(e) => handleFileChange('video', e.target.files?.[0])}
              />
              {files.video && (
                <p className="text-sm text-gray-500 mt-1">
                  🎥 {files.video.name} ({(files.video.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Social Links
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Twitter
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="@username"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telegram
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="t.me/group"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discord
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="discord.gg/..."
                  value={formData.discord}
                  onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💡 About Walrus Storage
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• All files are stored on Walrus decentralized network</li>
              <li>• Storage cost is ~99% cheaper than on-chain</li>
              <li>• Files are permanently available with CDN acceleration</li>
              <li>• Maximum file size: Icon 10MB, PDF 50MB, Video 100MB</li>
            </ul>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {uploadProgress || 'Processing...'}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isUploading}
          >
            {isUploading ? 'Creating Project...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  )
}

