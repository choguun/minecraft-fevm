const { ethers } = require('hardhat');

/*
VITE_LAND_CONTRACT_ADDRESS = "0x57dFCd3BA1f45Aba4dEe9cC91Dcc5B55C0D5b619"
VITE_TOKEN_CONTRACT_ADDRESS = "0xdb5ED0F1de2aDA99F90944e997731a2629Cd9e98"
VITE_REGISTRY_CONTRACT_ADDRESS = "0x4912ee4b8E63B0DB7Dff99874B00078DE3F7dEBD"
VITE_ACCOUNT_CONTRACT_ADDRESS = "0xFCfb8EE98d918B29d05395AeeEa78Ec3A2873284"
VITE_ITEM_CONTRACT_ADDRESS = "0xC04ee655a7DD5c47d57DD78a40C5461878548D91"
*/
async function main() {
  const deployedContract = await ethers.getContract('World'); // Replace with your contract name
  const land = "0x57dFCd3BA1f45Aba4dEe9cC91Dcc5B55C0D5b619";
  const token = "0xdb5ED0F1de2aDA99F90944e997731a2629Cd9e98";
  const registry = "0x4912ee4b8E63B0DB7Dff99874B00078DE3F7dEBD";
  const account = "0xFCfb8EE98d918B29d05395AeeEa78Ec3A2873284";
  const item = "0xC04ee655a7DD5c47d57DD78a40C5461878548D91";
  const chainId = 314159;

  const tx = await deployedContract.setLand(land);
  const receipt = await tx.wait();

  console.log('Transaction receipt: ', receipt);

  const tx2 = await deployedContract.setToken(token);
  const receipt2 = await tx2.wait();

  console.log('Transaction receipt2: ', receipt2);

  const tx3 = await deployedContract.setItem(item);
  const receipt3 = await tx3.wait();

  console.log('Transaction receipt3: ', receipt3);

  const tx4 = await deployedContract.configTokenBound(registry, account, chainId);
  const receipt4 = await tx4.wait();

  console.log('Transaction receipt4: ', receipt4);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });