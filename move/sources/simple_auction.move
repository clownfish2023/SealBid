// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Privacy auction module for simplified coins - supports SimpleCoin and SimpleTreasuryCap
module seal_bid::simple_auction {
    use std::string::String;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use seal_bid::simple_coin_factory::{SimpleTreasuryCap, SimpleCoin, SimpleCoinRegistry};

    /// Error codes
    const EAuctionNotStarted: u64 = 1;
    const EAuctionEnded: u64 = 2;
    const EAuctionNotEnded: u64 = 3;
    const ENotAuctionCreator: u64 = 4;
    const EAlreadyFinalized: u64 = 5;
    const EInvalidBid: u64 = 6;
    const EInvalidStrategy: u64 = 7;
    const EInsufficientPayment: u64 = 8;

    /// Auction strategies
    const STRATEGY_TOP_N: u8 = 0;        // Top N highest bids
    const STRATEGY_RANDOM_N: u8 = 1;      // Randomly select N
    const STRATEGY_CLOSEST_TO_AVG: u8 = 2; // N bids closest to the average

    /// Simplified coin auction object
    public struct SimpleAuction has key {
        id: UID,
        /// Creator
        creator: address,
        /// Token symbol
        coin_symbol: String,
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
        /// Encrypted bids list
        encrypted_bids: vector<EncryptedBid>,
        /// Payment pool (for refunds)
        payment_pool: Balance<SUI>,
        /// Whether finalized
        finalized: bool,
        /// SimpleTreasuryCap used to mint tokens
        treasury_cap: SimpleTreasuryCap,
    }

    /// Encrypted bid
    public struct EncryptedBid has store, drop, copy {
        bidder: address,
        /// Seal encrypted bid data
        encrypted_data: vector<u8>,
        /// SUI amount paid
        payment_amount: u64,
    }

    /// Auction created event
    public struct SimpleAuctionCreated has copy, drop {
        auction_id: ID,
        creator: address,
        coin_symbol: String,
        total_supply: u64,
        winner_count: u64,
        strategy: u8,
        start_time: u64,
        end_time: u64,
    }

    /// Bid placed event
    public struct SimpleBidPlaced has copy, drop {
        auction_id: ID,
        bidder: address,
        payment_amount: u64,
    }

    /// Auction finalized event
    public struct SimpleAuctionFinalized has copy, drop {
        auction_id: ID,
        winner_count: u64,
    }

    /// Create simplified coin auction
    public entry fun create_simple_auction(
        _registry: &mut SimpleCoinRegistry,
        treasury_cap: SimpleTreasuryCap,
        total_supply: u64,
        winner_count: u64,
        strategy: u8,
        start_time: u64,
        end_time: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(strategy <= STRATEGY_CLOSEST_TO_AVG, EInvalidStrategy);
        
        let current_time = clock::timestamp_ms(clock);
        // Ensure end time is in the future
        assert!(end_time > current_time, EAuctionEnded);
        // Ensure end time is after start time
        assert!(end_time > start_time, EAuctionEnded);

        let auction_id = object::new(ctx);
        let auction_id_copy = object::uid_to_inner(&auction_id);

        // Get token symbol
        let coin_symbol = seal_bid::simple_coin_factory::get_treasury_symbol(&treasury_cap);

        let auction = SimpleAuction {
            id: auction_id,
            creator: ctx.sender(),
            coin_symbol,
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

        event::emit(SimpleAuctionCreated {
            auction_id: auction_id_copy,
            creator: ctx.sender(),
            coin_symbol,
            total_supply,
            winner_count,
            strategy,
            start_time,
            end_time,
        });

        transfer::share_object(auction);
    }

    /// Place encrypted bid
    public entry fun place_simple_bid(
        auction: &mut SimpleAuction,
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
        assert!(payment_amount > 0, EInsufficientPayment);

        // Add payment to pool
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut auction.payment_pool, payment_balance);

        // Record encrypted bid
        let encrypted_bid = EncryptedBid {
            bidder: ctx.sender(),
            encrypted_data: encrypted_bid_data,
            payment_amount,
        };

        vector::push_back(&mut auction.encrypted_bids, encrypted_bid);

        event::emit(SimpleBidPlaced {
            auction_id: object::uid_to_inner(&auction.id),
            bidder: ctx.sender(),
            payment_amount,
        });
    }

    /// Helper structure for decrypted bid
    public struct DecryptedBid has drop, copy {
        bidder: address,
        amount: u64,
        payment: u64,
        index: u64,
    }

    /// Finalize auction and allocate tokens
    /// Note: This is a simplified implementation using simple decryption. Actual applications need Seal time-lock decryption
    public entry fun finalize_simple_auction(
        auction: &mut SimpleAuction,
        registry: &mut SimpleCoinRegistry,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= auction.end_time, EAuctionNotEnded);
        assert!(ctx.sender() == auction.creator, ENotAuctionCreator);
        assert!(!auction.finalized, EAlreadyFinalized);

