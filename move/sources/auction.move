// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// 隐私拍卖模块 - 使用 Seal 时间锁加密实现盲拍
module seal_bid::auction {
    use std::string::String;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::bcs;
    use sui::event;

    /// 错误码
    const EAuctionNotStarted: u64 = 1;
    const EAuctionEnded: u64 = 2;
    const EAuctionNotEnded: u64 = 3;
    const ENotAuctionCreator: u64 = 4;
    const EAlreadyFinalized: u64 = 5;
    const EInvalidBid: u64 = 6;
    const EInvalidStrategy: u64 = 7;

    /// 拍卖策略
    const STRATEGY_TOP_N: u8 = 0;        // 出价最高的前 N 个
    const STRATEGY_RANDOM_N: u8 = 1;      // 随机选 N 个
    const STRATEGY_CLOSEST_TO_AVG: u8 = 2; // 最接近平均值的 N 个

    /// 拍卖对象
    public struct Auction<phantom T> has key {
        id: UID,
        /// 创建者
        creator: address,
        /// 拍卖的代币类型名称
        coin_name: String,
        /// 总供应量（要拍卖的代币数量）
        total_supply: u64,
        /// 中标者数量
        winner_count: u64,
        /// 拍卖策略
        strategy: u8,
        /// 开始时间（毫秒）
        start_time: u64,
        /// 结束时间（毫秒）
        end_time: u64,
        /// 加密的出价列表（用户地址 -> 加密出价数据）
        encrypted_bids: vector<EncryptedBid>,
        /// 支付池（用于退款）
        payment_pool: Balance<SUI>,
        /// 是否已经完成
        finalized: bool,
        /// TreasuryCap 用于铸造代币
        treasury_cap: TreasuryCap<T>,
    }

    /// 加密的出价
    public struct EncryptedBid has store, drop, copy {
        bidder: address,
        /// Seal 加密的出价数据（包含出价金额）
        encrypted_data: vector<u8>,
        /// 支付的 SUI 金额（用于验证和退款）
        payment_amount: u64,
    }

    /// 出价信息（解密后）
    public struct BidInfo has store, drop, copy {
        bidder: address,
        bid_amount: u64,
        payment_amount: u64,
    }

    /// 拍卖创建事件
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

    /// 出价事件
    public struct BidPlaced has copy, drop {
        auction_id: ID,
        bidder: address,
        payment_amount: u64,
    }

    /// 拍卖完成事件
    public struct AuctionFinalized has copy, drop {
        auction_id: ID,
        winner_count: u64,
    }

    /// 创建新的拍卖
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

    /// 提交加密的出价
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

        // 存储加密的出价
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

    /// 完成拍卖并分配代币
    /// 注意：实际应用中需要通过 Seal 解密出价，这里简化处理
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

    /// 分配代币给中标者
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

    /// 退款给未中标者
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

    // === Seal 访问策略函数 ===
    
    /// Seal 访问策略：只有在拍卖结束时间后才能解密
    /// id 格式：[auction_id][end_time]
    entry fun seal_approve(id: vector<u8>, c: &Clock) {
        let mut bcs_data = bcs::new(id);
        let end_time = bcs::peel_u64(&mut bcs_data);
        let leftovers = bcs::into_remainder_bytes(bcs_data);

        // 检查时间是否已到
        assert!(leftovers.length() == 0, 0);
        assert!(clock::timestamp_ms(c) >= end_time, 0);
    }

    // === 查询函数 ===

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

