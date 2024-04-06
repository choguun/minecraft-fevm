const { ethers } = require('hardhat');

/*
VITE_WORLD_CONTRACT_ADDRESS = "0x5fA31702dB94b37779CCc71CE09F92498550358f"
VITE_LAND_CONTRACT_ADDRESS = "0x0974dB5953D7e232f3fc5A9eaee0F17FccF190Dd"
VITE_TOKEN_CONTRACT_ADDRESS = "0xFB31Af131C30Afdf4D313a2C9d5A4aC9B060eb3d"
VITE_REGISTRY_CONTRACT_ADDRESS = "0xf50B4590F95a70FDC4Be76aeC31f5Fa377942842"
VITE_ACCOUNT_CONTRACT_ADDRESS = "0x13d265865d8592C58F849C58d60B9F3924AE2fd3"
VITE_ITEM_CONTRACT_ADDRESS = "0xee7A29d14Ebfab856B8a53274B1A8F524b0C1b9E"
*/

/*
    address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
*/
async function main() {
  const deployedContract = await ethers.getContract('ERC6551Registry'); // Replace with your contract name
  const chainId = 314159;
  const data = await deployedContract.account("0x13d265865d8592C58F849C58d60B9F3924AE2fd3", chainId, "0x0974dB5953D7e232f3fc5A9eaee0F17FccF190Dd", 3, 1);
  console.log(data);
  // const receipt1 = await tx1.wait();

  //console.log('Transaction receipt4: ', receipt1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });