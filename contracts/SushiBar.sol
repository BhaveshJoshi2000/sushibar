// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// SushiBar is the coolest bar in town. You come in with some Sushi, and leave with more! The longer you stay, the more Sushi you get.
//
// This contract handles swapping to and from xSushi, SushiSwap's staking token.

/**
    @title Bhavesh Joshi's Sushi bar fork solution
    @notice There can be multiple solutions for this problem but I came up with this
 */
contract SushiBar is ERC20("SushiBar", "xSUSHI") {
    using SafeMath for uint256;
    IERC20 public sushi;

    // Define the Sushi token contract
    constructor(IERC20 _sushi) public {
        sushi = _sushi;
    }

    mapping(address => uint256) private stakeTime;

    // Enter the bar. Pay some SUSHIs. Earn some shares.
    // Locks Sushi and mints xSushi
    function enter(uint256 _amount) external {
        // Gets the amount of Sushi locked in the contract
        uint256 totalSushi = sushi.balanceOf(address(this));
        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // If no xSushi exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSushi == 0) {
            _mint(msg.sender, _amount);
        }
        // Calculate and mint the amount of xSushi the Sushi is worth. The ratio will change overtime, as xSushi is burned/minted and Sushi deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSushi);
            _mint(msg.sender, what);
        }

        stakeTime[msg.sender] = block.timestamp;
        // Lock the Sushi in the contract
        sushi.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your SUSHIs.
    // Unlocks the staked + gained Sushi and burns xSushi

    /**
    @notice all of the amount of sender's balance will be withdrawn once leave is called, tax will be calculated on the same
    */
    function leave() public {
        // Gets the amount of xSushi in existence
        require(stakeTime[msg.sender] != 0, "No amount deposited");
        uint256 totalShares = totalSupply();
        // Calculates the amount of Sushi the xSushi is worth
        uint256 what = balanceOf(msg.sender).mul(sushi.balanceOf(address(this))).div(totalShares);

        if (block.timestamp - stakeTime[msg.sender] <= 8 days) {
            uint256 tax = calTax(what);
            what = what.sub(tax);
        }

        sushi.transfer(msg.sender, what);
        _burn(msg.sender, balanceOf(address(this)));
    }

    function calTax(uint256 amount) internal view returns (uint256) {
        uint256 timeStaked = block.timestamp - stakeTime[msg.sender];

        if (timeStaked < 2 days) {
            revert("Cannot Withdraw Within Two Days");
        }

        if (timeStaked > 2 days && timeStaked < 4 days) {
            return amount.div(100).mul(75);
        }
        if (timeStaked > 4 days && timeStaked < 6 days) {
            return amount.div(100).mul(50);
        }
        if (timeStaked > 6 days) {
            return amount.div(100).mul(25);
        }
    }

    function getStakeTime(address _address) public view returns (uint256) {
        return stakeTime[_address];
    }
}
