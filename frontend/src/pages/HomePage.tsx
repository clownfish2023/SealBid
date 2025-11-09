import { Link } from 'react-router-dom'
import { LockClosedIcon, ClockIcon, ShieldCheckIcon, CubeIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          SealBid
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Privacy-Preserving Token Auction Platform on Sui
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-500 mb-8 max-w-3xl mx-auto">
          Using Seal's time-lock encryption and Walrus decentralized storage, 
          create and participate in fully private token auctions with multiple allocation strategies
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/create-project" className="btn btn-primary">
            Create Project
          </Link>
          <Link to="/create-auction" className="btn btn-secondary">
            Create Auction
          </Link>
          <Link to="/auctions" className="btn bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
            Browse Auctions
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <LockClosedIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Privacy Protection
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Bids are encrypted with Seal time-lock, only revealed after auction ends
          </p>
        </div>

        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <ClockIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Time-Lock Encryption
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Leveraging Seal's time-lock mechanism, ensuring fairness
          </p>
        </div>

        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Multiple Strategies
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Top N, Random N, or Closest to Average allocation strategies
          </p>
        </div>

        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CubeIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Walrus Storage
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Project assets and history stored on Walrus, permanent and low-cost
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          How It Works
        </h2>
        
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create Project
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload project materials (logo, whitepaper, video) to Walrus storage, 
                create on-chain metadata with references to stored assets
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create Auction
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Set auction parameters: total supply, winner count, allocation strategy, 
                and time window. Link to your project metadata
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Submit Encrypted Bids
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Users submit bids encrypted with Seal time-lock. Bids remain private 
                until auction ends. Deposit is required and refunded if not selected
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reveal & Distribute
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                After deadline, Seal automatically enables decryption. Creator finalizes 
                auction, selects winners based on strategy, and distributes tokens
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              5
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Archive History
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete auction data (bids, winners, statistics) is archived to Walrus 
                for permanent, low-cost storage and future reference
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Highlights */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🔐 Seal Time-Lock Encryption
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Bids encrypted to specific future time</li>
            <li>• Automatic decryption after deadline</li>
            <li>• No trusted third party needed</li>
            <li>• Provably fair and transparent</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📦 Walrus Decentralized Storage
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• 99% cheaper than on-chain storage</li>
            <li>• Permanent and censorship-resistant</li>
            <li>• CDN-accelerated access worldwide</li>
            <li>• Perfect for media and documents</li>
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="card text-center bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Launch Your Token?
        </h2>
        <p className="text-lg mb-6 opacity-90">
          Create a privacy-preserving auction in minutes
        </p>
        <Link to="/create-project" className="btn bg-white text-primary-600 hover:bg-gray-100">
          Get Started Now
        </Link>
      </div>
    </div>
  )
}
