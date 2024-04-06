// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC6551Registry} from "./ERC6551Registry.sol";

contract Land is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 public price = 0.01 ether;
    uint256 public supply = 5000;
    address public world;
    address public registry;
    address public account;
    uint256 public chainId;

    constructor(address _initialOwner, address _world, address _registry) 
    ERC721("Land", "Land")
    Ownable(_initialOwner)
    {
        world = _world;
        registry = _registry;
    }

    modifier onlyWorld() {
        require(_msgSender() == world, "Only world can call this function");
        _;
    }

    function mint(string memory _tokenURI) public payable {
        require(msg.value >= price, "Insufficient amount");
        require(totalSupply() < supply, "Maximum supply reached");

        uint256 tokenId = totalSupply() + 1;
        _safeMint(_msgSender(), tokenId);
        _setTokenURI(tokenId, _tokenURI);
    }

    function saveUserData(uint256 _tokenId, string memory _data) public onlyWorld {
        _setTokenURI(_tokenId, _data);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
        
    function _increaseBalance(address _account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(_account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}