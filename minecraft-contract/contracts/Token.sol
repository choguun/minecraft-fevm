// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Land} from "./Land.sol";

contract Token is ERC20, Ownable {

    address public land;
    address public world;

    constructor(address _initialOwner, address _world, address _land) ERC20("CRAFT Token", "CRAFT") Ownable(_initialOwner) {
        land = _land;
        world = _world;
    }

    modifier onlyUser() {
        require(Land(land).balanceOf(_msgSender()) > 0, "Only user can call this function");
        _;
    }

    modifier onlyWorld() {
        require(_msgSender() == world, "Only world can call this function");
        _;
    }

    function setWorld(address _world) public onlyOwner {
        world = _world;
    }

    function mint(address to, uint256 _amount) public onlyWorld {
        _mint(to, _amount);
    }
}