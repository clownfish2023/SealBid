# SealBid Frontend Application

A modern web application based on React + TypeScript for interacting with SealBid smart contracts.

## 🛠️ Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Blockchain**: 
  - @mysten/sui (Sui SDK)
  - @mysten/dapp-kit (wallet connection)
  - @mysten/seal-sdk (Seal encryption)
- **UI Components**: Radix UI
- **Notifications**: React Hot Toast

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   └── Layout.tsx     # Layout component
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── CreateCoinPage.tsx
│   │   ├── CreateAuctionPage.tsx
│   │   ├── AuctionListPage.tsx
│   │   └── AuctionDetailPage.tsx
│   ├── utils/             # Utility functions
│   │   ├── seal.ts       # Seal encryption related
│   │   └── format.ts     # Formatting tools
│   ├── config/            # Configuration files
│   │   └── constants.ts  # Constants definition
│   ├── App.tsx           # Application root component
│   ├── main.tsx          # Application entry
│   └── index.css         # Global styles
├── public/               # Static resources
├── index.html           # HTML template
├── package.json
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
VITE_NETWORK=testnet
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_SEAL_PACKAGE_ID=0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682
```

### Development Mode

```bash
npm run dev
```

Visit `http://localhost:5173`

### Build Production Version

```bash
npm run build
```

### Preview Production Version

```bash
npm run preview
```

## 📄 Page Descriptions

### 1. Home Page (HomePage)

- Display platform introduction
- Core features description
- Quick navigation links

### 2. Create Token (CreateCoinPage)

- Token basic information form
  - Name
  - Symbol
  - Decimals
  - Description
  - Logo URL
- Real-time preview
- Create transaction

### 3. Create Auction (CreateAuctionPage)

- Auction parameter settings
  - Token type
  - Total supply
  - Number of winners
  - Distribution strategy
  - Time range
- Form validation
- Transaction submission

### 4. Auction List (AuctionListPage)

- Display all auctions
- Filter functionality
  - All
  - Active
  - Ended
- Auction cards
  - Status labels
  - Basic information
  - Time display

### 5. Auction Details (AuctionDetailPage)

- Detailed information display
- Bid form
  - Bid amount
  - Deposit
- Seal encryption prompt
- Management functions (creator)
  - Finalize auction
  - Distribute tokens

## 🎨 UI Components

### Buttons

```tsx
// Primary button
<button className="btn btn-primary">Confirm</button>

// Secondary button
<button className="btn btn-secondary">Cancel</button>
```

### Input Fields

```tsx
<input className="input" type="text" placeholder="Enter..." />
```

### Cards

```tsx
<div className="card">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

## 🔌 Integration Guide

### Connect Wallet

```tsx
import { ConnectButton } from '@mysten/dapp-kit'

<ConnectButton />
```

### Sign and Execute Transactions

```tsx
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

const { mutate: signAndExecute } = useSignAndExecuteTransaction()

const tx = new Transaction()
// ... build transaction

signAndExecute(
  { transaction: tx },
  {
    onSuccess: (result) => {
      console.log('Success:', result.digest)
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  }
)
```

### Using Seal Encryption

```tsx
import { encryptWithSeal } from '@/utils/seal'

const encrypted = await encryptWithSeal(
  bidAmount,
  keyId,
  endTime
)
```

## 🔧 Utility Functions

### Format Address

```tsx
import { formatAddress } from '@/utils/format'

formatAddress('0x1234567890abcdef') // 0x1234...cdef
```

### Format Number

```tsx
import { formatNumber } from '@/utils/format'

formatNumber(1000000) // 1,000,000
```

### Format Token Amount

```tsx
import { formatTokenAmount } from '@/utils/format'

formatTokenAmount('1000000000', 9) // 1
```

### SUI Unit Conversion

```tsx
import { suiToMist, mistToSui } from '@/utils/format'

suiToMist(1) // 1000000000n
mistToSui(1000000000n) // "1"
```

## 🎯 Configuration Guide

### constants.ts

```typescript
// Contract addresses
export const PACKAGE_ID = '0x...'
export const SEAL_PACKAGE_ID = '0x...'

// Seal servers
export const SEAL_SERVERS = ['0x...', '0x...']

// Auction strategies
export const AUCTION_STRATEGIES = {
  TOP_N: 0,
  RANDOM_N: 1,
  CLOSEST_TO_AVG: 2,
}
```

## 🐛 Debugging

### View Transactions

```typescript
console.log('Transaction digest:', result.digest)
// View in Sui Explorer
// https://suiexplorer.com/txblock/<digest>?network=testnet
```

### View Objects

```typescript
const obj = await suiClient.getObject({
  id: objectId,
  options: { showContent: true }
})
console.log('Object:', obj)
```

## 📦 Build Optimization

### Code Splitting

Vite automatically performs code splitting with route-based lazy loading.

### Resource Optimization

```bash
# Analyze build artifacts
npm run build
# Check dist/ directory
```

### Environment Variables

Use `.env.production` for production environment:

```env
VITE_NETWORK=mainnet
VITE_PACKAGE_ID=0x...
```

## 🔐 Security Recommendations

1. **Never** hardcode private keys in frontend code
2. **Validate** all user inputs
3. **Check** reasonableness of transaction parameters
4. **Use** HTTPS for deployment
5. **Regularly update** dependency packages

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)

## 🤝 Contributing

Pull requests are welcome to improve the frontend application!

## 📄 License

MIT License

