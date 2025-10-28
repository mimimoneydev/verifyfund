// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Minimal HBAR-native Campaign contract (payable donations)
 *
 * Notes on units:
 * - This contract tracks amounts in the same units as EVM msg.value (wei-like, 1e18)
 * - Mirror Node REST API reports native transfers in tinybars (1e8). Frontend should
 *   convert accordingly when showing history vs. on-chain values.
 */

interface IERC20 { /* only to preserve ABI compatibility with token() */ }

interface IVerifundSBT {
    function isVerified(address user) external view returns (bool);
}

contract Campaign {
    // Core immutable data
    address public owner;
    string public name;
    uint256 public targetAmount; // in EVM value units (1e18-style)
    uint256 public deadline;     // unix timestamp (seconds)
    string public ipfsHash;

    // Compatibility fields (kept for ABI parity)
    IERC20 public token; // address(0) – we use native HBAR
    IVerifundSBT public verifundSBT;

    // State
    mapping(address => uint256) public donations;
    uint256 public amountRaised;
    bool public isWithdrawn;

    // Peak balance helpers (kept for ABI parity)
    uint256 public peakBalance;
    bool public peakBalanceUpdated;

    // Events (kept names for compatibility)
    event Donated(address indexed donor, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);
    event Refunded(address indexed donor, uint256 amount);

    // Deprecated/compat stub event (not emitted here, but present in old ABI)
    // event IDRXDonationSynced(uint256 amount);

    constructor(
        address _owner,
        string memory _name,
        uint256 _targetAmount,
        uint256 _deadline,
        string memory _ipfsHash,
        address /* _tokenAddress (ignored, kept for ABI compat) */,
        address _verifundSBTAddress
    ) {
        require(_owner != address(0), "owner_zero");
        require(_deadline > block.timestamp, "deadline_past");

        owner = _owner;
        name = _name;
        targetAmount = _targetAmount;
        deadline = _deadline;
        ipfsHash = _ipfsHash;
        token = IERC20(address(0));
        verifundSBT = IVerifundSBT(_verifundSBTAddress);
    }

    // Public views (subset used by frontend)
    function getCampaignInfo()
        external
        view
        returns (
            address campaignOwner,
            string memory campaignName,
            uint256 target,
            uint256 raised,
            uint256 actualBalance,
            uint256 timeRemaining,
            uint8 status
        )
    {
        campaignOwner = owner;
        campaignName = name;
        target = targetAmount;
        raised = amountRaised;
        actualBalance = address(this).balance;
        timeRemaining = block.timestamp < deadline ? (deadline - block.timestamp) : 0;
        // 0 = Active, 1 = Succeeded, 2 = Failed (after deadline)
        if (timeRemaining == 0) {
            status = (raised >= target) ? 1 : 2;
        } else {
            status = 0;
        }
    }

    function getRemainingTime() external view returns (uint256) {
        return block.timestamp < deadline ? (deadline - block.timestamp) : 0;
    }

    function getStatus() external view returns (uint8) {
        uint256 timeRemaining = block.timestamp < deadline ? (deadline - block.timestamp) : 0;
        if (timeRemaining == 0) {
            return (amountRaised >= targetAmount) ? 1 : 2;
        }
        return 0;
    }

    function getPeakBalance() external view returns (uint256) {
        return peakBalance;
    }

    function isPeakBalanceUpdated() external view returns (bool) {
        return peakBalanceUpdated;
    }

    // Core actions
    function donate(uint256 /* _amount */) external payable {
        require(block.timestamp <= deadline, "campaign_ended");
        require(msg.value > 0, "no_value");
        donations[msg.sender] += msg.value;
        amountRaised += msg.value;
        emit Donated(msg.sender, msg.value);
    }

    function updatePeakBalance() external {
        uint256 bal = address(this).balance;
        if (bal > peakBalance) {
            peakBalance = bal;
        }
        peakBalanceUpdated = true;
    }

    function withdraw() external {
        require(msg.sender == owner, "not_owner");
        require(!isWithdrawn, "already_withdrawn");
        require(block.timestamp > deadline, "not_ended");

        bool verified = _isOwnerVerified(owner);
        bool goalMet = amountRaised >= targetAmount;

        require(verified || goalMet, "not_allowed");

        uint256 bal = address(this).balance;
        isWithdrawn = true;
        (bool ok, ) = owner.call{value: bal}("");
        require(ok, "withdraw_failed");
        emit Withdrawn(owner, bal);
    }

    function refund() external {
        require(block.timestamp > deadline, "not_ended");
        // If owner verified, refunds are disabled (per product note)
        require(!_isOwnerVerified(owner), "verified_no_refund");
        require(amountRaised < targetAmount, "goal_met_no_refund");

        uint256 amt = donations[msg.sender];
        require(amt > 0, "no_donation");
        donations[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amt}("");
        require(ok, "refund_failed");
        emit Refunded(msg.sender, amt);
    }

    // Optional setter in case SBT address changes (owner only)
    function setVerifundSBT(address _sbt) external {
        require(msg.sender == owner, "not_owner");
        verifundSBT = IVerifundSBT(_sbt);
    }

    // Internal helpers
    function _isOwnerVerified(address who) internal view returns (bool) {
        if (address(verifundSBT) == address(0)) return false;
        // try/catch not available for interfaces without external calls that may revert.
        // We assume conformant SBT with isVerified(address) view returns (bool).
        try verifundSBT.isVerified(who) returns (bool v) {
            return v;
        } catch {
            return false;
        }
    }
}

