/**
 * Walrus Client for SealBid
 * Handles file uploads and downloads to/from Walrus network
 */

// Note: Install @mysten/walrus when available
// For now, we provide the interface and implementation structure

export interface WalrusConfig {
  aggregatorEndpoint: string;
  publisherEndpoint: string;
  network: 'testnet' | 'mainnet';
}

export interface BlobInfo {
  blobId: string;
  size: number;
  contentType: string;
}

export interface ProjectMetadata {
  name: string;
  symbol: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export class WalrusClient {
  private config: WalrusConfig;

  constructor(config: WalrusConfig) {
    this.config = config;
  }

  /**
   * Upload file to Walrus
   * Uses PUT /v1/blobs endpoint as per Walrus Publisher API
   * Reference: https://publisher.walrus-testnet.walrus.space/v1/api#tag/routes/operation/put_blob
   */
  async upload(file: File): Promise<BlobInfo> {
    // Development mode fallback: use mock blob IDs if Walrus is not available
    if (import.meta.env.DEV && import.meta.env.VITE_WALRUS_MOCK === 'true') {
      console.warn('⚠️ Using mock Walrus upload (VITE_WALRUS_MOCK=true)');
      const mockBlobId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        blobId: mockBlobId,
        size: file.size,
        contentType: file.type,
      };
    }

    try {
      // Use PUT /v1/blobs endpoint as per Walrus Publisher API
      // Reference: https://publisher.walrus-testnet.walrus.space/v1/api#tag/routes/operation/put_blob
      const response = await fetch(`${this.config.publisherEndpoint}/v1/blobs`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        const errorMessage = `Upload failed: ${response.status} ${errorText}`;
        
        // Provide helpful error message
        if (response.status === 404) {
          console.error('Walrus endpoint not found. Possible issues:');
          console.error('1. Endpoint URL may be incorrect:', `${this.config.publisherEndpoint}/v1/blobs`);
          console.error('2. Walrus testnet may be down or endpoint changed');
          console.error('3. Check Walrus API documentation: https://publisher.walrus-testnet.walrus.space/v1/api');
          console.error('4. For development, set VITE_WALRUS_MOCK=true to use mock uploads');
          throw new Error(`${errorMessage}\n\nTip: Check VITE_WALRUS_PUBLISHER environment variable or Walrus API documentation.\nFor development, you can set VITE_WALRUS_MOCK=true to use mock uploads.`);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Handle different response formats
      // According to Walrus API, response should contain blobId
      const blobId = result.blobId 
        || result.id
        || result.newlyCreated?.blobObject?.blobId 
        || result.alreadyCertified?.blobId;
      
      if (!blobId) {
        console.warn('Unexpected response format:', result);
        throw new Error('Invalid response format from Walrus API. Expected blobId in response.');
      }
      
      return {
        blobId,
        size: file.size,
        contentType: file.type,
      };
    } catch (error) {
      console.error('Walrus upload error:', error);
      
      // In development, provide fallback suggestion
      if (import.meta.env.DEV) {
        console.warn('💡 Development tip: Set VITE_WALRUS_MOCK=true in .env to use mock uploads');
      }
      
      throw new Error(`Failed to upload to Walrus: ${error}`);
    }
  }

  /**
   * Upload JSON data to Walrus
   */
  async uploadJson(data: any): Promise<BlobInfo> {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'data.json', { type: 'application/json' });
    
    return this.upload(file);
  }

  /**
   * Download blob from Walrus
   */
  async download(blobId: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.config.aggregatorEndpoint}/v1/${blobId}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return response.arrayBuffer();
    } catch (error) {
      console.error('Walrus download error:', error);
      throw new Error(`Failed to download from Walrus: ${error}`);
    }
  }

  /**
   * Download and parse JSON from Walrus
   */
  async downloadJson<T = any>(blobId: string): Promise<T> {
    const buffer = await this.download(blobId);
    const text = new TextDecoder().decode(buffer);
    return JSON.parse(text);
  }

  /**
   * Get blob URL for direct access
   */
  getBlobUrl(blobId: string): string {
    return `${this.config.aggregatorEndpoint}/v1/${blobId}`;
  }

  /**
   * Check if blob exists
   */
  async blobExists(blobId: string): Promise<boolean> {
    try {
      const response = await fetch(this.getBlobUrl(blobId), {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Project Metadata Manager
 */
export class ProjectMetadataManager {
  private walrusClient: WalrusClient;

  constructor(walrusClient: WalrusClient) {
    this.walrusClient = walrusClient;
  }

  /**
   * Upload complete project metadata
   */
  async uploadProjectMetadata(data: {
    metadata: ProjectMetadata;
    icon?: File;
    whitepaper?: File;
    video?: File;
  }): Promise<{
    metadataBlob: BlobInfo;
    iconBlob?: BlobInfo;
    whitepaperBlob?: BlobInfo;
    videoBlob?: BlobInfo;
  }> {
    const result: any = {};

    // Upload icon
    if (data.icon) {
      result.iconBlob = await this.walrusClient.upload(data.icon);
    }

    // Upload whitepaper
    if (data.whitepaper) {
      result.whitepaperBlob = await this.walrusClient.upload(data.whitepaper);
    }

    // Upload video
    if (data.video) {
      result.videoBlob = await this.walrusClient.upload(data.video);
    }

    // Create metadata JSON with blob references
    const metadataJson = {
      ...data.metadata,
      icon: result.iconBlob?.blobId,
      whitepaper: result.whitepaperBlob?.blobId,
      video: result.videoBlob?.blobId,
      timestamp: Date.now(),
      version: '1.0.0',
    };

    // Upload metadata JSON
    result.metadataBlob = await this.walrusClient.uploadJson(metadataJson);

    return result;
  }

  /**
   * Download project metadata
   */
  async downloadProjectMetadata(metadataBlobId: string): Promise<any> {
    return this.walrusClient.downloadJson(metadataBlobId);
  }
}

/**
 * Auction History Manager
 */
export class AuctionHistoryManager {
  private walrusClient: WalrusClient;

  constructor(walrusClient: WalrusClient) {
    this.walrusClient = walrusClient;
  }

  /**
   * Archive auction data
   */
  async archiveAuction(data: {
    auctionId: string;
    projectMetadataId: string;
    coinName: string;
    totalSupply: string;
    winnerCount: string;
    strategy: number;
    startTime: number;
    endTime: number;
    finalizedAt: number;
    bids: Array<{
      bidder: string;
      bidAmount: string;
      paymentAmount: string;
      timestamp: number;
    }>;
    winners: Array<{
      address: string;
      amount: string;
    }>;
    statistics: {
      totalBids: number;
      totalVolume: string;
      averageBid: string;
      participantCount: number;
    };
  }): Promise<{
    summaryBlob: BlobInfo;
    bidsBlob: BlobInfo;
  }> {
    // Upload bids data
    const bidsBlob = await this.walrusClient.uploadJson({
      bids: data.bids,
      timestamp: Date.now(),
    });

    // Create summary
    const summary = {
      auctionId: data.auctionId,
      projectMetadataId: data.projectMetadataId,
      coinName: data.coinName,
      totalSupply: data.totalSupply,
      winnerCount: data.winnerCount,
      strategy: data.strategy,
      startTime: data.startTime,
      endTime: data.endTime,
      finalizedAt: data.finalizedAt,
      winners: data.winners,
      statistics: data.statistics,
      bidsReference: bidsBlob.blobId,
      archivedAt: Date.now(),
    };

    // Upload summary
    const summaryBlob = await this.walrusClient.uploadJson(summary);

    return {
      summaryBlob,
      bidsBlob,
    };
  }

  /**
   * Load auction history
   */
  async loadAuctionHistory(summaryBlobId: string): Promise<any> {
    const summary = await this.walrusClient.downloadJson(summaryBlobId);
    
    // Optionally load detailed bids
    if (summary.bidsReference) {
      const bids = await this.walrusClient.downloadJson(summary.bidsReference);
      summary.bids = bids.bids;
    }

    return summary;
  }
}

/**
 * Initialize Walrus client with environment config
 */
export function createWalrusClient(): WalrusClient {
  const config: WalrusConfig = {
    aggregatorEndpoint: import.meta.env.VITE_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space',
    publisherEndpoint: import.meta.env.VITE_WALRUS_PUBLISHER || 'https://publisher.walrus-testnet.walrus.space',
    network: (import.meta.env.VITE_NETWORK as any) || 'testnet',
  };

  // Log configuration in development
  if (import.meta.env.DEV) {
    console.log('Walrus Client Config:', {
      aggregator: config.aggregatorEndpoint,
      publisher: config.publisherEndpoint,
      network: config.network,
    });
  }

  return new WalrusClient(config);
}

export function createProjectMetadataManager(): ProjectMetadataManager {
  return new ProjectMetadataManager(createWalrusClient());
}

export function createAuctionHistoryManager(): AuctionHistoryManager {
  return new AuctionHistoryManager(createWalrusClient());
}

