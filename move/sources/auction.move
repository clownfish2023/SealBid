// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Privacy auction module - Implements blind bidding using Seal time-lock encryption
module seal_bid::auction {
    use std::string::String;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::bcs;
    use sui::event;

    /// Error codes
    const EAuctionNotStarted: u64 = 1;
    const EAuctionEnded: u64 = 2;
    const EAuctionNotEnded: u64 = 3;
    const ENotAuctionCreator: u64 = 4;
    const EAlreadyFinalized: u64 = 5;
    const EInvalidBid: u64 = 6;
    const EInvalidStrategy: u64 = 7;

    /// Auction strategies
    const STRATEGY_TOP_N: u8 = 0;        // Top N highest bids
    const STRATEGY_RANDOM_N: u8 = 1;      // Randomly select N
    const STRATEGY_CLOSEST_TO_AVG: u8 = 2; // N bids closest to the average

    /// Auction object
    public struct Auction<phantom T> has key {
        id: UID,
        /// Creator
        creator: address,
        /// Coin type name for the auctioned token
        coin_name: String,
        /// Total supply (number of tokens to auction)
        total_supply: u64,
        /// Number of winners
        winner_count: u64,
        /// Auction strategy
        strategy: u8,
        /// Start time (milliseconds)
        start_time: u64,
        /// End time (milliseconds)
        end_time: u64,
        /// Encrypted bids list (user address -> encrypted bid data)
        encrypted_bids: vector<EncryptedBid>,
        /// Payment pool (for refunds)
        payment_pool: Balance<SUI>,
        /// Whether finalized
        finalized: bool,
        /// TreasuryCap used to mint tokens
        treasury_cap: TreasuryCap<T>,
    }

    /// Encrypted bid
    public struct EncryptedBid has store, drop, copy {
        bidder: address,
        /// Seal encrypted bid data (contains bid amount)
        encrypted_data: vector<u8>,
        /// SUI amount paid (for validation and refund)
        payment_amount: u64,
    }

    /// Bid info
    public struct BidInfo has store, drop, copy {
        bidder: address,
        bid_amount: u64,
        payment_amount: u64,
    }

    /// Auction created event
    public struct AuctionCreated has copy, drop {
        auction_id: ID,
        creator: address,
        coin_name: String,
        total_supply: u64,
        winner_count: u64,
        strategy: u8,
        start_time: u64,
        end_time: u64,
    }

    /// Bid placed event
    public struct BidPlaced has copy, drop {
        auction_id: ID,
        bidder: address,
        payment_amount: u64,
    }

    /// Auction finalized event
    public struct AuctionFinalized has copy, drop {
        auction_id: ID,
        winner_count: u64,
    }

    /// Create new auction
    public entry fun create_auction<T>(
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
        
        let auction_id = object::new(ctx);
        let auction_id_copy = object::uid_to_inner(&auction_id);

        let auction = Auction<T> {
            id: auction_id,
            creator: ctx.sender(),
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

        event::emit(AuctionCreated {
            auction_id: auction_id_copy,
            creator: ctx.sender(),
            coin_name: std::string::utf8(coin_name),
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
        auction: &mut Auction<T>,
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

        // Store encrypted bid
        let bid = EncryptedBid {
            bidder: ctx.sender(),
            encrypted_data: encrypted_bid_data,
            payment_amount,
        };

        auction.encrypted_bids.push_back(bid);
        balance::join(&mut auction.payment_pool, payment_balance);

        event::emit(BidPlaced {
            auction_id: object::uid_to_inner(&auction.id),
            bidder: ctx.sender(),
            payment_amount,
        });
    }

    /// Complete auction and allocate tokens
    /// Note: In real applications, bids should be decrypted via Seal; simplified here
    public entry fun finalize_auction<T>(
        auction: &mut Auction<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= auction.end_time, EAuctionNotEnded);
        assert!(ctx.sender() == auction.creator, ENotAuctionCreator);
        assert!(!auction.finalized, EAlreadyFinalized);

        auction.finalized = true;

        event::emit(AuctionFinalized {
            auction_id: object::uid_to_inner(&auction.id),
            winner_count: auction.winner_count,
        });
    }

    /// Allocate tokens to winners
    public entry fun distribute_tokens<T>(
        auction: &mut Auction<T>,
        winner: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(auction.finalized, EInvalidBid);
        assert!(ctx.sender() == auction.creator, ENotAuctionCreator);

        let coin = coin::mint(&mut auction.treasury_cap, amount, ctx);
        transfer::public_transfer(coin, winner);
    }

    /// Refund to losers
    public entry fun refund<T>(
        auction: &mut Auction<T>,
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

    // === Seal access policy functions ===
    
    /// Seal access policy: decryption only allowed after auction end time
    /// id format: [auction_id][end_time]
    entry fun seal_approve(id: vector<u8>, c: &Clock) {
        let mut bcs_data = bcs::new(id);
        let end_time = bcs::peel_u64(&mut bcs_data);
        let leftovers = bcs::into_remainder_bytes(bcs_data);

        // Check whether the time has arrived
        assert!(leftovers.length() == 0, 0);
        assert!(clock::timestamp_ms(c) >= end_time, 0);
    }

    // === Query functions ===

    public fun get_auction_info<T>(auction: &Auction<T>): (String, u64, u64, u8, u64, u64, bool) {
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

    public fun get_bid_count<T>(auction: &Auction<T>): u64 {
        auction.encrypted_bids.length()
    }

    public fun get_encrypted_bids<T>(auction: &Auction<T>): vector<EncryptedBid> {
        auction.encrypted_bids
    }
}

