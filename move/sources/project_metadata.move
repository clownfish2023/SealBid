// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Project metadata module - stores project information on Walrus
module seal_bid::project_metadata {
    use std::string::{Self, String};
    use std::option::{Self, Option};

    /// Walrus blob reference
    public struct WalrusBlobRef has store, copy, drop {
        blob_id: vector<u8>,
        size: u64,
        content_type: String,
    }

    /// Project metadata structure
    public struct ProjectMetadata has key, store {
        id: UID,
        /// Project name
        name: String,
        /// Project symbol
        symbol: String,
        /// Creator address
        creator: address,
        
        /// Project icon/logo stored on Walrus
        icon_blob: Option<WalrusBlobRef>,
        
        /// Whitepaper PDF stored on Walrus
        whitepaper_blob: Option<WalrusBlobRef>,
        
        /// Introduction video stored on Walrus
        video_blob: Option<WalrusBlobRef>,
        
        /// Project description and details stored on Walrus (JSON)
        description_blob: Option<WalrusBlobRef>,
        
        /// Additional documents (audit reports, etc.)
        documents: vector<WalrusBlobRef>,
        
        /// Creation timestamp
        created_at: u64,
        
        /// Last updated timestamp
        updated_at: u64,
    }

    /// Auction history record
    public struct AuctionHistory has key, store {
        id: UID,
        /// Reference to auction
        auction_id: address,
        /// Project metadata reference
        project_metadata_id: address,
        
        /// Auction summary data stored on Walrus (JSON)
        summary_blob: WalrusBlobRef,
        
        /// Detailed bid data stored on Walrus (JSON)
        bids_blob: Option<WalrusBlobRef>,
        
        /// Winner information
        winner: Option<address>,
        final_price: Option<u64>,
        
        /// Finalized timestamp
        finalized_at: u64,
    }

    /// Event: Project metadata created
    public struct ProjectMetadataCreated has copy, drop {
        metadata_id: address,
        name: String,
        symbol: String,
        creator: address,
    }

    /// Event: Project metadata updated
    public struct ProjectMetadataUpdated has copy, drop {
        metadata_id: address,
        updated_fields: vector<String>,
    }

    /// Event: Auction history archived
    public struct AuctionHistoryArchived has copy, drop {
        history_id: address,
        auction_id: address,
        summary_blob_id: vector<u8>,
    }

    // ==================== Public Functions ====================

    /// Create new project metadata
    public fun create_project_metadata(
        name: vector<u8>,
        symbol: vector<u8>,
        clock_timestamp: u64,
        ctx: &mut TxContext
    ): ProjectMetadata {
        let metadata_id = object::new(ctx);
        let creator = ctx.sender();

        let metadata = ProjectMetadata {
            id: metadata_id,
            name: string::utf8(name),
            symbol: string::utf8(symbol),
            creator,
            icon_blob: option::none(),
            whitepaper_blob: option::none(),
            video_blob: option::none(),
            description_blob: option::none(),
            documents: vector::empty(),
            created_at: clock_timestamp,
            updated_at: clock_timestamp,
        };

        sui::event::emit(ProjectMetadataCreated {
            metadata_id: object::id_address(&metadata),
            name: metadata.name,
            symbol: metadata.symbol,
            creator,
        });

        metadata
    }

    /// Create Walrus blob reference
    public fun new_blob_ref(
        blob_id: vector<u8>,
        size: u64,
        content_type: vector<u8>
    ): WalrusBlobRef {
        WalrusBlobRef {
            blob_id,
            size,
            content_type: string::utf8(content_type),
        }
    }

    /// Set project icon
    public fun set_icon(
        metadata: &mut ProjectMetadata,
        blob_ref: WalrusBlobRef,
        clock_timestamp: u64
    ) {
        option::fill(&mut metadata.icon_blob, blob_ref);
        metadata.updated_at = clock_timestamp;
    }

    /// Set whitepaper
    public fun set_whitepaper(
        metadata: &mut ProjectMetadata,
        blob_ref: WalrusBlobRef,
        clock_timestamp: u64
    ) {
        option::fill(&mut metadata.whitepaper_blob, blob_ref);
        metadata.updated_at = clock_timestamp;
    }

    /// Set introduction video
    public fun set_video(
        metadata: &mut ProjectMetadata,
        blob_ref: WalrusBlobRef,
        clock_timestamp: u64
    ) {
        option::fill(&mut metadata.video_blob, blob_ref);
        metadata.updated_at = clock_timestamp;
    }

    /// Set description
    public fun set_description(
        metadata: &mut ProjectMetadata,
        blob_ref: WalrusBlobRef,
        clock_timestamp: u64
    ) {
        option::fill(&mut metadata.description_blob, blob_ref);
        metadata.updated_at = clock_timestamp;
    }

    /// Add document
    public fun add_document(
        metadata: &mut ProjectMetadata,
        blob_ref: WalrusBlobRef,
        clock_timestamp: u64
    ) {
        metadata.documents.push_back(blob_ref);
        metadata.updated_at = clock_timestamp;
    }

