
# Verifyfund  🚀— Transparent Crypto Crowdfunding for Africa

[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-lightgrey?logo=githubactions)](#) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](verifund-client-main/LICENSE) [![Network: Hedera Testnet](https://img.shields.io/badge/Network-Hedera%20Testnet-2bb3ff)](https://hashscan.io/testnet)


Verifyfund is a crypto-only crowdfunding platform focused on transparency and trust for African causes. Donations are recorded on-chain and easily auditable. Today, donations flow via USDC (ERC‑20) on Hedera Testnet (EVM), with a native HBAR donation flow prepared in the included hedera-contracts package.


**Transparent Crowdfunding for Africa**

Verifyfund is the first decentralized donation platform that uses blockchain technology to ensure **100% transparency**. Every USDC donation is trackable, with no platform fees, powered by Hedera.

🌐 **Live Demo**: [https://verifyfund.mimi.money](https://verifyfund.mimi.money)

![Verifyfund Landing Page]([/docs/images/landing-page.png](https://github.com/mimimoneydev/verifyfund/blob/main/verifund-client/docs/images/landing-page.png))


*Screenshot of Verifyfund's landing page showcasing transparent crowdfunding powered by blockchain technology*

## ✨ Key Features

- **🔒 100% Transparent**: All transactions are recorded on the blockchain
- **💰 Zero Platform Fees**: Donations go directly to campaigners
- **🪙 Powered by Hedera HBAR**
- **🛡️ Smart Contract Security**: Fund security guaranteed by smart contracts
- **📊 Real-time Tracking**: Monitor fund usage in real-time
- **🎯 Guardian Analysis**: AI-powered analysis for campaign validation
- **🏆 SBT Rewards**: Soul Bound Token for trusted campaigners

## 📋 Feature Overview

| Feature                         | Status       | Notes |
|---------------------------------|--------------|-------|
| Native HBAR donations           | 90%  progress  | Payable Campaign.sol added in `hedera-contracts`; wire UI after deploy |
| Transparent spending history    | Done         | Uses Hedera Mirror Node with "Load more" pagination |
| Campaign creation               | Done         | IPFS metadata; requires Factory address when available |
| SBT verification (organizers)   | Partial      | Frontend checks `VerifundSBT.isVerified(address)` |
| WalletConnect + MetaMask        | Done         | Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` |
| Zero platform fees              | Done         | Donations go directly to campaign contract |

Key principles:
- 100% transparency (on-chain, verifiable)
- No platform fees (funds go directly to campaigns)
- Crypto-only: HBAR and USDC
- Organizer verification via Soulbound Tokens (SBT)


## 📦 Repository Structure

- verifund-client — Next.js frontend app (USDC donations + HBAR tracker)
- verifund-smart-contract — Foundry project (USDC ERC‑20, CampaignFactory/SBT tests)
- hedera-contracts — Hardhat project with HBAR-native Campaign.sol (payable donate())


## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Web3**: Wagmi, Viem, Ethers.js
- **Wallet Integration**: Wagmi + WalletConnect
- **UI Components**: Radix UI, Shadcn/ui
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form + Zod
- **Storage**: IPFS for campaign metadata

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or newer
- npm, yarn, pnpm, or bun
- Web3 wallet (MetaMask, etc.)

### Installation

1. Clone repository
```bash
git clone <repository-url>
cd verifund-client-main
```

2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Setup environment variables
```bash
cp .env.example .env.local
```

Minimum required .env.local values for local dev:
```env
NEXT_PUBLIC_RPC_URL=https://testnet.hashio.io/api
NEXT_PUBLIC_MIRROR_NODE_API_URL=https://testnet.mirrornode.hedera.com/api/v1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
# Optional until you deploy contracts on Hedera Testnet
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_VERIFUND_SBT_ADDRESS=0x...
NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=0x...
```
Note: If `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is empty you may see a 403 warning in logs; the app still runs locally.

4. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Production build (optional)
```bash
npm run build
npm run start
# open http://localhost:3000
```

## 📁 Project Structure

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API routes
│   ├── campaigns/         # Campaign pages
│   ├── create-campaign/   # Create campaign page
│   └── dashboard/         # Dashboard page
├── components/            # Reusable UI components
│   └── ui/               # Shadcn/ui components
├── features/             # Feature-based modules
│   ├── campaign/         # Campaign related features
│   ├── home/             # Homepage features
│   └── organizer/        # Organizer dashboard features
└── lib/                  # Utilities and configurations
    ├── constants.ts      # App constants
    ├── ethers.ts         # Ethers.js configuration
    ├── web3.ts           # Web3 configuration
    └── utils.ts          # Utility functions
```

## 🔧 Available Scripts

- `npm run dev` - Run the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run check-types` - Type checking with TypeScript

## 🌐 How It Works

### 1. **Create Campaign** 📝
Campaigners create campaigns with detailed information. Data is stored in IPFS for maximum transparency.

### 2. **Donate USDC** 💸
Donors use USDC (ERC‑20) to donate via approve + donate; funds go directly into the campaign smart contract.

### 3. **Full Transparency** 👁️
All transactions are recorded on the blockchain, ensuring complete transparency.

## 🔗 Smart Contract Integration

Deployed on **Hedera Testnet (EVM)** for development and testing:

This application integrates with:
- **Campaign Factory Contract**: For creating new campaigns
- **Campaign Contract**: Individual campaign management
- **VerifundSBT Contract**: Soul Bound Token for campaigners
- **USDC ERC‑20 Donations**: Approve + donate flow; spending tracker shows HBAR outflows post‑withdrawal (Mirror Node)

## 📋 Smart Contract Addresses

## 🧱 Smart Contracts (two tracks)

1) USDC (ERC‑20) + Factory + SBT (Foundry)
- Path: verifund-smart-contract
- Purpose: Local testing and ERC‑20 donation architecture
- Quick commands:
```
cd verifund-smart-contract
forge build
forge test
```

2) HBAR‑native Campaign (Hardhat)
- Path: hedera-contracts
- Purpose: Payable donate() accepting native HBAR
- Quick commands:
```
cd hedera-contracts
npm install
npm run compile
npm run deploy:testnet
```
Ensure .env is set with a funded Hedera Testnet key and RPC URL

After deploying HBAR-native contracts, wire the new address/ABI in the frontend (verifund-client-main).


### Hedera Testnet (EVM)

## 🚀 Deploying HBAR‑native contracts (Hedera Testnet)

Full guide: see hedera-contracts/README.md in this repo.

Quick steps
1) cd hedera-contracts
2) cp .env.example .env and fill:
   - PRIVATE_KEY (funded Hedera Testnet EVM key)
   - RPC_URL (optional, defaults to https://testnet.hashio.io/api)
   - OWNER_ADDRESS, NAME, TARGET_HBAR, DEADLINE_SECS_FROM_NOW, IPFS_HASH, SBT_ADDRESS (optional)
3) npm install && npm run compile
4) npm run deploy:testnet
   - Copy the deployed Campaign address and tx hash from the output

