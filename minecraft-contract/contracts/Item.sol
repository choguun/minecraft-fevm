// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Item is ERC1155, Ownable {
    uint256 public constant GRASS = 1;
    uint256 public constant DIRT = 2;
    uint256 public constant STONE = 3;
    uint256 public constant COALORE = 4;
    uint256 public constant TREE = 5;
    uint256 public constant LEAVES = 6;

    address public world;

    constructor(address _initialOwner, address _world, string memory _itemURI) 
    ERC1155(_itemURI)
    Ownable(_initialOwner)
    {
        world = _world;
    }

    modifier onlyWorld() {
        require(_msgSender() == world, "Only world can call this function");
        _;
    }

    function mintInitItemtoLandAccount(address _to) external onlyWorld {
        _mint(_to, GRASS, 100, "");
        _mint(_to, DIRT, 100, "");
        _mint(_to, STONE, 100, "");
        _mint(_to, COALORE, 100, "");
        _mint(_to, TREE, 100, "");
        _mint(_to, LEAVES, 100, "");
    }
}