/**
 * Hook to fetch user's owned assets (projects, TreasuryCaps, etc.)
 */
import { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { PACKAGE_ID } from '@/config/constants'

export interface UserProject {
  id: string
  name: string
  symbol: string
  objectType: string
}

export interface UserTreasuryCap {
  id: string
  coinType: string
  coinName: string
  symbol: string
  totalSupply: string
  objectType: string
}

export interface UserSimpleTreasuryCap {
  id: string
  symbol: string
  totalSupply: string
  mintable: boolean
}

/**
 * Fetch user's owned ProjectMetadata objects
 */
export function useUserProjects() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const [projects, setProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account?.address) {
      setProjects([])
      return
    }

    const fetchProjects = async () => {
      setLoading(true)
      setError(null)
      try {
        // Query for ProjectMetadata objects owned by user
        const response = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${PACKAGE_ID}::project_metadata::ProjectMetadata`,
          },
          options: {
            showContent: true,
            showType: true,
          },
        })

        const projectList: UserProject[] = response.data
          .map((obj) => {
            if (obj.data?.content && 'fields' in obj.data.content) {
              const fields = obj.data.content.fields as any
              return {
                id: obj.data.objectId,
                name: fields.name || 'Unknown',
                symbol: fields.symbol || '',
                objectType: obj.data.type || '',
              }
            }
            return null
          })
          .filter((p): p is UserProject => p !== null)

        setProjects(projectList)
      } catch (err: any) {
        console.error('Failed to fetch projects:', err)
        setError(err.message || 'Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [account?.address, suiClient])

  return { projects, loading, error, refetch: () => {} }
}

/**
 * Fetch user's owned TreasuryCap objects (for standard Sui coins)
 */
export function useUserTreasuryCaps() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const [treasuryCaps, setTreasuryCaps] = useState<UserTreasuryCap[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account?.address) {
      setTreasuryCaps([])
      return
    }

    const fetchTreasuryCaps = async () => {
      setLoading(true)
      setError(null)
      try {
        // Query for TreasuryCap objects owned by user
        const response = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            MatchAny: [
              { StructType: '0x2::coin::TreasuryCap' },
            ],
          },
          options: {
            showContent: true,
            showType: true,
          },
        })

        const capList: UserTreasuryCap[] = []

        for (const obj of response.data) {
          if (obj.data?.type && obj.data.type.includes('TreasuryCap')) {
            // Extract coin type from TreasuryCap<CoinType>
            const match = obj.data.type.match(/<(.+)>/)
            const coinType = match ? match[1] : ''
            
            // Try to extract coin name and symbol
            let coinName = 'Unknown Token'
            let symbol = ''
            let totalSupply = '0'

            if (obj.data.content && 'fields' in obj.data.content) {
              const fields = obj.data.content.fields as any
              totalSupply = fields.total_supply || '0'
            }

            // Try to get coin metadata
            try {
              if (coinType) {
                const metadata = await suiClient.getCoinMetadata({ coinType })
                if (metadata) {
                  coinName = metadata.name || coinName
                  symbol = metadata.symbol || ''
                }
              }
            } catch (e) {
              // Metadata not found, use defaults
              console.warn('Could not fetch metadata for coin:', coinType)
            }

            capList.push({
              id: obj.data.objectId,
              coinType,
              coinName,
              symbol,
              totalSupply,
              objectType: obj.data.type,
            })
          }
        }

        setTreasuryCaps(capList)
      } catch (err: any) {
        console.error('Failed to fetch TreasuryCaps:', err)
        setError(err.message || 'Failed to fetch TreasuryCaps')
      } finally {
        setLoading(false)
      }
    }

    fetchTreasuryCaps()
  }, [account?.address, suiClient])

  return { treasuryCaps, loading, error }
}

/**
 * Fetch user's owned SimpleTreasuryCap objects (for simple coins)
 */
export function useUserSimpleTreasuryCaps() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const [simpleTreasuryCaps, setSimpleTreasuryCaps] = useState<UserSimpleTreasuryCap[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account?.address) {
      setSimpleTreasuryCaps([])
      return
    }

    const fetchSimpleTreasuryCaps = async () => {
      setLoading(true)
      setError(null)
      try {
        // Query for SimpleTreasuryCap objects owned by user
        const response = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${PACKAGE_ID}::simple_coin_factory::SimpleTreasuryCap`,
          },
          options: {
            showContent: true,
            showType: true,
          },
        })

        const capList: UserSimpleTreasuryCap[] = response.data
          .map((obj) => {
            if (obj.data?.content && 'fields' in obj.data.content) {
              const fields = obj.data.content.fields as any
              return {
                id: obj.data.objectId,
                symbol: fields.symbol || 'Unknown',
                totalSupply: fields.total_supply || '0',
                mintable: fields.mintable || false,
              }
            }
            return null
          })
          .filter((c): c is UserSimpleTreasuryCap => c !== null)

        setSimpleTreasuryCaps(capList)
      } catch (err: any) {
        console.error('Failed to fetch SimpleTreasuryCaps:', err)
        setError(err.message || 'Failed to fetch SimpleTreasuryCaps')
      } finally {
        setLoading(false)
      }
    }

    fetchSimpleTreasuryCaps()
  }, [account?.address, suiClient])

  return { simpleTreasuryCaps, loading, error }
}

