//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "hardhat/console.sol";

// Smart contract code
contract Crowdsale {
	// Crowdsale variables
	address public owner;
	Token public token;
	uint256 public price;
	uint256 public maxTokens;
	uint256 public tokensSold;
	uint256 public icoStart;
	uint256 public icoEnd;
	bool public icoFinalized = false;
	uint256 public buyMinTokens = 10 * (10**18);
	uint256 public buyMaxTokens = 1000 * (10**18);
	uint256 public fundraisingGoal;

	// Create struct to use in mapping
	struct Participant {
    	uint256 etherAmount;
    	uint256 tokenAmount;
	}

	// Create events
	event Buy(address buyer, uint256 amount_tokens, uint256 amount_eth);
	event FinalizeSuccess(uint256 tokensSold, uint256 value);
	event FinalizeFailure(uint256 tokensSold, uint256 value);

	// Create array & mappings
	address[] public contributionAddresses;
	mapping(address => bool) public whitelist;
	mapping(address => Participant) public contributions;

	// Constructor to initialize values
	constructor(
		Token _token,
		uint256 _price,
		uint256 _maxTokens,
		uint256 _icoStart,
		uint256 _icoEnd,
		uint256 _fundraisingGoal
	) {
		owner = msg.sender;
		token = _token;
		price = _price;
		maxTokens = _maxTokens;
		icoStart = _icoStart;
		icoEnd = _icoEnd;
		fundraisingGoal = _fundraisingGoal * (10**18);
	}

	// Create modifiers to easily add requirements to functions
	modifier onlyOwner() {
		require(msg.sender == owner, 'caller must be owner');
		_;
	}

	modifier onlyWhitelisted() {
    	require(whitelist[msg.sender], "Not whitelisted");
    	_;
	}

	modifier afterStart() {
    	require(icoStart < block.timestamp, "Too early, ICO didn't start yet");
    	_;
	}

	modifier afterEnd() {
    	require(icoEnd < block.timestamp, "Too early, ICO didn't end yet");
    	_;
	}

	// This code makes it so the smart contract can be used as a vending machine. 
	// Send (Sepolia) Eth and you'll automatically be given the Token. 
	// No function call needed. 
	// Not updated to align with latest versions of buyTokens() and finalize()
	receive() external payable {
		uint256 _amount = msg.value / price * 1e18;

		contributions[msg.sender].etherAmount += msg.value;
    	contributions[msg.sender].tokenAmount += _amount;
	}

	// Function which lets addresses buy Tokens with Eth
	// Tokens purchased and Eth spent will be registered in contributions mapping, along with the buyer address
	// Currently designed and tested to work correctly with 1 purchase order per address only
	function buyTokens(uint256 _amount) public payable afterStart {
		require(msg.value == (_amount / 1e18) * price);
		require(token.balanceOf(address(this)) >= _amount);
		require(_amount >= buyMinTokens, "Purchase amount too low");
		require(_amount <= buyMaxTokens, "Purchase amount too high");

		contributions[msg.sender].etherAmount += msg.value;
    	contributions[msg.sender].tokenAmount += _amount;

    	contributionAddresses.push(msg.sender);

		tokensSold += _amount;

		emit Buy(msg.sender, _amount, msg.value);
	}

	// A function created to do tests on price. 
	// Would maybe remove in a real world scenario because it's weird to change the price after it's set.
	function setPrice(uint256 _price) public onlyOwner {
		price = _price;
	}

	// The finalize() function can be called by anyone after the crowdsale has ended
	// It has some requirements like it can only be called after the ICO end date has passed
	// An if statement checks if the ICO will be considered a success or a failure
	// GAS costs for the person triggering the finalize() function would be huge if there are many different buyers in the mapping
	// So in a real world scenario this would be implemented differently. For a test project it's good enough
	function finalize() public afterEnd {
		require(icoFinalized == false, "ICO already finalized, can't happen twice");
		icoFinalized = true;

		uint256 value = address(this).balance;

		// Success: Give contributors their tokens
		// Loop through the contribution mapping and make sure addresses receive their purchased tokens
		if (value > fundraisingGoal) {
	        for (uint i = 0; i < contributionAddresses.length; i++) {
	            address contributor = contributionAddresses[i];
	            Participant memory participant = contributions[contributor];
	            if (participant.etherAmount > 0) {
	                require(token.transfer(contributor, participant.tokenAmount));
	                contributions[contributor].tokenAmount = 0;
	            }
	        }
		emit FinalizeSuccess(tokensSold, value);
    	} 
    	else {
	        // Failur: Refund ether to all contributors
	        // Loop through the contribution mapping and make sure addresses get their Eth reimbursed
	        for (uint i = 0; i < contributionAddresses.length; i++) {
	            address contributor = contributionAddresses[i];
	            Participant memory participant = contributions[contributor];
	            if (participant.etherAmount > 0) {
	                // Refund ether
	                (bool sent, ) = contributor.call{value: participant.etherAmount}("");
	                require(sent, "Failed to send Ether");
	                // Update mapping to reflect ether refunded
	                contributions[contributor].etherAmount = 0;
	            }
	        }
		emit FinalizeFailure(tokensSold, value);
    	}


	}

	// Whitelist functions were created for test purposes. 
	// The modifier is not used in the deployed project so anyone with an address containing Sepolia Eth can purchase
	function addToWhitelist(address _address) public onlyOwner {
    	whitelist[_address] = true;
	}

	function removeFromWhitelist(address _address) public onlyOwner {
    	whitelist[_address] = false;
	}

	// Functions created for ease of testing only. 
	// Normally I expect these variables should be declared at the deployment and not changed afterwards
	function changeIcoStart(uint256 _time) public onlyOwner {
    	icoStart = _time;
	}

	function changeIcoEnd(uint256 _time) public onlyOwner {
    	icoEnd = _time;
	}

	function changeFundraisingGoal(uint256 _amount) public onlyOwner {
    	fundraisingGoal = _amount;
	}


}
