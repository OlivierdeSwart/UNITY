// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "hardhat/console.sol";

contract Staking {
    address public owner;
    Token public token;
    uint256 public tokensStaked;

    struct Participant {
        address user;
        uint256 tokenAmountSatoshi;
        uint256 latestStakeTime;
    }

    event Stake(address indexed customer, uint256 amount_wbnry);

    address[] public customerAddressesArray;
    mapping(address => Participant) public customerMapping;

    constructor(Token _token) {
        owner = msg.sender;
        token = _token;
        tokensStaked = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "caller must be owner");
        _;
    }

    modifier amountGreaterThanZero(uint256 _tokenAmountSatoshi) {
    require(_tokenAmountSatoshi > 0, "Token amount must be greater than zero");
    _;
    }

    function stake(uint256 _tokenAmountSatoshi) public amountGreaterThanZero(_tokenAmountSatoshi) {
		token.approve(address(this), _tokenAmountSatoshi);

        require(token.balanceOf(msg.sender) >= _tokenAmountSatoshi, "insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= _tokenAmountSatoshi, "insufficient allowance");

        token.transferFrom(msg.sender, address(this), _tokenAmountSatoshi);

        if (customerMapping[msg.sender].user == address(0)) {
            customerAddressesArray.push(msg.sender);
        }

        customerMapping[msg.sender] = Participant({
            user: msg.sender,
            tokenAmountSatoshi: customerMapping[msg.sender].tokenAmountSatoshi + _tokenAmountSatoshi,
            latestStakeTime: block.timestamp
        });

        tokensStaked += _tokenAmountSatoshi;

        emit Stake(msg.sender, _tokenAmountSatoshi);
    }

    function withdraw(uint256 _tokenAmountSatoshi) public amountGreaterThanZero(_tokenAmountSatoshi) {
        require(customerMapping[msg.sender].tokenAmountSatoshi >= _tokenAmountSatoshi, "insufficient staked token balance");

        token.transfer(msg.sender, _tokenAmountSatoshi);

        customerMapping[msg.sender].tokenAmountSatoshi -= _tokenAmountSatoshi;
        tokensStaked -= _tokenAmountSatoshi;
    }

    function getParticipant(address _customer) public view returns (Participant memory) {
        return customerMapping[_customer];
    }

    function getCustomerAddressesArray() public view returns (address[] memory) {
        return customerAddressesArray;
    }
}
