// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Seal 集成模块 - 提供时间锁加密的辅助函数
module seal_bid::seal_integration {
    use sui::bcs;
    use sui::clock::{Self, Clock};

    /// 错误码
    const ENoAccess: u64 = 77;
    const EInvalidKeyId: u64 = 78;

    /// 生成 Seal key ID
    /// 格式：[package_id][bcs::to_bytes(end_time)]
    public fun generate_key_id(end_time: u64): vector<u8> {
        bcs::to_bytes(&end_time)
    }

    /// 验证 Seal 访问策略
    /// 检查当前时间是否已超过 end_time
    public fun check_time_lock_policy(key_id: vector<u8>, clock: &Clock): bool {
        let mut bcs_data = bcs::new(key_id);
        let end_time = bcs::peel_u64(&mut bcs_data);
        let leftovers = bcs::into_remainder_bytes(bcs_data);

        // 检查格式是否正确且时间已到
        (leftovers.length() == 0) && (clock::timestamp_ms(clock) >= end_time)
    }

    /// Seal 访问策略的入口函数
    /// 这是 Seal 服务器会调用的函数
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

            // 时间未到，应该返回 false
            clock.set_for_testing(500);
            assert!(!check_time_lock_policy(key_id, &clock), 0);

            // 时间刚好，应该返回 true
            clock.set_for_testing(1000);
            assert!(check_time_lock_policy(key_id, &clock), 1);

            // 时间已过，应该返回 true
            clock.set_for_testing(2000);
            assert!(check_time_lock_policy(key_id, &clock), 2);

            clock.destroy_for_testing();
        };
        
        scenario.end();
    }
}

