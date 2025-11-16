// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Token factory module - Allows users to create custom tokens
module seal_bid::coin_factory {
    use std::string::{Self, String};
    use std::option;
    use sui::coin::{Self, TreasuryCap, CoinMetadata};
    use sui::url::{Self, Url};
    use sui::package;
    use sui::display;

    /// Token info registry
    public struct CoinRegistry has key {
        id: UID,
        /// Record all created tokens
        coins: vector<address>,
    }

    /// One-Time-Witness for the module
    public struct COIN_FACTORY has drop {}

    /// Token creation event
    public struct CoinCreated has copy, drop {
        coin_type: String,
        creator: address,
        name: String,
        symbol: String,
        decimals: u8,
    }

    /// Initialization function
    fun init(otw: COIN_FACTORY, ctx: &mut TxContext) {
        // Create and share the token registry
        let registry = CoinRegistry {
            id: object::new(ctx),
            coins: vector::empty(),
        };
        transfer::share_object(registry);

        // Create Publisher object
        let publisher = package::claim(otw, ctx);
        transfer::public_transfer(publisher, ctx.sender());
    }

    /// Entry function to create a new token
    /// This is a generic function; users need to define their own OTW type
    /// The OTW type must match the module name (for example: seal_coin::seal_coin requires SEAL_COIN)
    /// Note: The OTW object needs to be created when the module is published, and then passed in as a parameter
    /// Due to Sui constraints, the OTW cannot be obtained inside the function and must be provided by the caller
    public entry fun create_coin<T: drop>(
        registry: &mut CoinRegistry,
        witness: T,  // OTW object must be passed in as a parameter
        decimals: u8,
        symbol: vector<u8>,
        name: vector<u8>,
        description: vector<u8>,
        icon_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Create token
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            decimals,
            symbol,
            name,
            description,
            option::some(url::new_unsafe_from_bytes(icon_url)),
            ctx
        );

        // Record token information
        let coin_address = object::id_address(&metadata);
        registry.coins.push_back(coin_address);

        // Emit event
        sui::event::emit(CoinCreated {
            coin_type: string::utf8(symbol),
            creator: ctx.sender(),
            name: string::utf8(name),
            symbol: string::utf8(symbol),
            decimals,
        });

        // Transfer TreasuryCap and Metadata to the creator
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury_cap, ctx.sender());
    }

    /// Mint tokens
    public entry fun mint<T>(
        treasury_cap: &mut TreasuryCap<T>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    /// Burn tokens
    public entry fun burn<T>(
        treasury_cap: &mut TreasuryCap<T>,
        coin: coin::Coin<T>
    ) {
        coin::burn(treasury_cap, coin);
    }

    // === Query functions ===

    /// Get all tokens in registry
    public fun get_all_coins(registry: &CoinRegistry): vector<address> {
        registry.coins
    }
}

