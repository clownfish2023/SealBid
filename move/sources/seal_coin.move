// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// Example: User-defined token module
/// This module demonstrates how to create an OTW (One-Time-Witness) to create a custom token
module seal_coin::seal_coin {
    use sui::coin;
    use sui::transfer;
    use sui::sui::SUI;

    /// One-Time-Witness (OTW)
    public struct SEAL_COIN has drop {}

    /// Initialization function
    /// When the module is first published, Sui will automatically call this function
    /// The passed witness parameter is the OTW
    fun init(witness: SEAL_COIN, ctx: &mut TxContext) {
        // OTW can only be used once; you can perform some initialization here
        // For token creation, usually nothing needs to be done here
        // The OTW will be used in the create_coin function
    }
}

