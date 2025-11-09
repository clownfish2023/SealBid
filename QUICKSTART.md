# 🚀 Quick Start Guide

Launch SealBid project in 5 minutes!

## 📋 Prerequisites Check

Run the following commands to confirm environment:

```bash
# Check Node.js (requires >= 18)
node --version

# Check Sui CLI
sui --version

# If Sui is not installed, run:
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

## ⚡ 30 Second Launch (Frontend Demo Only)

If you just want to quickly view the frontend interface:

```bash
# 1. Enter frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Visit http://localhost:5173
```

**Note**: This method only allows viewing UI, cannot perform actual transactions.

## 🔧 Complete Launch (Includes Contracts)

### Step 1: Configure Sui Wallet

```bash
# Switch to testnet
sui client switch --env testnet

# View current address
sui client active-address

# Get test coins (if balance is insufficient)
# Visit Discord: https://discord.gg/sui
# Send your address in #testnet-faucet channel
```

### Step 2: Compile and Deploy Contracts

```bash
# Enter contracts directory
cd move

# Compile contracts
sui move build

# If compilation succeeds, deploy to testnet
sui client publish --gas-budget 100000000

# ⚠️ Important: Record the Package ID from output
# Example: Created Objects: PackageID: 0xabcd1234...
```

### Step 3: Configure Frontend

```bash
# Return to project root directory
cd ..

# Enter frontend directory
cd frontend

# Install dependencies
npm install

# Create environment variable file
cp .env.example .env

# Edit .env file
# Windows: notepad .env
# Mac/Linux: nano .env
# 
# Change VITE_PACKAGE_ID to your Package ID
```

Your `.env` should look like:

```env
VITE_NETWORK=testnet
VITE_PACKAGE_ID=0xabcd1234...  # ← Your Package ID
VITE_SEAL_PACKAGE_ID=0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682
```

### Step 4: Start Frontend

```bash
# Development mode
npm run dev

# Browser access
# http://localhost:5173
```

## 🎯 Testing Process

### 1. Connect Wallet

Click the "Connect Wallet" button in the top right corner and select your wallet.

### 2. Create Auction (Simplified Process)

Since creating tokens requires additional steps, let's test auction functionality directly:

```bash
# Create a test token in command line first (optional)
# SUI tokens can be used for testing here
```

### 3. Browse Auction List

- Click "Auction List"
- View sample auctions (if any)

## 🐛 Common Issues

### Issue 1: `sui: command not found`

**Solution**:
```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# Or download pre-compiled binary
# https://docs.sui.io/guides/developer/getting-started/sui-install
```

### Issue 2: `insufficient gas`

**Solution**:
```bash
# Check balance
sui client gas

# Get test coins
# 1. Join Sui Discord: https://discord.gg/sui
# 2. Send in #testnet-faucet channel: !faucet <your address>
```

### Issue 3: `Module not found: @mysten/sui`

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: Frontend Cannot Connect to Contract

**Checklist**:
1. ✅ Package ID in .env file is correct
2. ✅ Network set to testnet
3. ✅ Wallet connected
4. ✅ Page refreshed

### Issue 5: Move Contract Compilation Failed

**Solution**:
```bash
cd move

# Clean and recompile
sui move clean
sui move build

# Check dependency versions in Move.toml
```

## 📝 Quick Command Reference

### Contract Related
```bash
# Compile
sui move build

# Test
sui move test

# Deploy
sui client publish --gas-budget 100000000

# View object
sui client object <OBJECT_ID>

# View transaction
sui client transaction-show <DIGEST>
```

### Frontend Related
```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build production version
npm run build

# Preview production version
npm run preview

# Code linting
npm run lint
```

### Sui Wallet Related
```bash
# View address
sui client active-address

# View balance
sui client gas

# Switch network
sui client switch --env testnet
sui client switch --env mainnet

# View all addresses
sui client addresses
```

## 🎓 Next Steps

After completing quick start, recommended:

1. 📖 Read [README.md](README.md) to understand project details
2. 🏗️ Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand system design
3. 🚀 Read [DEPLOYMENT.md](DEPLOYMENT.md) to learn complete deployment
4. 💻 Review code implementation, start custom development

## 📞 Get Help

- 📖 [Project Documentation](./README.md)
- 🔗 [Sui Documentation](https://docs.sui.io)
- 💬 [Discord Community](https://discord.gg/sui)

## ✅ Successful Launch Checklist

- [ ] Sui CLI installation completed
- [ ] Node.js environment normal
- [ ] Contract compilation successful
- [ ] Contract deployment successful
- [ ] Package ID recorded
- [ ] Frontend dependencies installed
- [ ] .env file configured
- [ ] Frontend service started
- [ ] Wallet connected
- [ ] Test transaction successful

---

**🎉 Congratulations! You have successfully launched SealBid!**

Start exploring privacy auctions based on Seal!

