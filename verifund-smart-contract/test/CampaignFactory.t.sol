// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CampaignFactory} from "../src/CampaignFactory.sol";
import {Campaign} from "../src/Campaign.sol";
import {VerifundSBT} from "../src/VerifundSBT.sol";
import "../src/USDC.sol";

contract CampaignFactoryTest is Test {
    CampaignFactory public factory;
    address public tokenAddress;
    address public verifundSBTAddress;

    function setUp() public {
        // Deploy a local USDC token and VerifundSBT for testing
        USDC usdc = new USDC();
        tokenAddress = address(usdc);

        VerifundSBT sbt = new VerifundSBT("ipfs://test-base-uri");
        verifundSBTAddress = address(sbt);

        factory = new CampaignFactory(tokenAddress, verifundSBTAddress);
    }

    function test_CreateCampaignWithUSDC() public {
        factory.createCampaign("USDC Campaign", 100000, 30, "QmRealHash");

        address[] memory campaigns = factory.getDeployedCampaigns();
        assertEq(campaigns.length, 1);

        Campaign campaign = Campaign(campaigns[0]);
        assertEq(campaign.name(), "USDC Campaign");
        assertEq(campaign.targetAmount(), 100000);
        assertEq(address(campaign.token()), tokenAddress);
    }

    function test_FactoryTokenAddress() public {
        assertEq(factory.tokenAddress(), tokenAddress);
    }
}