        auction.finalized = true;

        let bid_count = vector::length(&auction.encrypted_bids);
        if (bid_count == 0) {
            event::emit(SimpleAuctionFinalized {
                auction_id: object::uid_to_inner(&auction.id),
                winner_count: 0,
            });
            return
        };

        // 1. Decrypt all bids
        let mut decrypted_bids = vector::empty<DecryptedBid>();
        let mut i = 0;
        while (i < bid_count) {
            let encrypted_bid = vector::borrow(&auction.encrypted_bids, i);
            let bid_amount = parse_bid_amount(&encrypted_bid.encrypted_data);
            
            let decrypted_bid = DecryptedBid {
                bidder: encrypted_bid.bidder,
                amount: bid_amount,
                payment: encrypted_bid.payment_amount,
                index: i,
            };
            vector::push_back(&mut decrypted_bids, decrypted_bid);
            i = i + 1;
        };

        // 2. Select winners according to strategy
        let winners = if (auction.strategy == STRATEGY_TOP_N) {
            select_top_n_winners(&decrypted_bids, auction.winner_count)
        } else if (auction.strategy == STRATEGY_RANDOM_N) {
            select_random_n_winners(&decrypted_bids, auction.winner_count, ctx)
        } else {
            select_closest_to_avg_winners(&decrypted_bids, auction.winner_count)
        };

        let actual_winner_count = vector::length(&winners);

        // 3. Allocate tokens to winners
        if (actual_winner_count > 0) {
            let amount_per_winner = auction.total_supply / actual_winner_count;
            
            let mut j = 0;
            while (j < actual_winner_count) {
                let winner = vector::borrow(&winners, j);
                
                seal_bid::simple_coin_factory::mint_simple_coin(
                    registry,
                    &mut auction.treasury_cap,
                    amount_per_winner,
                    winner.bidder,
                    ctx
                );

                j = j + 1;
            };
        };

        // 4. Refund all bidders (including winners and losers)
        let mut k = 0;
        while (k < bid_count) {
            let encrypted_bid = vector::borrow(&auction.encrypted_bids, k);
            if (encrypted_bid.payment_amount > 0) {
                let refund_balance = balance::split(&mut auction.payment_pool, encrypted_bid.payment_amount);
                let refund_coin = coin::from_balance(refund_balance, ctx);
                transfer::public_transfer(refund_coin, encrypted_bid.bidder);
            };
            k = k + 1;
        };

