const { ethers } = require('hardhat');

async function main() {
  const deployedContract = await ethers.getContract('World'); // Replace with your contract name

  const tx = await deployedContract.mintTokenTo("0x49cB38619e735E5E3793AA1f5122756D40e201dE", 1000);
  const receipt = await tx.wait();

  console.log('Transaction receipt: ', receipt);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });