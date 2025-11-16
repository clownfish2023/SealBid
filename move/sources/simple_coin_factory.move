// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Simplified token factory - Users can create tokens without creating an OTW module
/// Uses dynamic type system to make token creation simple
module seal_bid::simple_coin_factory {
    use std::string::{Self, String};
    use sui::coin::{Self, TreasuryCap};
    use sui::url;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};

    /// One-Time-Witness for the module
    public struct SIMPLE_COIN_FACTORY has drop {}

    /// Token registry
    /// Mapping from token symbol -> token info
    /// Number of created tokens
    public struct SimpleCoinRegistry has key {
        id: UID,
        /// Token symbol -> token info mapping
        coins: Table<String, CoinInfo>,
        /// Number of created tokens
        count: u64,
    }

    /// Token info
    public struct CoinInfo has store {
        name: String,
        symbol: String,
        decimals: u8,
        description: String,
        icon_url: String,
        creator: address,
        total_minted: u64,
        created_at: u64,
    }

    /// Simplified TreasuryCap wrapper
    /// Store minting permission for token
    public struct SimpleTreasuryCap has key, store {
        id: UID,
        symbol: String,
        total_supply: u64,
        /// Whether minting is allowed
        mintable: bool,
    }

    /// Simplified token object
    public struct SimpleCoin has key, store {
        id: UID,
        symbol: String,
        balance: u64,
    }

    /// Token creation event
    public struct CoinCreatedEvent has copy, drop {
        symbol: String,
        name: String,
        creator: address,
        decimals: u8,
        timestamp: u64,
    }

    /// Mint event
    public struct MintEvent has copy, drop {
        symbol: String,
        amount: u64,
        recipient: address,
    }

    /// Transfer event
    public struct TransferEvent has copy, drop {
        symbol: String,
        from: address,
        to: address,
        amount: u64,
    }

    /// Error codes
    const E_SYMBOL_ALREADY_EXISTS: u64 = 1;
    const E_SYMBOL_NOT_FOUND: u64 = 2;
    const E_NOT_MINTABLE: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;

    /// Initialization function
    fun init(_witness: SIMPLE_COIN_FACTORY, ctx: &mut TxContext) {
        let registry = SimpleCoinRegistry {
            id: object::new(ctx),
            coins: table::new(ctx),
            count: 0,
        };
        transfer::share_object(registry);
    }

    /// Create new token - user-friendly version, no OTW required
    public entry fun create_simple_coin(
        registry: &mut SimpleCoinRegistry,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        description: vector<u8>,
        icon_url: vector<u8>,
        initial_supply: u64,
        mintable: bool,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let symbol_str = string::utf8(symbol);
        
        // Check if symbol already exists
        assert!(!table::contains(&registry.coins, symbol_str), E_SYMBOL_ALREADY_EXISTS);

        // Create token info
        let coin_info = CoinInfo {
            name: string::utf8(name),
            symbol: symbol_str,
            decimals,
            description: string::utf8(description),
            icon_url: string::utf8(icon_url),
            creator: ctx.sender(),
            total_minted: initial_supply,
            created_at: sui::clock::timestamp_ms(clock),
        };

        // Add to registry
        table::add(&mut registry.coins, symbol_str, coin_info);
        registry.count = registry.count + 1;

        // Create TreasuryCap
        let treasury = SimpleTreasuryCap {
            id: object::new(ctx),
            symbol: symbol_str,
            total_supply: initial_supply,
            mintable,
        };

        // If initial supply provided, create initial tokens
        if (initial_supply > 0) {
            let coin = SimpleCoin {
                id: object::new(ctx),
                symbol: symbol_str,
                balance: initial_supply,
            };
            transfer::transfer(coin, ctx.sender());

            // Emit mint event
            sui::event::emit(MintEvent {
                symbol: symbol_str,
                amount: initial_supply,
                recipient: ctx.sender(),
            });
        };

        // Transfer TreasuryCap to creator
        transfer::transfer(treasury, ctx.sender());

        // Emit creation event
        sui::event::emit(CoinCreatedEvent {
            symbol: symbol_str,
            name: string::utf8(name),
            creator: ctx.sender(),
            decimals,
            timestamp: sui::clock::timestamp_ms(clock),
        });
    }

    /// Mint tokens
    public entry fun mint_simple_coin(
        registry: &mut SimpleCoinRegistry,
        treasury: &mut SimpleTreasuryCap,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(treasury.mintable, E_NOT_MINTABLE);
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(table::contains(&registry.coins, treasury.symbol), E_SYMBOL_NOT_FOUND);

        // Update total supply
        treasury.total_supply = treasury.total_supply + amount;

        // Update total minted in registry
        let coin_info = table::borrow_mut(&mut registry.coins, treasury.symbol);
        coin_info.total_minted = coin_info.total_minted + amount;

        // Create tokens
        let coin = SimpleCoin {
            id: object::new(ctx),
            symbol: treasury.symbol,
            balance: amount,
        };

        transfer::transfer(coin, recipient);

        // Emit event
        sui::event::emit(MintEvent {
            symbol: treasury.symbol,
            amount,
            recipient,
        });
    }

    /// Transfer tokens
    public entry fun transfer_simple_coin(
        coin: SimpleCoin,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        
        sui::event::emit(TransferEvent {
            symbol: coin.symbol,
            from: sender,
            to: recipient,
            amount: coin.balance,
        });

        transfer::transfer(coin, recipient);
    }

    /// Merge tokens
    public entry fun merge_coins(
        coin1: &mut SimpleCoin,
        coin2: SimpleCoin,
    ) {
        let SimpleCoin { id, symbol: _, balance } = coin2;
        object::delete(id);
        coin1.balance = coin1.balance + balance;
    }

    /// Split tokens
    public entry fun split_coin(
        coin: &mut SimpleCoin,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(coin.balance >= amount, E_INSUFFICIENT_BALANCE);
        assert!(amount > 0, E_INVALID_AMOUNT);

        coin.balance = coin.balance - amount;

        let new_coin = SimpleCoin {
            id: object::new(ctx),
            symbol: coin.symbol,
            balance: amount,
        };

        transfer::transfer(new_coin, recipient);
    }

    /// Destroy empty coins
    public entry fun destroy_zero_coin(coin: SimpleCoin) {
        let SimpleCoin { id, symbol: _, balance } = coin;
        assert!(balance == 0, E_INVALID_AMOUNT);
        object::delete(id);
    }

    // === Query functions ===

    /// Get token info
    public fun get_coin_info(registry: &SimpleCoinRegistry, symbol: String): &CoinInfo {
        table::borrow(&registry.coins, symbol)
    }

    /// Get token balance
    public fun balance(coin: &SimpleCoin): u64 {
        coin.balance
    }

    /// Get token symbol
    public fun symbol(coin: &SimpleCoin): String {
        coin.symbol
    }

    /// Get total supply
    public fun total_supply(treasury: &SimpleTreasuryCap): u64 {
        treasury.total_supply
    }

    /// Check mintable status
    public fun is_mintable(treasury: &SimpleTreasuryCap): bool {
        treasury.mintable
    }

    /// Get number of registered tokens
    public fun coin_count(registry: &SimpleCoinRegistry): u64 {
        registry.count
    }

    /// Check if token exists
    public fun coin_exists(registry: &SimpleCoinRegistry, symbol: String): bool {
        table::contains(&registry.coins, symbol)
    }

    /// Get TreasuryCap's token symbol
    public fun get_treasury_symbol(treasury: &SimpleTreasuryCap): String {
        treasury.symbol
    }
}

