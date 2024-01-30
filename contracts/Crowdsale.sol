//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "hardhat/console.sol";

contract Crowdsale {
	address public owner;
	Token public token;
	uint256 public price;
	uint256 public maxTokens;
	uint256 public tokensSold;
	uint256 public ico_start = block.timestamp - 3600;
	uint256 public buyMinTokens = 10 * (10**18);
	uint256 public buyMaxTokens = 1000 * (10**18);

	struct Participant {
    	uint256 etherAmount;
    	uint256 tokenAmount;
	}

	event Buy(uint256 amount, address buyer);
	event Finalize(uint256 tokensSold, uint256 value);

	mapping(address => bool) public whitelist;
	mapping(address => Participant) public contributions;

	constructor(
		Token _token,
		uint256 _price,
		uint256 _maxTokens
	) {
		owner = msg.sender;
		token = _token;
		price = _price;
		maxTokens = _maxTokens;
	}

	modifier onlyOwner() {
		require(msg.sender == owner, 'caller must be owner');
		_;
	}

	modifier onlyWhitelisted() {
    	require(whitelist[msg.sender], "Not whitelisted");
    	_;
	}

	modifier afterStart() {
    	require(ico_start < block.timestamp, "Too early, ICO didn't start yet");
    	_;
	}

	receive() external payable {
		uint256 _amount = msg.value / price * 1e18;
		// buyTokens(amount * 1e18);

		contributions[msg.sender].etherAmount += msg.value;
    	contributions[msg.sender].tokenAmount += _amount;
	}

	function buyTokens(uint256 _amount) public payable onlyWhitelisted afterStart {
		require(msg.value == (_amount / 1e18) * price);
		require(token.balanceOf(address(this)) >= _amount);
		require(_amount >= buyMinTokens, "Purchase amount too low");
		require(_amount <= buyMaxTokens, "Purchase amount too high");
		// require(token.transfer(msg.sender, _amount));

		contributions[msg.sender].etherAmount += msg.value;
    	contributions[msg.sender].tokenAmount += _amount;

		tokensSold += _amount;

		emit Buy(_amount, msg.sender);
	}

	function setPrice(uint256 _price) public onlyOwner {
		price = _price;
	}

	function finalize() public onlyOwner {
		require(token.transfer(owner, token.balanceOf(address(this))));

		// Send Ether to crowdsale creator
		uint256 value = address(this).balance;
		(bool sent, ) = owner.call{value: value }("");
		require(sent);

		emit Finalize(tokensSold, value);
	}

	function addToWhitelist(address _address) public onlyOwner {
    	whitelist[_address] = true;
	}

	function removeFromWhitelist(address _address) public onlyOwner {
    	whitelist[_address] = false;
	}

	function changeIcoStart(uint256 _time) public onlyOwner {
    	ico_start = _time;
	}


}
