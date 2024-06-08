const hre = require("hardhat");
const { ethers } = hre;

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 18);
};

async function main() {
    // Get the deployed contract instance
    const Unity = await hre.ethers.getContractFactory('Unity');
    const unity = await Unity.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

    // Get signers
    const [deployer_owner, user1, user2, user3, user4] = await ethers.getSigners();

    // Seed the Unity contract with 1000 ether
    await deployer_owner.sendTransaction({
        to: unity.address,
        value: tokens(1000)
    });
    console.log(`Seeded the Unity contract with 1000 ETH`);

    // Array of users to loop through
    const users = [deployer_owner, user1, user2, user3, user4];

    // Call startNewLoan for each user
    for (let i = 0; i < users.length; i++) {
        await unity.connect(users[i]).startNewLoan();
        console.log(`Started new loan for user: ${users[i].address}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
