const hre = require("hardhat");

// Env-driven parameters:
// - OWNER_ADDRESS: campaign owner (receives withdrawals)
// - NAME: campaign name
// - TARGET_HBAR: target in HBAR (string, e.g. "100")
// - DEADLINE_SECS_FROM_NOW: seconds from now until deadline (e.g. 30 days = 2592000)
// - IPFS_HASH: content hash string
// - SBT_ADDRESS: optional VerifundSBT address; if omitted, set to 0x000...0
//
// Units: this contract uses EVM value units (1e18) for on-chain amounts.
// We parse TARGET_HBAR into 1e18 using ethers.parseUnits(TARGET_HBAR, 18).

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const OWNER_ADDRESS = process.env.OWNER_ADDRESS || deployer.address;
  const NAME = process.env.NAME || "Sample Campaign";
  const TARGET_HBAR = process.env.TARGET_HBAR || "10"; // 10 HBAR
  const DEADLINE_SECS_FROM_NOW = parseInt(process.env.DEADLINE_SECS_FROM_NOW || "2592000", 10); // 30 days
  const IPFS_HASH = process.env.IPFS_HASH || "";
  const SBT_ADDRESS = process.env.SBT_ADDRESS || hre.ethers.ZeroAddress;

  const targetAmountWei = hre.ethers.parseUnits(TARGET_HBAR, 18);
  const deadline = Math.floor(Date.now() / 1000) + DEADLINE_SECS_FROM_NOW;

  console.log("Owner:", OWNER_ADDRESS);
  console.log("Name:", NAME);
  console.log("Target (wei):", targetAmountWei.toString());
  console.log("Deadline (unix):", deadline);
  console.log("IPFS:", IPFS_HASH);
  console.log("SBT:", SBT_ADDRESS);

  const Campaign = await hre.ethers.getContractFactory("Campaign");
  const campaign = await Campaign.deploy(
    OWNER_ADDRESS,
    NAME,
    targetAmountWei,
    deadline,
    IPFS_HASH,
    hre.ethers.ZeroAddress, // token (ignored)
    SBT_ADDRESS
  );

  const receipt = await campaign.deploymentTransaction().wait();
  console.log("Campaign deployed at:", await campaign.getAddress());
  console.log("Tx hash:", receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

