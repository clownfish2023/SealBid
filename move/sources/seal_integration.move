// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Seal integration module - Provides helper functions for time-lock encryption
module seal_bid::seal_integration {
    use sui::bcs;
    use sui::clock::{Self, Clock};

    /// Error codes
    const ENoAccess: u64 = 77;
    const EInvalidKeyId: u64 = 78;

    /// Generate Seal key ID
    /// Format: [package_id][bcs::to_bytes(end_time)]
    public fun generate_key_id(end_time: u64): vector<u8> {
        bcs::to_bytes(&end_time)
    }

    /// Validate Seal access policy
    /// Check whether current time has exceeded end_time
    public fun check_time_lock_policy(key_id: vector<u8>, clock: &Clock): bool {
        let mut bcs_data = bcs::new(key_id);
        let end_time = bcs::peel_u64(&mut bcs_data);
        let leftovers = bcs::into_remainder_bytes(bcs_data);

        // Check if the format is correct and the time has reached
        (leftovers.length() == 0) && (clock::timestamp_ms(clock) >= end_time)
    }

    /// Entry function for Seal access policy
    /// This function will be called by the Seal server
    entry fun seal_approve(id: vector<u8>, clock: &Clock) {
        assert!(check_time_lock_policy(id, clock), ENoAccess);
    }

    #[test]
    fun test_time_lock() {
        use sui::test_scenario;
        
        let user = @0xA;
        let mut scenario = test_scenario::begin(user);
        
        {
            let mut clock = clock::create_for_testing(scenario.ctx());
            let end_time = 1000u64;
            let key_id = generate_key_id(end_time);

            // Time not yet reached; should return false
            clock.set_for_testing(500);
            assert!(!check_time_lock_policy(key_id, &clock), 0);

            // Time just reached; should return true
            clock.set_for_testing(1000);
            assert!(check_time_lock_policy(key_id, &clock), 1);

            // Time has passed; should return true
            clock.set_for_testing(2000);
            assert!(check_time_lock_policy(key_id, &clock), 2);

            clock.destroy_for_testing();
        };
        
        scenario.end();
    }
}

