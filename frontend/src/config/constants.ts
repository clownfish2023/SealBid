// Contract address configuration
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x0'
export const SEAL_PACKAGE_ID = '0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682'

// Coin Registry ID (Shared object created during coin_factory module initialization)
// To get this: Deploy coin_factory module and check "Shared Objects" in deployment output
export const COIN_REGISTRY_ID = import.meta.env.VITE_COIN_REGISTRY_ID || '0x0'

// Seal server configuration
export const SEAL_SERVERS = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
]

// Auction strategies
export const AUCTION_STRATEGIES = {
  TOP_N: 0,
  RANDOM_N: 1,
  CLOSEST_TO_AVG: 2,
} as const

export const STRATEGY_NAMES = {
  [AUCTION_STRATEGIES.TOP_N]: 'Top N highest bids',
  [AUCTION_STRATEGIES.RANDOM_N]: 'Randomly select N',
  [AUCTION_STRATEGIES.CLOSEST_TO_AVG]: 'Closest to average N',
}

// Module names
export const MODULES = {
  COIN_FACTORY: 'coin_factory',
  AUCTION: 'auction',
  SEAL_INTEGRATION: 'seal_integration',
}