    /// Create auction history record
    public fun create_auction_history(
        auction_id: address,
        project_metadata_id: address,
        summary_blob_id: vector<u8>,
        summary_size: u64,
        winner: Option<address>,
        final_price: Option<u64>,
        clock_timestamp: u64,
        ctx: &mut TxContext
    ): AuctionHistory {
        let history_id = object::new(ctx);
        
        let summary_blob = WalrusBlobRef {
            blob_id: summary_blob_id,
            size: summary_size,
            content_type: string::utf8(b"application/json"),
        };

        let history = AuctionHistory {
            id: history_id,
            auction_id,
            project_metadata_id,
            summary_blob,
            bids_blob: option::none(),
            winner,
            final_price,
            finalized_at: clock_timestamp,
        };

        sui::event::emit(AuctionHistoryArchived {
            history_id: object::id_address(&history),
            auction_id,
            summary_blob_id,
        });

        history
    }

    /// Set detailed bids data
    public fun set_bids_data(
        history: &mut AuctionHistory,
        blob_ref: WalrusBlobRef
    ) {
        option::fill(&mut history.bids_blob, blob_ref);
    }

    // ==================== Entry Functions ====================

    /// Entry: Create and share project metadata
    public entry fun create_and_share_metadata(
        name: vector<u8>,
        symbol: vector<u8>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let metadata = create_project_metadata(
            name,
            symbol,
            sui::clock::timestamp_ms(clock),
            ctx
        );
        transfer::share_object(metadata);
    }

    /// Entry: Update project icon
    public entry fun update_icon(
        metadata: &mut ProjectMetadata,
        blob_id: vector<u8>,
        size: u64,
        content_type: vector<u8>,
        clock: &sui::clock::Clock,
        ctx: &TxContext
    ) {
        assert!(metadata.creator == ctx.sender(), 0);
        let blob_ref = new_blob_ref(blob_id, size, content_type);
        set_icon(metadata, blob_ref, sui::clock::timestamp_ms(clock));
    }

    /// Entry: Update whitepaper
    public entry fun update_whitepaper(
        metadata: &mut ProjectMetadata,
        blob_id: vector<u8>,
        size: u64,
        clock: &sui::clock::Clock,
        ctx: &TxContext
    ) {
        assert!(metadata.creator == ctx.sender(), 0);
        let blob_ref = new_blob_ref(blob_id, size, b"application/pdf");
        set_whitepaper(metadata, blob_ref, sui::clock::timestamp_ms(clock));
    }

    /// Entry: Update video
    public entry fun update_video(
        metadata: &mut ProjectMetadata,
        blob_id: vector<u8>,
        size: u64,
        content_type: vector<u8>,
        clock: &sui::clock::Clock,
        ctx: &TxContext
    ) {
        assert!(metadata.creator == ctx.sender(), 0);
        let blob_ref = new_blob_ref(blob_id, size, content_type);
        set_video(metadata, blob_ref, sui::clock::timestamp_ms(clock));
    }

    /// Entry: Update description
    public entry fun update_description(
        metadata: &mut ProjectMetadata,
        blob_id: vector<u8>,
        size: u64,
        clock: &sui::clock::Clock,
        ctx: &TxContext
    ) {
        assert!(metadata.creator == ctx.sender(), 0);
        let blob_ref = new_blob_ref(blob_id, size, b"application/json");
        set_description(metadata, blob_ref, sui::clock::timestamp_ms(clock));
    }

    /// Entry: Archive auction history
    public entry fun archive_auction(
        auction_id: address,
        project_metadata_id: address,
        summary_blob_id: vector<u8>,
        summary_size: u64,
        winner: Option<address>,
        final_price: Option<u64>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let history = create_auction_history(
            auction_id,
            project_metadata_id,
            summary_blob_id,
            summary_size,
            winner,
            final_price,
            sui::clock::timestamp_ms(clock),
            ctx
        );
        transfer::share_object(history);
    }

    // ==================== Getter Functions ====================

    public fun get_name(metadata: &ProjectMetadata): String {
        metadata.name
    }

    public fun get_symbol(metadata: &ProjectMetadata): String {
        metadata.symbol
    }

    public fun get_creator(metadata: &ProjectMetadata): address {
        metadata.creator
    }

    public fun get_icon_blob(metadata: &ProjectMetadata): &Option<WalrusBlobRef> {
        &metadata.icon_blob
    }

    public fun get_whitepaper_blob(metadata: &ProjectMetadata): &Option<WalrusBlobRef> {
        &metadata.whitepaper_blob
    }

    public fun get_video_blob(metadata: &ProjectMetadata): &Option<WalrusBlobRef> {
        &metadata.video_blob
    }

    public fun get_description_blob(metadata: &ProjectMetadata): &Option<WalrusBlobRef> {
        &metadata.description_blob
    }

    public fun get_documents(metadata: &ProjectMetadata): &vector<WalrusBlobRef> {
        &metadata.documents
    }

    public fun get_blob_id(blob_ref: &WalrusBlobRef): &vector<u8> {
        &blob_ref.blob_id
    }

    public fun get_blob_size(blob_ref: &WalrusBlobRef): u64 {
        blob_ref.size
    }

    public fun get_blob_content_type(blob_ref: &WalrusBlobRef): String {
        blob_ref.content_type
    }

    #[test_only]
    public fun destroy_for_testing(metadata: ProjectMetadata) {
        let ProjectMetadata {
            id,
            name: _,
            symbol: _,
            creator: _,
            icon_blob: _,
            whitepaper_blob: _,
            video_blob: _,
            description_blob: _,
            documents: _,
            created_at: _,
            updated_at: _,
        } = metadata;
        object::delete(id);
    }
}