### 🔧 Update frontend after deployment
- In verifund-client/.env.local, set:
  - NEXT_PUBLIC_USDC_TOKEN_ADDRESS=<your_usdc_token_address>
  - NEXT_PUBLIC_VERIFUND_SBT_ADDRESS=<your_sbt_address_if_any>
  - NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=<your_factory_address_if/when available>
- Update ABI: copy the compiled ABI from hedera-contracts/artifacts/contracts/Campaign.sol/Campaign.json into
  verifund-client-main/src/app/contracts/Campaign.json (replace only the abi field if you prefer).

## ❓ FAQ

### Why USDC?
- Stability and wide acceptance: USDC is a well‑known stablecoin with broad wallet and tooling support.
- Simple ERC‑20 flow: Works with standard approve + donate, compatible with WalletConnect and MetaMask.
- Roadmap: We’re preparing a native HBAR donate flow; spending transparency already uses Hedera’s native HBAR for outflows.

### How are decimals/formatting handled?
- USDC uses 6 decimals on‑chain. Inputs are in whole USDC units (e.g., 12.5 = 12.5 USDC).
- The UI formats USDC amounts with up to 6 decimal places.
- Gas fees are paid in HBAR on Hedera.
- The spending tracker shows withdrawals in HBAR (converted from tinybars) with up to 8 decimal places.

- Donation flow: the frontend will approve USDC then call `donate(amount)` on the campaign.

## 🗺️ Roadmap
- Finalize native HBAR donate flow end‑to‑end once the new contract/ABI is wired in the frontend.
- Add CampaignFactory.sol (HBAR‑native) and a deploy script for multi‑campaign deployments.
- Enhance organizer verification UX (surfacing SBT status and guidance).
- Withdraw/Refund UX refinements around deadline status and permissions.
- Retire or port legacy IDRX tests/artifacts (e.g., verifund-smart-contract-main/test/IDRX.t.sol).
- Prepare Hedera mainnet deployment checklist (envs, RPC, monitoring).

- Contract addresses: TBD — deploy contracts on Hedera Testnet and update:
  - VerifundSBT: <address>
  - CampaignFactory: <address>
  - Token (if applicable): <address>

### 🌍 Network Information
- **Blockchain**: Hedera Testnet (EVM)
- **Chain ID**: 296
- **Native Token**: HBAR
- **RPC Endpoint**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Supported Wallets**: MetaMask, WalletConnect, Injected Wallets

## 🤝 Contributing

We welcome contributions from the community! Please:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

- Create an [Issue](../../issues) in this repository

---

**Built with ❤️ for a more transparent Africa**
