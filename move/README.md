# SealBid Move Contracts

This is the smart contract part of the SealBid project, written in Sui Move language.

## 📂 Module Description

### 1. coin_factory.move

Token factory module, allowing users to create custom tokens.

**Main Features**:
- `create_coin`: Create new tokens (requires OTW)
- `mint`: Mint tokens
- `burn`: Burn tokens

**Usage Example**:

```move
// User needs to define their own OTW first
module my_package::my_coin {
    use std::option;
    
    public struct MY_COIN has drop {}
    
    fun init(witness: MY_COIN, ctx: &mut TxContext) {
        // Here can call coin_factory::create_coin
    }
}
```

### 2. auction.move

Auction core logic module, implementing privacy auction functionality.

**Main Features**:
- `create_auction`: Create new auction
- `place_bid`: Submit encrypted bid
- `finalize_auction`: Finalize auction
- `distribute_tokens`: Distribute tokens to winners
- `refund`: Refund unsuccessful bidders

**Auction Strategies**:
- `STRATEGY_TOP_N (0)`: Top N highest bids
- `STRATEGY_RANDOM_N (1)`: Randomly select N
- `STRATEGY_CLOSEST_TO_AVG (2)`: N closest to average

**Events**:
- `AuctionCreated`: Auction creation event
- `BidPlaced`: Bid submission event
- `AuctionFinalized`: Auction completion event

### 3. seal_integration.move

Seal time-lock encryption integration module.

**Main Features**:
- `generate_key_id`: Generate Seal key ID
- `check_time_lock_policy`: Verify time-lock policy
- `seal_approve`: Seal access policy entry function

**Seal Access Policy**:

```move
entry fun seal_approve(id: vector<u8>, clock: &Clock) {
    let mut bcs_data = bcs::new(id);
    let end_time = bcs::peel_u64(&mut bcs_data);
    let leftovers = bcs::into_remainder_bytes(bcs_data);

    // Only allow decryption when current time >= end_time
    assert!(leftovers.length() == 0, ENoAccess);
    assert!(clock::timestamp_ms(clock) >= end_time, ENoAccess);
}
```

## 🔧 Compilation and Testing

### Compilation

```bash
sui move build
```

### Testing

```bash
sui move test
```

### Test Specific Module

```bash
sui move test --filter seal_integration
```

## 🚀 Deployment

```bash
# Deploy to testnet
sui client publish --gas-budget 100000000

# Deploy to mainnet
sui client switch --env mainnet
sui client publish --gas-budget 100000000
```

## 📖 API Reference

### coin_factory Module

```move
// Create token (requires OTW)
public entry fun create_coin<T: drop>(
    registry: &mut CoinRegistry,
    witness: T,
    decimals: u8,
    symbol: vector<u8>,
    name: vector<u8>,
    description: vector<u8>,
    icon_url: vector<u8>,
    ctx: &mut TxContext
)

// Mint tokens
public entry fun mint<T>(
    treasury_cap: &mut TreasuryCap<T>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext
)

// Burn tokens
public entry fun burn<T>(
    treasury_cap: &mut TreasuryCap<T>,
    coin: coin::Coin<T>
)
```

### auction Module

```move
// Create auction
public entry fun create_auction<T>(
    treasury_cap: TreasuryCap<T>,
    coin_name: vector<u8>,
    total_supply: u64,
    winner_count: u64,
    strategy: u8,
    start_time: u64,
    end_time: u64,
    ctx: &mut TxContext
)

// Submit bid
public entry fun place_bid<T>(
    auction: &mut Auction<T>,
    encrypted_bid_data: vector<u8>,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)

// Finalize auction
public entry fun finalize_auction<T>(
    auction: &mut Auction<T>,
    clock: &Clock,
    ctx: &mut TxContext
)

// Distribute tokens
public entry fun distribute_tokens<T>(
    auction: &mut Auction<T>,
    winner: address,
    amount: u64,
    ctx: &mut TxContext
)

// Refund
public entry fun refund<T>(
    auction: &mut Auction<T>,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext
)
```

### seal_integration Module

```move
// Generate Seal key ID
public fun generate_key_id(end_time: u64): vector<u8>

// Verify time-lock policy
public fun check_time_lock_policy(key_id: vector<u8>, clock: &Clock): bool

// Seal access policy
entry fun seal_approve(id: vector<u8>, clock: &Clock)
```

## 🔒 Security Considerations

1. **Time Verification**: Ensure start time < end time
2. **Permission Check**: Only creator can finalize auction and distribute tokens
3. **Amount Validation**: Check validity of payment amounts and bids
4. **State Management**: Prevent duplicate operations (e.g., duplicate finalization)

## 📝 Error Codes

```move
// auction module
const EAuctionNotStarted: u64 = 1;      // Auction not started
const EAuctionEnded: u64 = 2;           // Auction ended
const EAuctionNotEnded: u64 = 3;        // Auction not ended
const ENotAuctionCreator: u64 = 4;      // Not auction creator
const EAlreadyFinalized: u64 = 5;       // Already finalized
const EInvalidBid: u64 = 6;             // Invalid bid
const EInvalidStrategy: u64 = 7;        // Invalid strategy

// seal_integration module
const ENoAccess: u64 = 77;              // No access permission
const EInvalidKeyId: u64 = 78;          // Invalid key ID
```

## 🧪 Test Cases

```bash
# Run all tests
sui move test

# Test output example
# Running Move unit tests
# [ PASS    ] 0x0::seal_integration::test_time_lock
# Test result: OK. Total tests: 1; passed: 1; failed: 0
```

## 📚 Dependencies

- Sui Framework: `framework/testnet` branch
- Sui Standard Library

## 🔗 Related Links

- [Sui Move Documentation](https://docs.sui.io/guides/developer/first-app/write-package)
- [Seal Documentation](https://seal-docs.wal.app/)
- [TLE Pattern](https://github.com/MystenLabs/seal/blob/main/move/patterns/sources/tle.move)

