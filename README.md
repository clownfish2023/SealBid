# SealBid - Privacy Token Auction Platform Based on Sui Seal

<div align="center">

🔐 Utilizing Seal time-lock encryption technology to achieve fair and transparent blind auction mechanism

</div>

## 📖 Project Introduction

SealBid is a decentralized token auction platform based on Sui blockchain and Seal time-lock encryption. Through Seal technology, all auction bids are encrypted before the auction ends, ensuring fairness and privacy in the bidding process.

### ✨ Core Features

- **🔒 Time-lock Encryption**: Utilizing Seal technology, bids are fully encrypted before the deadline
- **⚖️ Fair Bidding**: Supports multiple allocation strategies (highest price, random, closest to average)
- **🪙 One-click Token Creation**: Easily create custom tokens, set logo, name, symbol, etc.
- **🎯 Flexible Strategies**: Supports three auction allocation strategies to meet different needs
- **🌐 Decentralized**: Fully runs on Sui blockchain, no centralized server required

## 🏗️ Project Structure

```
SealBid/
├── move/                    # Move Smart Contracts
│   ├── sources/
│   │   ├── coin_factory.move       # Token Factory Module
│   │   ├── auction.move            # Auction Core Logic
│   │   └── seal_integration.move   # Seal Integration
│   └── Move.toml
├── frontend/                # Frontend Application
│   ├── src/
│   │   ├── components/     # Components
│   │   ├── pages/          # Pages
│   │   ├── utils/          # Utility Functions
│   │   └── config/         # Configuration
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Sui CLI
- Rust (for compiling Move contracts)

### 1. Deploy Smart Contracts

```bash
# Enter Move directory
cd move

# Compile contracts
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000

# Record the deployed Package ID
```

### 2. Run Frontend

```bash
# Enter frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file, fill in the Package ID

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 📚 Usage Guide

### Create Token

1. Connect Sui wallet
2. Go to "Create Token" page
3. Fill in token information:
   - Name
   - Symbol
   - Decimals
   - Description
   - Logo URL
4. Confirm transaction and create

**Note**: Actual token creation requires deploying a Move module containing OTW (One-Time-Witness) first.

### Create Auction

1. Select or create token
2. Set auction parameters:
   - Token type and TreasuryCap ID
   - Total supply
   - Number of winners
   - Allocation strategy
   - Start and end time
3. Submit transaction to create auction

### Participate in Bidding

1. Browse auction list
2. Select interested auction
3. Submit encrypted bid before deadline:
   - Bid amount (token quantity)
   - Deposit (SUI)
4. Wait for auction to end

### View Results

1. After auction ends, Seal automatically decrypts all bids
2. Allocate tokens according to set strategy
3. Non-winning bidders automatically receive deposit refund

## 🎯 Auction Strategies

### 1. Top N Bids (TOP_N)
Sort bids from high to low, select top N winners.

**Use Cases**: Price-priority auctions

### 2. Random N Selection (RANDOM_N)
Randomly select N winners from all bids.

**Use Cases**: Fair lottery, whitelist distribution

### 3. Closest to Average N (CLOSEST_TO_AVG)
Calculate average of all bids, select N bids closest to the average.

**Use Cases**: Avoid extreme prices, seek market consensus

## 🔐 Seal Time-lock Encryption

### How It Works

1. **Encryption Phase**: When users submit bids, they are encrypted using Seal and auction end time as key
2. **Waiting Phase**: Before the deadline, no one can decrypt the bids
3. **Decryption Phase**: After reaching end time, Seal automatically allows decryption
4. **Allocation Phase**: Allocate tokens according to strategy

### Access Policy

The contract defines `seal_approve` function:

```move
entry fun seal_approve(id: vector<u8>, c: &Clock) {
    let mut bcs_data = bcs::new(id);
    let end_time = bcs::peel_u64(&mut bcs_data);
    
    // Only allow decryption when current time >= end_time
    assert!(clock::timestamp_ms(c) >= end_time, 0);
}
```

## 🔧 Tech Stack

### Smart Contracts
- **Language**: Move
- **Framework**: Sui Framework
- **Encryption**: Seal Time-lock

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Blockchain**: Sui SDK + Seal SDK
- **Wallet**: @mysten/dapp-kit

## 📖 API Reference

### Move Contract Interfaces

#### coin_factory Module

```move
// Create new token
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
```

#### auction Module

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
```

## 🛠️ Development Guide

### Compile Contracts

```bash
cd move
sui move build
```

### Test Contracts

```bash
cd move
sui move test
```

### Deploy to Testnet

```bash
cd move
sui client publish --gas-budget 100000000
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Build Frontend

```bash
cd frontend
npm run build
```

## ⚠️ Notes

1. **Token Creation**: Actual token creation requires users to deploy Move modules containing OTW (One-Time-Witness)
2. **Seal SDK**: Current version uses simulated encryption, production environment needs integration with real Seal SDK
3. **Gas Fees**: All on-chain operations require payment of gas fees
4. **Time Precision**: Ensure system time is synchronized with blockchain time

## 🔗 Related Links

- [Sui Official](https://sui.io)
- [Seal Documentation](https://seal-docs.wal.app/)
- [Sui Move Documentation](https://docs.sui.io/guides/developer/first-app/write-package)
- [TLE Pattern Reference](https://github.com/MystenLabs/seal/blob/main/move/patterns/sources/tle.move)

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📧 Contact

For any questions, please contact us through Issues.

---

**⚡ Powered by Sui Seal, enabling truly fair on-chain auctions**

