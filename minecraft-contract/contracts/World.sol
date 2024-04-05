// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Land} from "./Land.sol";
import {Token} from "./Token.sol";
import {Item} from "./Item.sol";
import {ERC6551Registry} from "./ERC6551Registry.sol";

contract World is Ownable {

    address public land; // Land
    address public token; // Token
    address public item; // Item
    address public registry; // Registry
    address public account; // Token Bound Account
    uint256 public chainId;

    // Gamfication data
    mapping(address => uint256) public lastCheckIn;

    // Modifiers
    modifier onlyUser() {
        require(Land(land).balanceOf(_msgSender()) > 0, "Only user can call this function");
        _;
    }

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    // User functions
    function saveUserData(uint256 _tokenId, string memory _data) public onlyUser {
        Land(land).saveUserData(_tokenId, _data);
    }

    function dailyCheckIn() external onlyUser {
        // Check if current block timestamp is within the same day as the last check-in
        uint256 currentDay = block.timestamp / 86400; // Divide by seconds in a day
        uint256 lastCheckInDay = lastCheckIn[_msgSender()] / 86400;

        // If timestamps are not on the same day, allow check-in and update timestamp
        if (currentDay != lastCheckInDay) {
            lastCheckIn[_msgSender()] = block.timestamp;
            Token(token).mint(_msgSender(), 100 * 10 ** 18);
        } else {
            // Revert transaction if user already checked in today
            revert("Already checked in today");
        }
    }

    function mintInitItemtoLand(uint256 _tokenId) public onlyUser {
        require(Land(land).ownerOf(_tokenId) == _msgSender(), "Only owner can call this function");

        address tokenBound = ERC6551Registry(registry).account(account, chainId, land, _tokenId, 1);
        Item(item).mintInitItemtoLandAccount(tokenBound);
    }

    // Admin functions
    function setLand(address _land) public onlyOwner {
        land = _land;
    }

    function setToken(address _token) public onlyOwner {
        token = _token;
    }

    function setItem(address _item) public onlyOwner {
        item = _item;
    }

    function configTokenBound(address _registry, address _account, uint256 _chainId) public onlyOwner {
        registry = _registry;
        account = _account;
        chainId = _chainId;
    }

    function mintTokenTo(address _recipient, uint256 _amount) public onlyOwner {
        Token(token).mint(_recipient, _amount);
    }
}