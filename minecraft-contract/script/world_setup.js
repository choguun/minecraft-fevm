const { ethers } = require('hardhat');

async function main() {
  const deployedContract = await ethers.getContract('World'); // Replace with your contract name

  const tx = await deployedContract.setLand("0xaF8c8Fcdde073831419DE86c2d34a2eAbaBfA12E");
  const receipt = await tx.wait();

  console.log('Transaction receipt: ', receipt);

  const tx2 = await deployedContract.setToken("0x92bF84aE93E32fE0704Fc521eF7e8928F73f748D");
  const receipt2 = await tx2.wait();

  console.log('Transaction receipt2: ', receipt2);

  const tx3 = await deployedContract.setItem("0xc54554068Fa057B5b064edBa0B872B4d575610F4");
  const receipt3 = await tx3.wait();

  console.log('Transaction receipt3: ', receipt3);

  const tx4 = await deployedContract.configTokenBound("0xBA56B8c0dB4e864a5081A104ACa876C9A5A62231", "0x3df71D6d00Bd32312f097C03bb5029A02abFcE51", 314159);
  const receipt4 = await tx4.wait();

  console.log('Transaction receipt4: ', receipt4);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });