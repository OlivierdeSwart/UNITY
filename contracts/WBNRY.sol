// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WBNRY is ERC20, ReentrancyGuard, Pausable, Ownable {
    uint256 public constant MAX_SUPPLY = 120000000 * 10**8; // 120 million tokens with 8 decimals
    uint8 private _decimals;

    constructor() ERC20("Wrapped BNRY", "WBNRY") {
        _decimals = 8;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner whenNotPaused nonReentrant {
        require(totalSupply() + amount <= MAX_SUPPLY, "WrappedBNRY: Exceeds max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) external whenNotPaused nonReentrant {
        _burn(_msgSender(), amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
