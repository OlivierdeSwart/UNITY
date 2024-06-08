const hre = require("hardhat");

async function main() {
  // Get the signer (deployer) address
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy the UNITY contract
  const UNITY = await hre.ethers.getContractFactory('UNITY');
  const unity = await UNITY.deploy();
  await unity.deployed();
  console.log(`UNITY contract deployed to: ${unity.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
