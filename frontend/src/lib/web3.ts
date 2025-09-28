import { ethers } from "ethers";
import { getWalletClient, getAccount } from "@wagmi/core";
import { config } from "@/app/providers";
import { walletClientToSigner } from "@/lib/ethers";
import CampaignFactoryABI from "@/app/contracts/CampaignFactory.json";
import CampaignABI from "@/app/contracts/Campaign.json";
import VerifundSBTABI from "@/app/contracts/VerifundSBT.json";
import { WalletTransaction } from "@/features/campaign/api/get-recent-donations";

export class Web3Service {
  private readonly rpcProvider: ethers.JsonRpcProvider;

  constructor() {
    this.rpcProvider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  }

  private async getSigner(): Promise<ethers.Signer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walletClient = await getWalletClient(config as any);
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }
    return walletClientToSigner(walletClient);
  }

  private async getConnectedAddress(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = getAccount(config as any);
    if (!account.address) {
      throw new Error("Wallet not connected");
    }
    return account.address;
  }

  private async formatUSDC(amount: bigint): Promise<string> {
    const tokenContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!,
      ["function decimals() external view returns (uint8)"],
      this.rpcProvider,
    );
    const decimals = await tokenContract.decimals();
    return ethers.formatUnits(amount, decimals);
  }

  private async parseUSDC(amount: string): Promise<bigint> {
    const tokenContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!,
      ["function decimals() external view returns (uint8)"],
      this.rpcProvider,
    );
    const decimals = await tokenContract.decimals();
    return ethers.parseUnits(amount, decimals);
  }

  async createCampaign(
    name: string,
    targetAmount: string,
    durationInSeconds: number,
    ipfsHash: string,
  ): Promise<string> {
    const signer = await this.getSigner();
    const factoryAddress = process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS!;
    const factory = new ethers.Contract(factoryAddress, CampaignFactoryABI.abi, signer);

    const targetAmountInUnits = await this.parseUSDC(targetAmount);

    const tx = await factory.createCampaign(name, targetAmountInUnits, durationInSeconds, ipfsHash);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  async getAllCampaigns(): Promise<string[]> {
    const factoryAddress = process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS!;
    const factory = new ethers.Contract(factoryAddress, CampaignFactoryABI.abi, this.rpcProvider);

    return await factory.getDeployedCampaigns();
  }

  async getCampaignInfo(campaignAddress: string) {
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, this.rpcProvider);
    const [info] = await Promise.all([campaign.getCampaignInfo()]);

    const isOwnerVerified = await this.checkVerificationStatus(info[0]);

    const timeRemaining = Number(info[4]);
    const raised = await this.formatUSDC(info[3]);
    const target = await this.formatUSDC(info[2]);

    let correctedStatus = Number(info[5]);

    if (timeRemaining === 0) {
      if (parseFloat(raised) >= parseFloat(target)) {
        correctedStatus = 1;
      } else {
        correctedStatus = 2;
      }
    }

    return {
      owner: info[0],
      name: info[1],
      target,
      raised,
      timeRemaining,
      status: correctedStatus,
      isOwnerVerified,
    };
  }

  async getCampaignDetails(campaignAddress: string) {
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, this.rpcProvider);

    const [info, ipfsHash, isWithdrawn, peakBalance, isPeakBalanceUpdated] = await Promise.all([
      campaign.getCampaignInfo(),
      campaign.ipfsHash(),
      campaign.isWithdrawn(),
      campaign.getPeakBalance(),
      campaign.isPeakBalanceUpdated(),
    ]);

    const isOwnerVerified = await this.checkVerificationStatus(info[0]);

    const timeRemaining = Number(info[5]);
    const raised = await this.formatUSDC(info[3]);
    const target = await this.formatUSDC(info[2]);
    const actualBalance = await this.formatUSDC(info[4]);
    const peakBalanceFormatted = await this.formatUSDC(peakBalance);

    let correctedStatus = Number(info[6]);

    if (timeRemaining === 0) {
      if (parseFloat(raised) >= parseFloat(target)) {
        correctedStatus = 1;
      } else {
        correctedStatus = 2;
      }
    }

    return {
      address: campaignAddress,
      owner: info[0],
      name: info[1],
      target,
      raised,
      actualBalance,
      peakBalance: peakBalanceFormatted,
      isPeakBalanceUpdated,
      timeRemaining,
      status: correctedStatus,
      ipfsHash,
      isOwnerVerified,
      isWithdrawn,
    };
  }

  async donateToCampaign(campaignAddress: string, amount: string): Promise<string> {
    // USDC (ERC-20) approve + donate flow
    const signer = await this.getSigner();
    const owner = await this.getConnectedAddress();

    const amountInUnits = await this.parseUSDC(amount);

    // Token contract (USDC)
    const tokenAddress = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!;
    const token = new ethers.Contract(
      tokenAddress,
      [
        "function decimals() view returns (uint8)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
      ],
      signer,
    );

    // Ensure allowance
    const currentAllowance: bigint = await token.allowance(owner, campaignAddress);
    if (currentAllowance < amountInUnits) {
      const approveTx = await token.approve(campaignAddress, amountInUnits);
      await approveTx.wait();
    }

    // Call donate() on campaign
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, signer);
    const donateTx = await campaign.donate(amountInUnits);
    const receipt = await donateTx.wait();
    return receipt.hash;
  }

  async updatePeakBalance(campaignAddress: string): Promise<string> {
    const signer = await this.getSigner();
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, signer);
    const tx = await campaign.updatePeakBalance();
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async withdrawFromCampaign(campaignAddress: string): Promise<string> {
    const signer = await this.getSigner();
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, signer);
    const tx = await campaign.withdraw();
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async refundFromCampaign(campaignAddress: string): Promise<string> {
    const signer = await this.getSigner();
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, signer);
    const tx = await campaign.refund();
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getUserDonation(campaignAddress: string, userAddress: string): Promise<string> {
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, this.rpcProvider);
    const donation = await campaign.donations(userAddress);
    return await this.formatUSDC(donation);
  }

  async getDirectTransfers(campaignAddress: string, userAddress: string): Promise<string> {
    try {
      const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!;
      const tokenContract = new ethers.Contract(
        usdcTokenAddress,
        ["event Transfer(address indexed from, address indexed to, uint256 value)"],
        this.rpcProvider,
      );

      const filter = tokenContract.filters.Transfer(userAddress, campaignAddress);

      const currentBlock = await this.rpcProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      const events = await tokenContract.queryFilter(filter, fromBlock, currentBlock);

      let totalDirectTransfers = ethers.getBigInt(0);
      for (const event of events) {
        if ("args" in event && event.args) {
          totalDirectTransfers += event.args.value;
        }
      }

      return await this.formatUSDC(totalDirectTransfers);
    } catch (error) {
      console.error("Error getting direct transfers:", error);
      return "0";
    }
  }

  async getTotalUserDonation(
    campaignAddress: string,
    userAddress: string,
  ): Promise<{
    fromDonateFunction: string;
    fromDirectTransfer: string;
    total: string;
  }> {
    try {
      const [donateAmount, directTransfer] = await Promise.all([
        this.getUserDonation(campaignAddress, userAddress),
        this.getDirectTransfers(campaignAddress, userAddress),
      ]);

      const total = (parseFloat(donateAmount) + parseFloat(directTransfer)).toFixed(6);

      return {
        fromDonateFunction: donateAmount,
        fromDirectTransfer: directTransfer,
        total: total,
      };
    } catch (error) {
      console.error("Error getting total user donation:", error);
      return {
        fromDonateFunction: "0",
        fromDirectTransfer: "0",
        total: "0",
      };
    }
  }

  async getPeakBalanceInfo(campaignAddress: string): Promise<{
    peakBalance: string;
    isPeakBalanceUpdated: boolean;
  }> {
    try {
      const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, this.rpcProvider);
      const [peakBalance, isPeakBalanceUpdated] = await Promise.all([
        campaign.getPeakBalance(),
        campaign.isPeakBalanceUpdated(),
      ]);

      return {
        peakBalance: await this.formatUSDC(peakBalance),
        isPeakBalanceUpdated,
      };
    } catch (error) {
      console.error("Error getting peak balance info:", error);
      return {
        peakBalance: "0",
        isPeakBalanceUpdated: false,
      };
    }
  }

  async checkTokenBalance(walletAddress: string): Promise<string> {
    const tokenContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!,
      ["function balanceOf(address owner) external view returns (uint256)"],
      this.rpcProvider,
    );

    const balance = await tokenContract.balanceOf(walletAddress);
    return await this.formatUSDC(balance);
  }

  async checkGasBalance(walletAddress: string): Promise<string> {
    const balance = await this.rpcProvider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  }

  async checkVerificationStatus(userAddress: string): Promise<boolean> {
    try {
      const sbtContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VERIFUND_SBT_ADDRESS!,
        VerifundSBTABI.abi,
        this.rpcProvider,
      );

      const isVerified = await sbtContract.isVerified(userAddress);
      return isVerified;
    } catch (error) {
      console.error("Error checking verification status:", error);
      return false;
    }
  }

  async getBadgeInfo(userAddress: string): Promise<{
    hasWhitelistPermission: boolean;
    isCurrentlyVerified: boolean;
    tokenId: string;
    metadataURI: string;
  }> {
    try {
      const sbtContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VERIFUND_SBT_ADDRESS!,
        VerifundSBTABI.abi,
        this.rpcProvider,
      );

      const badgeInfo = await sbtContract.getBadgeInfo(userAddress);

      return {
        hasWhitelistPermission: badgeInfo[0],
        isCurrentlyVerified: badgeInfo[1],
        tokenId: badgeInfo[2].toString(),
        metadataURI: badgeInfo[3],
      };
    } catch (error) {
      console.error("Error getting badge info:", error);
      return {
        hasWhitelistPermission: false,
        isCurrentlyVerified: false,
        tokenId: "0",
        metadataURI: "",
      };
    }
  }

  isWalletConnected(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = getAccount(config as any);
    return account.isConnected;
  }

  getCurrentAddress(): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = getAccount(config as any);
    return account.address;
  }

  async syncIDRXDonations(campaignAddress: string): Promise<string> {
    try {
      const signer = await this.getSigner();
      const campaignContract = new ethers.Contract(campaignAddress, CampaignABI.abi, signer);

      const tx = await campaignContract.syncIDRXDonations();
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error("Error syncing USDC donations:", error);
      throw error;
    }
  }

  async getWalletTransactions(campaignAddress: string): Promise<WalletTransaction[]> {
    try {
      const loadDonateEvents = async (): Promise<WalletTransaction[]> => {
        const campaignContract = new ethers.Contract(
          campaignAddress,
          CampaignABI.abi,
          this.rpcProvider,
        );
        const donationFilter = campaignContract.filters.Donated();
        const events = await campaignContract.queryFilter(donationFilter);

        if (events.length === 0) return [];

        const token = new ethers.Contract(
          process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!,
          ["function decimals() view returns(uint8)"],
          this.rpcProvider,
        );
        const decimals = await token.decimals();

        return Promise.all(
          events.map(async (event) => {
            const block = await this.rpcProvider.getBlock(event.blockNumber);
            return {
              type: "wallet" as const,
              donor: (event as ethers.EventLog).args[0],
              amount: ethers.formatUnits((event as ethers.EventLog).args[1], decimals),
              timestamp: block!.timestamp,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber,
              method: "donate" as const,
            };
          }),
        );
      };

      const loadDirectTransfers = async (): Promise<WalletTransaction[]> => {
        const tokenContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!,
          [
            "event Transfer(address indexed from, address indexed to, uint256 value)",
            "function decimals() view returns(uint8)",
          ],
          this.rpcProvider,
        );

        const transferFilter = tokenContract.filters.Transfer(null, campaignAddress);
        const transferEvents = await tokenContract.queryFilter(transferFilter);

        if (transferEvents.length === 0) return [];

        const decimals = await tokenContract.decimals();

        const campaignContract = new ethers.Contract(
          campaignAddress,
          CampaignABI.abi,
          this.rpcProvider,
        );
        const donateEvents = await campaignContract.queryFilter(campaignContract.filters.Donated());
        const donateTxHashes = new Set(donateEvents.map((event) => event.transactionHash));

        const directTransfers = await Promise.all(
          transferEvents
            .filter((event) => !donateTxHashes.has(event.transactionHash)) // Exclude transactions that are part of a donate() call
            .map(async (event) => {
              const block = await this.rpcProvider.getBlock(event.blockNumber);
              return {
                type: "wallet" as const,
                donor: (event as ethers.EventLog).args[0],
                amount: ethers.formatUnits((event as ethers.EventLog).args[2], decimals),
                timestamp: block!.timestamp,
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
                method: "transfer" as const,
              };
            }),
        );
        return directTransfers;
      };

      const [donateEvents, transferEvents] = await Promise.all([
        loadDonateEvents(),
        loadDirectTransfers(),
      ]);

      return [...donateEvents, ...transferEvents];
    } catch (error) {
      console.error("Error loading wallet transactions:", error);
      return [];
    }
  }

  async getWithdrawalTimestamp(campaignAddress: string): Promise<number | null> {
    const campaign = new ethers.Contract(campaignAddress, CampaignABI.abi, this.rpcProvider);

    const filter = campaign.filters.Withdrawn();

    const events = await campaign.queryFilter(filter, 0, "latest");

    if (events.length === 0) {
      return null;
    }

    const latestEvent = events[events.length - 1];
    const block = await this.rpcProvider.getBlock(latestEvent.blockNumber);
    return block ? block.timestamp : null;
  }

  async getSpendingHistoryPage(
    ownerAddress: string,
    withdrawalTimestamp: number,
    next?: string,
  ): Promise<{ items: { to: string; value: number; timestamp: string; hash: string }[]; next?: string }> {
    const MIRROR_NODE_BASE =
      process.env.NEXT_PUBLIC_MIRROR_NODE_API_URL || "https://testnet.mirrornode.hedera.com/api/v1";

    const url = next
      ? (next.startsWith("http") ? next : `${MIRROR_NODE_BASE}${next}`)
      : `${MIRROR_NODE_BASE}/accounts/${ownerAddress}/transactions?order=desc&limit=50`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mirror Node request failed: ${res.status} ${res.statusText}`);
    const json = await res.json();

    type Transfer = { account: string; amount: number };
    type Tx = { consensus_timestamp?: string; transaction_id?: string; transfers?: Transfer[] };
    const txs: Tx[] = Array.isArray(json.transactions) ? (json.transactions as Tx[]) : [];

    const items = txs
      .map((tx) => {
        const tsSec = Math.floor(parseFloat(tx.consensus_timestamp ?? "0"));
        if (isNaN(tsSec) || tsSec <= withdrawalTimestamp) return null;
        const transfers = Array.isArray(tx.transfers) ? tx.transfers : [];
        const out = transfers.find((t) => t.account === ownerAddress && t.amount < 0);
        if (!out) return null;
        const to = transfers.find((t) => t.account !== ownerAddress && t.amount > 0)?.account;
        if (!to) return null;
        return {
          to,
          value: Math.abs(out.amount) / 1e8,
          timestamp: new Date(tsSec * 1000).toISOString(),
          hash: tx.transaction_id ?? "",
        };
      })
      .filter((v): v is { to: string; value: number; timestamp: string; hash: string } => v !== null);

    return { items, next: json?.links?.next };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getSpendingHistory(ownerAddress: string, withdrawalTimestamp: number): Promise<any[]> {
    // Hedera Mirror Node: native HBAR transfers from owner's account after withdrawalTimestamp
    const MIRROR_NODE_BASE =
      process.env.NEXT_PUBLIC_MIRROR_NODE_API_URL || "https://testnet.mirrornode.hedera.com/api/v1";

    try {
      const url = `${MIRROR_NODE_BASE}/accounts/${ownerAddress}/transactions?order=desc&limit=200`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Mirror Node request failed: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      type Transfer = { account: string; amount: number };
      type Tx = {
        consensus_timestamp?: string;
        transaction_id?: string;
        transfers?: Transfer[];
      };
      const txs: Tx[] = Array.isArray(json.transactions) ? (json.transactions as Tx[]) : [];

      // Build spending items for outgoing HBAR transfers
      type SpendingItem = { to: string; value: number; timestamp: string; hash: string };
      const items = txs
        .map((tx): SpendingItem | null => {
          const tsSec = Math.floor(parseFloat(tx.consensus_timestamp ?? "0"));
          if (isNaN(tsSec) || tsSec <= withdrawalTimestamp) return null;
          const transfers = Array.isArray(tx.transfers) ? tx.transfers : [];
          const out = transfers.find((t) => t.account === ownerAddress && t.amount < 0);
          if (!out) return null;
          const to = transfers.find((t) => t.account !== ownerAddress && t.amount > 0)?.account;
          if (!to) return null;
          // amount is in tinybars; convert to HBAR (1 HBAR = 100,000,000 tinybars)
          const amountHBAR = Math.abs(out.amount) / 1e8;
          return {
            to,
            value: amountHBAR,
            timestamp: new Date(tsSec * 1000).toISOString(),
            hash: tx.transaction_id ?? "",
          };
        })
        .filter((v): v is SpendingItem => v !== null);

      return items;
    } catch (error) {
      console.error("Failed to fetch HBAR spending history via Mirror Node:", error);
      return [];
    }
  }
}

export const web3Service = new Web3Service();
