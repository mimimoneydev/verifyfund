pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/USDC.sol";

contract DeployUSDC is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        USDC usdc = new USDC();

        console.log("=== USDC Simple Deployment ===");
        console.log("Contract Address:", address(usdc));
        console.log("Token Name:", usdc.name());
        console.log("Token Symbol:", usdc.symbol());
        console.log("Decimals:", usdc.decimals());
        console.log("Initial Supply:", usdc.totalSupply());
        console.log("Owner Balance:", usdc.balanceOf(msg.sender));
        console.log("================================");

        vm.stopBroadcast();
    }
}
