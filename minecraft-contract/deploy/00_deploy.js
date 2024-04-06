require("hardhat-deploy")
require("hardhat-deploy-ethers")

const private_key = network.config.accounts[0]
const wallet = new ethers.Wallet(private_key, ethers.provider)

module.exports = async ({ deployments }) => {
    const { deploy } = deployments;
    const owner = "0xA32B5821eaa4FaaD8B67944fCDed57C937d9B714";
 
    // deploy world
    const world = await deploy("World", {
        from: wallet.address,
        args: [owner],
        // log: true,
    });
    console.log("World deployed to: ", world.address);

    // deploy token bound account
    const account = await deploy("ERC6551Account", {
        from: wallet.address,
        // log: true,
    });
    console.log("Account deployed to: ", account.address);

    const registry = await deploy("ERC6551Registry", {
        from: wallet.address,
        // log: true,
    });
    console.log("Registry deployed to: ", registry.address);

    // deploy Land
    const land = await deploy("Land", {
        from: wallet.address,
        args: [owner, world.address, registry.address],
        // log: true,
    });
    console.log("Land deployed to: ", land.address);

    // deploy token
    const token = await deploy("Token", {
        from: wallet.address,
        args: [owner, world.address, land.address],
        // log: true,
    });
    console.log("Token deployed to: ", token.address);

    // deploy Item
    const item = await deploy("Item", {
        from: wallet.address,
        args: [owner, world.address, ""],
        // log: true,
    });
    console.log("Item deployed to: ", item.address);
}