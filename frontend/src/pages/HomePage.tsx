import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
      {/* Hero Section */}
      <div className="max-w-xl mb-10 md:mx-auto text-center lg:max-w-2xl md:mb-12">
        <h1 className="max-w-lg mb-6 font-sans text-3xl font-bold leading-none tracking-tight text-gray-900 dark:text-white sm:text-4xl md:mx-auto">
          Privacy Token Auction Platform
        </h1>
        <p className="text-base text-gray-700 dark:text-gray-300 md:text-lg">
          Based on Sui Seal time-lock encryption technology, enabling fair and transparent blind auctions.
          All bids remain encrypted until the auction ends, ensuring fairness in the bidding process.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-8 row-gap-10 lg:grid-cols-3 mb-16">
        <div className="card">
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary-100 dark:bg-primary-900">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold leading-5 text-gray-900 dark:text-white">
            Time-Lock Encryption
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Using Seal technology, bids remain fully encrypted until auction ends and can only be decrypted after the specified time.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary-100 dark:bg-primary-900">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold leading-5 text-gray-900 dark:text-white">
            Fair Bidding
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Supports multiple allocation strategies: highest price, random selection, closest to average, ensuring fair bidding.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary-100 dark:bg-primary-900">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold leading-5 text-gray-900 dark:text-white">
            One-Click Token Creation
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Easily create custom tokens with name, symbol, logo settings, quickly start auctions.
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
        <Link
          to="/create-coin"
          className="btn btn-primary w-full sm:w-auto text-center"
        >
          Create Token
        </Link>
        <Link
          to="/create-auction"
          className="btn btn-secondary w-full sm:w-auto text-center"
        >
          Create Auction
        </Link>
        <Link
          to="/auctions"
          className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 w-full sm:w-auto text-center"
        >
          Browse Auctions
        </Link>
      </div>

      {/* How it works */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          How It Works
        </h2>
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white text-2xl font-bold">
              1
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Create Token
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Set basic token information including name, symbol, precision and logo
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white text-2xl font-bold">
              2
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Create Auction
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Select token, set auction time, share quantity and allocation strategy
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white text-2xl font-bold">
              3
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Encrypt Bids
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Users encrypt bids with Seal, maintaining privacy until deadline
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white text-2xl font-bold">
              4
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Auto Allocation
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              After auction ends, decrypt bids and automatically allocate tokens according to strategy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

