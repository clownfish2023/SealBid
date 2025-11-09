// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// 代币工厂模块 - 允许用户创建自定义代币
module seal_bid::coin_factory {
    use std::string::{Self, String};
    use std::option;
    use sui::coin::{Self, TreasuryCap, CoinMetadata};
    use sui::url::{Self, Url};
    use sui::package;
    use sui::display;

    /// 代币信息注册表
    public struct CoinRegistry has key {
        id: UID,
        /// 记录所有创建的代币
        coins: vector<address>,
    }

    /// One-Time-Witness for the module
    public struct COIN_FACTORY has drop {}

    /// 代币创建事件
    public struct CoinCreated has copy, drop {
        coin_type: String,
        creator: address,
        name: String,
        symbol: String,
        decimals: u8,
    }

    /// 初始化函数
    fun init(otw: COIN_FACTORY, ctx: &mut TxContext) {
        // 创建并共享代币注册表
        let registry = CoinRegistry {
            id: object::new(ctx),
            coins: vector::empty(),
        };
        transfer::share_object(registry);

        // 创建 Publisher 对象
        let publisher = package::claim(otw, ctx);
        transfer::public_transfer(publisher, ctx.sender());
    }

    /// 创建新代币的入口函数
    /// 这是一个泛型函数，用户需要定义自己的 OTW 类型
    public entry fun create_coin<T: drop>(
        registry: &mut CoinRegistry,
        witness: T,
        decimals: u8,
        symbol: vector<u8>,
        name: vector<u8>,
        description: vector<u8>,
        icon_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        // 创建代币
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            decimals,
            symbol,
            name,
            description,
            option::some(url::new_unsafe_from_bytes(icon_url)),
            ctx
        );

        // 记录代币信息
        let coin_address = object::id_address(&metadata);
        registry.coins.push_back(coin_address);

        // 发出事件
        sui::event::emit(CoinCreated {
            coin_type: string::utf8(symbol),
            creator: ctx.sender(),
            name: string::utf8(name),
            symbol: string::utf8(symbol),
            decimals,
        });

        // 转移 TreasuryCap 和 Metadata 给创建者
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury_cap, ctx.sender());
    }

    /// 铸造代币
    public entry fun mint<T>(
        treasury_cap: &mut TreasuryCap<T>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    /// 销毁代币
    public entry fun burn<T>(
        treasury_cap: &mut TreasuryCap<T>,
        coin: coin::Coin<T>
    ) {
        coin::burn(treasury_cap, coin);
    }

    // === 查询函数 ===

    /// 获取注册表中的所有代币
    public fun get_all_coins(registry: &CoinRegistry): vector<address> {
        registry.coins
    }
}

