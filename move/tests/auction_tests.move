// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module seal_bid::auction_tests {
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::clock::{Self, Clock};
    use sui::sui::SUI;
    use seal_bid::auction::{Self, Auction};

    // Test token
    public struct TEST_COIN has drop {}

    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;

    // Initialize test environment
    fun setup_test(scenario: &mut Scenario): (TreasuryCap<TEST_COIN>, Clock) {
        // Create test token
        let witness = TEST_COIN {};
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9,
            b"TEST",
            b"Test Coin",
            b"Test coin for auction",
            option::none(),
            ctx(scenario)
        );
        
        transfer::public_freeze_object(metadata);
        
        // Create clock
        let clock = clock::create_for_testing(ctx(scenario));
        
        (treasury_cap, clock)
    }

    #[test]
    fun test_create_auction() {
        let mut scenario = test::begin(ADMIN);
        let (treasury_cap, clock) = setup_test(&mut scenario);
        
        {
            let current_time = clock::timestamp_ms(&clock);
            let start_time = current_time + 1000;
            let end_time = current_time + 10000;
            
            auction::create_auction<TEST_COIN>(
                treasury_cap,
                b"Test Auction",
                1000000,
                10,
                0, // TOP_N strategy
                start_time,
                end_time,
                ctx(&mut scenario)
            );
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = auction::EAuctionNotStarted)]
    fun test_bid_before_start() {
        let mut scenario = test::begin(ADMIN);
        let (treasury_cap, mut clock) = setup_test(&mut scenario);
        
        // Create auction
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time + 5000;
        let end_time = current_time + 10000;
        
        auction::create_auction<TEST_COIN>(
            treasury_cap,
            b"Test Auction",
            1000000,
            10,
            0,
            start_time,
            end_time,
            ctx(&mut scenario)
        );
        
        next_tx(&mut scenario, USER1);
        {
            let mut auction = test::take_shared<Auction<TEST_COIN>>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000000000, ctx(&mut scenario));
            
            // Attempt to bid before start; should fail
            auction::place_bid(
                &mut auction,
                vector[1, 2, 3],
                payment,
                &clock,
                ctx(&mut scenario)
            );
            
            test::return_shared(auction);
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    fun test_place_bid_success() {
        let mut scenario = test::begin(ADMIN);
        let (treasury_cap, mut clock) = setup_test(&mut scenario);
        
        // Create auction
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time;
        let end_time = current_time + 10000;
        
        auction::create_auction<TEST_COIN>(
            treasury_cap,
            b"Test Auction",
            1000000,
            10,
            0,
            start_time,
            end_time,
            ctx(&mut scenario)
        );
        
        // User bids
        next_tx(&mut scenario, USER1);
        {
            let mut auction = test::take_shared<Auction<TEST_COIN>>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000000000, ctx(&mut scenario));
            
            auction::place_bid(
                &mut auction,
                vector[1, 2, 3, 4],
                payment,
                &clock,
                ctx(&mut scenario)
            );
            
            // Verify bid count
            let bid_count = auction::get_bid_count(&auction);
            assert!(bid_count == 1, 0);
            
            test::return_shared(auction);
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = auction::EAuctionNotEnded)]
    fun test_finalize_before_end() {
        let mut scenario = test::begin(ADMIN);
        let (treasury_cap, clock) = setup_test(&mut scenario);
        
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time;
        let end_time = current_time + 10000;
        
        auction::create_auction<TEST_COIN>(
            treasury_cap,
            b"Test Auction",
            1000000,
            10,
            0,
            start_time,
            end_time,
            ctx(&mut scenario)
        );
        
        next_tx(&mut scenario, ADMIN);
        {
            let mut auction = test::take_shared<Auction<TEST_COIN>>(&scenario);
            
            // Attempt to finalize before end; should fail
            auction::finalize_auction(
                &mut auction,
                &clock,
                ctx(&mut scenario)
            );
            
            test::return_shared(auction);
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }
}

