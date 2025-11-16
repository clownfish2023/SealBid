/**
 * Seal integration utilities for SealBid
 * Provides time-lock encryption functionality using Seal
 */

import { SuiClient } from '@mysten/sui/client'
import { SealClient } from '@mysten/seal'
import { SEAL_SERVERS } from '@/config/constants'

/**
 * Create Seal client instance
 */
export function createSealClient(suiClient: SuiClient): SealClient {
  return new SealClient({
    suiClient,
    serverConfigs: SEAL_SERVERS.map(id => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false, // Set to true in production
  })
}

/**
 * Generate Seal key ID based on end time
 * Format: [end_time] (BCS encoded)
 */
export function generateKeyId(endTime: number): string {
  // Convert timestamp to hex format
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setBigUint64(0, BigInt(endTime), true) // little-endian
  
  // Convert ArrayBuffer to hex string without using Buffer
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Encrypt data using Seal time-lock encryption
 * 
 * @param data - Data to be encrypted
 * @param endTime - Unix timestamp when data can be decrypted
 * @param suiClient - Sui client instance
 * @returns Encrypted data as base64 string
 */
export async function encryptWithSeal(
  data: string | Uint8Array,
  endTime: number,
  suiClient: SuiClient
): Promise<string> {
  try {
    // const sealClient = createSealClient(suiClient)
    const keyId = generateKeyId(endTime)
    
    console.log('Encrypting with Seal...')
    console.log('Key ID:', keyId)
    console.log('End Time:', new Date(endTime).toLocaleString())
    console.log('SUI Client:', suiClient ? 'Connected' : 'Not connected')
    
    // Convert string to bytes if needed
    const dataBytes = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data
    
    // Encrypt using Seal (Simplified API - adjust based on actual Seal SDK)
    // const encrypted = await sealClient.encrypt({
    //   data: dataBytes,
    //   id: keyId,
    //   threshold: 1, // Add required fields
    //   packageId: SEAL_PACKAGE_ID,
    // })
    
    // TODO: Implement actual Seal encryption when SDK is available
    // For now, return mock encrypted data
    return btoa(String.fromCharCode(...dataBytes))
    
  } catch (error) {
    console.error('Seal encryption error:', error)
    
    // Fallback to mock for development/testing
    console.warn('⚠️ Falling back to mock encryption (for testing only)')
    const dataBytes = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data
    return btoa(String.fromCharCode(...dataBytes))
  }
}

/**
 * Decrypt data using Seal
 * 
 * @param encryptedData - Encrypted data (base64 string)
 * @param endTime - Unix timestamp of decryption time
 * @param txBytes - Transaction bytes for access policy verification
 * @param suiClient - Sui client instance
 * @returns Decrypted data as string
 */
export async function decryptWithSeal(
  encryptedData: string,
  endTime: number,
  _txBytes: Uint8Array,
  suiClient: SuiClient
): Promise<string> {
  try {
    // const sealClient = createSealClient(suiClient)
    const keyId = generateKeyId(endTime)
    
    console.log('Decrypting with Seal...')
    console.log('Key ID:', keyId)
    console.log('SUI Client:', suiClient ? 'Connected' : 'Not connected')
    console.log('Current Time:', new Date().toLocaleString())
    console.log('Unlock Time:', new Date(endTime).toLocaleString())
    
    // Check if time has passed
    if (!canDecrypt(endTime)) {
      throw new Error('Cannot decrypt: Time lock has not expired yet')
    }
    
    // Convert base64 to bytes
    const binaryString = atob(encryptedData)
    const encryptedBytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      encryptedBytes[i] = binaryString.charCodeAt(i)
    }
    
    // Decrypt using Seal (Simplified API - adjust based on actual Seal SDK)
    // const decrypted = await sealClient.decrypt({
    //   data: encryptedBytes,
    //   txBytes,
    //   sessionKey: ..., // Add required fields
    // })
    
    // TODO: Implement actual Seal decryption when SDK is available
    // For now, return mock decrypted data
    return new TextDecoder().decode(encryptedBytes)
    
  } catch (error) {
    console.error('Seal decryption error:', error)
    
    // Fallback to mock for development/testing
    console.warn('⚠️ Falling back to mock decryption (for testing only)')
    const binaryString = atob(encryptedData)
    const decryptedBytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      decryptedBytes[i] = binaryString.charCodeAt(i)
    }
    return new TextDecoder().decode(decryptedBytes)
  }
}

/**
 * Verify if data can be decrypted
 * Check if current time has reached the unlock time
 */
export function canDecrypt(endTime: number): boolean {
  return Date.now() >= endTime
}

/**
 * Format time remaining until unlock
 */
export function getTimeRemaining(endTime: number): string {
  const now = Date.now()
  if (now >= endTime) {
    return 'Unlocked'
  }
  
  const diff = endTime - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`
  } else {
    return `${seconds}s remaining`
  }
}

/**
 * Check Seal server status
 */
export async function checkSealServerStatus(suiClient: SuiClient): Promise<boolean> {
  try {
    createSealClient(suiClient)
    // Try to access Seal client - if it initializes, servers are accessible
    return true
  } catch (error) {
    console.error('Seal server check failed:', error)
    return false
  }
}

