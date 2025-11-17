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

## 📄 License

MIT License