        event::emit(SimpleAuctionFinalized {
            auction_id: object::uid_to_inner(&auction.id),
            winner_count: actual_winner_count,
        });
    }

    /// Parse bid amount (simplified: convert bytes to number)
    fun parse_bid_amount(encrypted_data: &vector<u8>): u64 {
        let len = vector::length(encrypted_data);
        if (len == 0) return 0;
        
        let mut result = 0u64;
        let mut i = 0;
        
        while (i < len) {
            let byte = *vector::borrow(encrypted_data, i);
            // Handle ASCII digit characters '0'-'9' (48-57)
            if (byte >= 48 && byte <= 57) {
                result = result * 10 + ((byte - 48) as u64);
            };
            i = i + 1;
        };
        
        result
    }

    /// Strategy: select top N highest bids
    fun select_top_n_winners(bids: &vector<DecryptedBid>, n: u64): vector<DecryptedBid> {
        let bid_count = vector::length(bids);
        let winner_count = if (bid_count < n) { bid_count } else { n };
        
        // Create sorted copy (by bid amount descending)
        let mut sorted_bids = *bids;
        bubble_sort_desc(&mut sorted_bids);
        
        // Select top N
        let mut winners = vector::empty<DecryptedBid>();
        let mut i = 0;
        while (i < winner_count) {
            vector::push_back(&mut winners, *vector::borrow(&sorted_bids, i));
            i = i + 1;
        };
        
        winners
    }

    /// Strategy: randomly select N
    fun select_random_n_winners(bids: &vector<DecryptedBid>, n: u64, ctx: &TxContext): vector<DecryptedBid> {
        let bid_count = vector::length(bids);
        let winner_count = if (bid_count < n) { bid_count } else { n };
        
        // Simplified: use transaction digest as random seed
        let seed = ctx.digest();
        let mut selected_indices = vector::empty<u64>();
        let mut winners = vector::empty<DecryptedBid>();
        
        let mut i = 0;
        while (i < winner_count && i < bid_count) {
            // Use seed to generate pseudo-random index
            let random_byte = *vector::borrow(seed, i % vector::length(seed));
            let random_index = (random_byte as u64) % bid_count;
            
            // Avoid duplicates
            if (!vector::contains(&selected_indices, &random_index)) {
                vector::push_back(&mut selected_indices, random_index);
                vector::push_back(&mut winners, *vector::borrow(bids, random_index));
            } else {
                // If duplicate, linearly search next unselected
                let mut j = 0;
                while (j < bid_count) {
                    if (!vector::contains(&selected_indices, &j)) {
                        vector::push_back(&mut selected_indices, j);
                        vector::push_back(&mut winners, *vector::borrow(bids, j));
                        break
                    };
                    j = j + 1;
                };
            };
            
            i = i + 1;
        };
        
        winners
    }

    /// Strategy: select N closest to average
    fun select_closest_to_avg_winners(bids: &vector<DecryptedBid>, n: u64): vector<DecryptedBid> {
        let bid_count = vector::length(bids);
        let winner_count = if (bid_count < n) { bid_count } else { n };
        
        // Compute average bid
        let mut total = 0u64;
        let mut i = 0;
        while (i < bid_count) {
            total = total + vector::borrow(bids, i).amount;
            i = i + 1;
        };
        let average = total / bid_count;
        
        // Compute each bid to average and sort
        let mut bids_with_distance = *bids;
        bubble_sort_by_distance(&mut bids_with_distance, average);
        
        // Select top N closest to average
        let mut winners = vector::empty<DecryptedBid>();
        let mut j = 0;
        while (j < winner_count) {
            vector::push_back(&mut winners, *vector::borrow(&bids_with_distance, j));
            j = j + 1;
        };
        
        winners
    }

    /// Bubble sort: descending by bid amount
    fun bubble_sort_desc(bids: &mut vector<DecryptedBid>) {
        let len = vector::length(bids);
        if (len <= 1) return;
        
        let mut i = 0;
        while (i < len - 1) {
            let mut j = 0;
            while (j < len - 1 - i) {
                let bid_j = vector::borrow(bids, j);
                let bid_j_plus_1 = vector::borrow(bids, j + 1);
                
                if (bid_j.amount < bid_j_plus_1.amount) {
                    vector::swap(bids, j, j + 1);
                };
                
                j = j + 1;
            };
            i = i + 1;
        };
    }

    /// Bubble sort: ascending by distance to average
    fun bubble_sort_by_distance(bids: &mut vector<DecryptedBid>, average: u64) {
        let len = vector::length(bids);
        if (len <= 1) return;
        
        let mut i = 0;
        while (i < len - 1) {
            let mut j = 0;
            while (j < len - 1 - i) {
                let bid_j = vector::borrow(bids, j);
                let bid_j_plus_1 = vector::borrow(bids, j + 1);
                
                let dist_j = if (bid_j.amount > average) {
                    bid_j.amount - average
                } else {
                    average - bid_j.amount
                };
                
                let dist_j_plus_1 = if (bid_j_plus_1.amount > average) {
                    bid_j_plus_1.amount - average
                } else {
                    average - bid_j_plus_1.amount
                };
                
                if (dist_j > dist_j_plus_1) {
                    vector::swap(bids, j, j + 1);
                };
                
                j = j + 1;
            };
            i = i + 1;
        };
    }

    /// Cancel auction (only creator can cancel before start)
    public entry fun cancel_simple_auction(
        auction: SimpleAuction,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < auction.start_time, EAuctionNotStarted);
        assert!(ctx.sender() == auction.creator, ENotAuctionCreator);

        let SimpleAuction {
            id,
            creator,
            coin_symbol: _,
            total_supply: _,
            winner_count: _,
            strategy: _,
            start_time: _,
            end_time: _,
            encrypted_bids,
            payment_pool,
            finalized: _,
            treasury_cap,
        } = auction;

        // Refund all bids
        let mut i = 0;
        let bid_count = vector::length(&encrypted_bids);
        let mut payment_pool = payment_pool;
        while (i < bid_count) {
            let bid = vector::borrow(&encrypted_bids, i);
            if (bid.payment_amount > 0) {
                let refund_balance = balance::split(&mut payment_pool, bid.payment_amount);
                let refund_coin = coin::from_balance(refund_balance, ctx);
                transfer::public_transfer(refund_coin, bid.bidder);
            };
            i = i + 1;
        };

        // Destroy empty balance
        balance::destroy_zero(payment_pool);

        // Return TreasuryCap (use public_transfer because it has store ability)
        transfer::public_transfer(treasury_cap, creator);

        object::delete(id);
    }

    // === Query functions ===

    /// Get auction info
    public fun get_auction_info(auction: &SimpleAuction): (String, u64, u64, u8, u64, u64, bool) {
        (
            auction.coin_symbol,
            auction.total_supply,
            auction.winner_count,
            auction.strategy,
            auction.start_time,
            auction.end_time,
            auction.finalized
        )
    }

    /// Get bid count
    public fun get_bid_count(auction: &SimpleAuction): u64 {
        vector::length(&auction.encrypted_bids)
    }

    /// Check whether finalized
    public fun is_finalized(auction: &SimpleAuction): bool {
        auction.finalized
    }
}

