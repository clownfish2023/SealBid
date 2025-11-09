import { Outlet, Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit'

export default function Layout() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'border-b-2 border-primary-500'
      : 'hover:text-primary-400'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">
                  🔐 SealBid
                </span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive(
                    '/'
                  )}`}
                >
                  Home
                </Link>
                <Link
                  to="/create-coin"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive(
                    '/create-coin'
                  )}`}
                >
                  Create Token
                </Link>
                <Link
                  to="/create-auction"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive(
                    '/create-auction'
                  )}`}
                >
                  Create Auction
                </Link>
                <Link
                  to="/auctions"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive(
                    '/auctions'
                  )}`}
                >
                  Auction List
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 SealBid. Privacy auction platform based on Sui Seal
          </p>
        </div>
      </footer>
    </div>
  )
}

