/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PACKAGE_ID: string
  readonly VITE_COIN_REGISTRY_ID: string
  readonly VITE_NETWORK: string
  readonly VITE_WALRUS_AGGREGATOR: string
  readonly VITE_WALRUS_PUBLISHER: string
  readonly VITE_WALRUS_MOCK: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

