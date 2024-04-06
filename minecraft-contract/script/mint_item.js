const { ethers } = require('hardhat');

async function main() {
  const deployedContract = await ethers.getContract('Item'); // Replace with your contract name

  const tx = await deployedContract.mintInitItemtoLandAccount("0x704AB97823AD4C0ac70860ba51BB8189186252b7");
  const receipt = await tx.wait();

  console.log('Transaction receipt: ', receipt);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });