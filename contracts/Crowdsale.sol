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
	uint256 public ico_end = block.timestamp + 3600;
	bool public ico_finalized = false;
	uint256 public buyMinTokens = 10 * (10**18);
	uint256 public buyMaxTokens = 1000 * (10**18);	
	uint256 public contributionAddressesLength = 0;

	struct Participant {
    	uint256 etherAmount;
    	uint256 tokenAmount;
	}

	event Buy(address buyer, uint256 amount_tokens, uint256 amount_eth);
	// event Buy(uint256 amount, address buyer);
	event Finalize(uint256 tokensSold, uint256 value);

	mapping(address => bool) public whitelist;
	address[] public contributionAddresses;
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

	modifier afterEnd() {
    	require(ico_end < block.timestamp, "Too early, ICO didn't end yet");
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

    	contributionAddressesLength ++;
    	contributionAddresses.push(msg.sender);

		tokensSold += _amount;

		emit Buy(msg.sender, _amount, msg.value);
		// emit Buy(_amount, msg.sender);
	}

	function setPrice(uint256 _price) public onlyOwner {
		price = _price;
	}

	function setPrice2(uint256 _price) public onlyOwner {
		price = _price;
	}

	function finalize() public afterEnd {
		require(ico_finalized == false, "ICO already finalized, can't happen twice");
		ico_finalized = true;

		uint256 value = address(this).balance;


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

	function changeIcoEnd(uint256 _time) public onlyOwner {
    	ico_end = _time;
	}


}
