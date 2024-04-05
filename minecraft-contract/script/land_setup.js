const { ethers } = require('hardhat');

async function main() {
  const deployedContract = await ethers.getContract('Land'); // Replace with your contract name

  const tx1 = await deployedContract.configTokenBound("0xBA56B8c0dB4e864a5081A104ACa876C9A5A62231", "0x3df71D6d00Bd32312f097C03bb5029A02abFcE51", 314159);
  const receipt1 = await tx1.wait();

  console.log('Transaction receipt4: ', receipt1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });