

## 🏗️ System Architecture

The project consists of 4 main smart contracts:

### 1. **USDC Token** (`src/USDC.sol`)
- **Function**: ERC20 mock of USD Coin (USDC) used for donations in this project
- **Symbol**: USDC
- **Decimals**: 6
- **Features**:
  - Unlimited minting for testing
  - `mint10k()` function for quick minting of 10,000 USDC
  - Support for burning tokens

### 2. **Campaign** (`src/Campaign.sol`)
- **Function**: Individual contract for each crowdfunding campaign
- **Main Features**:
  - Donations using USDC tokens
  - Configurable target amount and deadline
  - Automatic refund system if the target is not achieved
  - Campaign metadata is stored on IPFS
  - Status tracking (Active, Successful, Failed, VerifiedWithdrawable)
  - USDC donation synchronization for external transfers
  - Comprehensive campaign information retrieval
  - **Verification-based withdrawal**: Verified owners can withdraw funds even if target not reached
  - Integration with VerifundSBT for owner verification status

### 3. **CampaignFactory** (`src/CampaignFactory.sol`)
- **Function**: Factory contract to create new campaigns
- **Features**:
  - Deploy new campaigns with customizable parameters
  - Track all created campaigns
  - Event logging for monitoring
  - Automatic linking of campaigns with verification contract

### 4. **VerifundSBT** (`src/VerifundSBT.sol`)
- **Function**: Soulbound Token (Non-transferable NFT) for user verification
- **Features**:
  - Non-transferable badge verification
  - Whitelist system for access control
  - Metadata stored on IPFS
  - One badge per address

## 🚀 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) >= 16
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Git

### Installation

1. **Clone repository**
```bash
git clone 
cd verifund-smart-contract
```

2. **Install dependencies**
```bash
forge install
```


## 🔧 Development Commands

### Build Contract
```bash
forge build
```

### Run Tests
```bash
forge test
```

### Run Tests with Gas Report
```bash
forge test --gas-report
```

### Format Code
```bash
forge fmt
```

### Generate Gas Snapshots
```bash
forge snapshot
```

## 🌐 Deployment

### Local Development (Anvil)

1. **Start local node**
```bash
anvil
```

2. **Deploy USDC Token**
```bash
forge script script/Deploy.s.sol:DeployUSDC --rpc-url http://localhost:8545 --private-key <your_private_key> --broadcast
```

3. **Deploy VerifundSBT**
```bash
forge script script/DeployVerifundSBT.s.sol:DeployVerifundSBT --rpc-url http://localhost:8545 --private-key <your_private_key> --broadcast
```

4. **Deploy CampaignFactory**
```bash
# Make sure USDC_TOKEN_ADDRESS and VERIFUND_SBT_ADDRESS are set in .env
forge script script/DeployCampaignFactory.s.sol:DeployCampaignFactory --rpc-url http://localhost:8545 --private-key <your_private_key> --broadcast
```
