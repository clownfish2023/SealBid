// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Enhanced auction module with Walrus integration
module seal_bid::enhanced_auction {
    use std::string::String;
    use std::option::{Self, Option};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use seal_bid::project_metadata::{Self, ProjectMetadata, WalrusBlobRef};

    /// Error codes
    const EAuctionNotStarted: u64 = 1;
    const EAuctionEnded: u64 = 2;
    const EAuctionNotEnded: u64 = 3;
    const ENotAuctionCreator: u64 = 4;
    const EAlreadyFinalized: u64 = 5;
    const EInvalidBid: u64 = 6;
    const EInvalidStrategy: u64 = 7;

    /// Auction strategies
    const STRATEGY_TOP_N: u8 = 0;
    const STRATEGY_RANDOM_N: u8 = 1;
    const STRATEGY_CLOSEST_TO_AVG: u8 = 2;

    /// Enhanced auction with project metadata
    public struct EnhancedAuction<phantom T> has key {
        id: UID,
        creator: address,
        
        /// Reference to project metadata
        project_metadata_id: address,
        
        /// Auction parameters
        coin_name: String,
        total_supply: u64,
        winner_count: u64,
        strategy: u8,
        start_time: u64,
        end_time: u64,
        
        /// Encrypted bids
        encrypted_bids: vector<EncryptedBid>,
        
        /// Payment pool
        payment_pool: Balance<SUI>,
        
        /// Status
        finalized: bool,
        
        /// Treasury cap for minting
        treasury_cap: TreasuryCap<T>,
    }

    /// Encrypted bid
    public struct EncryptedBid has store, drop, copy {
        bidder: address,
        encrypted_data: vector<u8>,
        payment_amount: u64,
    }

    /// Event: Enhanced auction created
    public struct EnhancedAuctionCreated has copy, drop {
        auction_id: address,
        project_metadata_id: address,
        creator: address,
        coin_name: String,
        total_supply: u64,
        winner_count: u64,
        strategy: u8,
        start_time: u64,
        end_time: u64,
    }

    /// Event: Bid placed
    public struct BidPlaced has copy, drop {
        auction_id: address,
        bidder: address,
        payment_amount: u64,
    }

    /// Event: Auction finalized
    public struct AuctionFinalized has copy, drop {
        auction_id: address,
        winner_count: u64,
        total_bids: u64,
    }

    /// Create enhanced auction with project metadata
    public entry fun create_enhanced_auction<T>(
        project_metadata_id: address,
        treasury_cap: TreasuryCap<T>,
        coin_name: vector<u8>,
        total_supply: u64,
        winner_count: u64,
        strategy: u8,
        start_time: u64,
        end_time: u64,
        ctx: &mut TxContext
    ) {
        assert!(strategy <= STRATEGY_CLOSEST_TO_AVG, EInvalidStrategy);
        assert!(start_time < end_time, EInvalidBid);
        
        let auction_id = object::new(ctx);
        let creator = ctx.sender();

        let auction = EnhancedAuction<T> {
            id: auction_id,
            creator,
            project_metadata_id,
            coin_name: std::string::utf8(coin_name),
            total_supply,
            winner_count,
            strategy,
            start_time,
            end_time,
            encrypted_bids: vector::empty(),
            payment_pool: balance::zero(),
            finalized: false,
            treasury_cap,
        };

        event::emit(EnhancedAuctionCreated {
            auction_id: object::id_address(&auction),
            project_metadata_id,
            creator,
            coin_name: auction.coin_name,
            total_supply,
            winner_count,
            strategy,
            start_time,
            end_time,
        });

        transfer::share_object(auction);
    }

    /// Place encrypted bid
    public entry fun place_bid<T>(
        auction: &mut EnhancedAuction<T>,
        encrypted_bid_data: vector<u8>,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= auction.start_time, EAuctionNotStarted);
        assert!(current_time < auction.end_time, EAuctionEnded);
        assert!(!auction.finalized, EAlreadyFinalized);

        let payment_amount = coin::value(&payment);
        let payment_balance = coin::into_balance(payment);

        let bid = EncryptedBid {
            bidder: ctx.sender(),
            encrypted_data: encrypted_bid_data,
            payment_amount,
        };

        auction.encrypted_bids.push_back(bid);
        balance::join(&mut auction.payment_pool, payment_balance);

        event::emit(BidPlaced {
            auction_id: object::id_address(auction),
            bidder: ctx.sender(),
            payment_amount,
        });
    }

    /// Finalize auction
    public entry fun finalize_auction<T>(
        auction: &mut EnhancedAuction<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= auction.end_time, EAuctionNotEnded);
        assert!(ctx.sender() == auction.creator, ENotAuctionCreator);
        assert!(!auction.finalized, EAlreadyFinalized);

        auction.finalized = true;

        event::emit(AuctionFinalized {
            auction_id: object::id_address(auction),
            winner_count: auction.winner_count,
            total_bids: auction.encrypted_bids.length(),
        });
    }

    /// Distribute tokens to winner
    public entry fun distribute_tokens<T>(
        auction: &mut EnhancedAuction<T>,
        winner: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(auction.finalized, EInvalidBid);
        assert!(ctx.sender() == auction.creator, ENotAuctionCreator);

        let coin = coin::mint(&mut auction.treasury_cap, amount, ctx);
        transfer::public_transfer(coin, winner);
    }

    /// Refund to bidder
    public entry fun refund<T>(
        auction: &mut EnhancedAuction<T>,
        recipient: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(auction.finalized, EInvalidBid);
        assert!(ctx.sender() == auction.creator, ENotAuctionCreator);

        let refund_balance = balance::split(&mut auction.payment_pool, amount);
        let refund_coin = coin::from_balance(refund_balance, ctx);
        transfer::public_transfer(refund_coin, recipient);
    }

    // ==================== Getter Functions ====================

    public fun get_project_metadata_id<T>(auction: &EnhancedAuction<T>): address {
        auction.project_metadata_id
    }

    public fun get_auction_info<T>(auction: &EnhancedAuction<T>): (String, u64, u64, u8, u64, u64, bool) {
        (
            auction.coin_name,
            auction.total_supply,
            auction.winner_count,
            auction.strategy,
            auction.start_time,
            auction.end_time,
            auction.finalized
        )
    }

    public fun get_bid_count<T>(auction: &EnhancedAuction<T>): u64 {
        auction.encrypted_bids.length()
    }

    public fun get_encrypted_bids<T>(auction: &EnhancedAuction<T>): vector<EncryptedBid> {
        auction.encrypted_bids
    }
}

