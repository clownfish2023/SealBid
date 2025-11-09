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

### 使用 Seal 加密

```tsx
import { encryptWithSeal } from '@/utils/seal'

const encrypted = await encryptWithSeal(
  bidAmount,
  keyId,
  endTime
)
```

## 🔧 工具函数

### 格式化地址

```tsx
import { formatAddress } from '@/utils/format'

formatAddress('0x1234567890abcdef') // 0x1234...cdef
```

### 格式化数字

```tsx
import { formatNumber } from '@/utils/format'

formatNumber(1000000) // 1,000,000
```

### 格式化代币数量

```tsx
import { formatTokenAmount } from '@/utils/format'

formatTokenAmount('1000000000', 9) // 1
```

### SUI 单位转换

```tsx
import { suiToMist, mistToSui } from '@/utils/format'

suiToMist(1) // 1000000000n
mistToSui(1000000000n) // "1"
```

## 🎯 配置说明

### constants.ts

```typescript
// 合约地址
export const PACKAGE_ID = '0x...'
export const SEAL_PACKAGE_ID = '0x...'

// Seal 服务器
export const SEAL_SERVERS = ['0x...', '0x...']

// 拍卖策略
export const AUCTION_STRATEGIES = {
  TOP_N: 0,
  RANDOM_N: 1,
  CLOSEST_TO_AVG: 2,
}
```

## 🐛 调试

### 查看交易

```typescript
console.log('Transaction digest:', result.digest)
// 在 Sui Explorer 中查看
// https://suiexplorer.com/txblock/<digest>?network=testnet
```

### 查看对象

```typescript
const obj = await suiClient.getObject({
  id: objectId,
  options: { showContent: true }
})
console.log('Object:', obj)
```

## 📦 构建优化

### 代码分割

Vite 自动进行代码分割，按路由懒加载。

### 资源优化

```bash
# 分析构建产物
npm run build
# 查看 dist/ 目录
```

### 环境变量

生产环境使用 `.env.production`:

```env
VITE_NETWORK=mainnet
VITE_PACKAGE_ID=0x...
```

## 🔐 安全建议

1. **永远不要**在前端代码中硬编码私钥
2. **验证**所有用户输入
3. **检查**交易参数的合理性
4. **使用** HTTPS 部署
5. **定期更新**依赖包

## 📚 学习资源

- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org)
- [Vite 文档](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)

## 🤝 贡献

欢迎提交 PR 改进前端应用！

## 📄 许可证

MIT License

