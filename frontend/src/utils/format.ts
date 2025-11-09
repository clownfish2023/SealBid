/**
 * Format utility functions
 */

/**
 * Format address, showing first 6 and last 4 characters
 */
export function formatAddress(address: string): string {
  if (!address) return ''
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  return n.toLocaleString('en-US')
}

/**
 * Format token amount (considering precision)
 */
export function formatTokenAmount(amount: string | number, decimals: number = 9): string {
  const value = typeof amount === 'string' ? BigInt(amount) : BigInt(Math.floor(amount))
  const divisor = BigInt(10 ** decimals)
  const integerPart = value / divisor
  const fractionalPart = value % divisor
  
  if (fractionalPart === 0n) {
    return formatNumber(Number(integerPart))
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmed = fractionalStr.replace(/0+$/, '')
  
  return `${formatNumber(Number(integerPart))}.${trimmed}`
}

/**
 * Format timestamp as relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = timestamp - now
  const absDiff = Math.abs(diff)
  
  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return diff > 0 ? `${days} days later` : `${days} days ago`
  } else if (hours > 0) {
    return diff > 0 ? `${hours} hours later` : `${hours} hours ago`
  } else if (minutes > 0) {
    return diff > 0 ? `${minutes} minutes later` : `${minutes} minutes ago`
  } else {
    return diff > 0 ? `${seconds} seconds later` : `${seconds} seconds ago`
  }
}

/**
 * Format date and time
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Convert SUI to MIST (smallest unit)
 */
export function suiToMist(sui: number): bigint {
  return BigInt(Math.floor(sui * 1_000_000_000))
}

/**
 * Convert MIST to SUI
 */
export function mistToSui(mist: bigint | string): string {
  const value = typeof mist === 'string' ? BigInt(mist) : mist
  return formatTokenAmount(value.toString(), 9)
}

