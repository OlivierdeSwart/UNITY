const hre = require("hardhat");
const { ethers } = hre;

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 8);
};

async function main() {
    // Get the deployed contract instances
    const WBNRY = await hre.ethers.getContractFactory('WBNRY');
    const Staking = await hre.ethers.getContractFactory('Staking');

    // Get deployed instances (assuming addresses are known)
    const wbnry = await WBNRY.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
    const staking = await Staking.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

    // Configure accounts
    // const deployer_owner = await ethers.getSigner("0x31cC93F11435fe9aB8E6F525214D1ccd5B987396");
    const [deployer_owner, user1, user2, user3] = await ethers.getSigners(); // Ignoring the first signer as deployer_owner is explicitly set

    // Mint tokens to deployer_owner and transfer tokens to user1, user2, and user3
    await wbnry.connect(deployer_owner).mint(deployer_owner.address, tokens(10000));
    console.log(`Minted 10000 tokens to deployer_owner: ${deployer_owner.address}`);

    await wbnry.connect(deployer_owner).transfer(user1.address, tokens(1000));
    console.log(`Transferred 1000 tokens to user1: ${user1.address}`);

    await wbnry.connect(deployer_owner).transfer(user2.address, tokens(1000));
    console.log(`Transferred 1000 tokens to user2: ${user2.address}`);

    await wbnry.connect(deployer_owner).transfer(user3.address, tokens(1000));
    console.log(`Transferred 1000 tokens to user3: ${user3.address}`);

    // Perform staking for user1
    await wbnry.connect(user1).approve(staking.address, tokens(30));
    await staking.connect(user1).stake(tokens(20));
    console.log(`User1 staked 20 tokens`);

    // Fund the treasury by deployer_owner
    await wbnry.connect(deployer_owner).approve(staking.address, tokens(2000));
    await staking.connect(deployer_owner).fundTreasury(tokens(1000));
    console.log(`Deployer_owner funded the treasury with 1000 tokens`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
