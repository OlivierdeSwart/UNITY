const hre = require("hardhat");

async function main() {
  // Get the signer (deployer) address
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy the WrappedBNRY token
  const WrappedBNRY = await hre.ethers.getContractFactory('WBNRY');
  const wrappedBNRY = await WrappedBNRY.deploy();
  await wrappedBNRY.deployed();
  console.log(`WrappedBNRY token deployed to: ${wrappedBNRY.address}`);

  // Deploy the Staking contract with the WrappedBNRY token address
  const Staking = await hre.ethers.getContractFactory('Staking');
  const staking = await Staking.deploy(wrappedBNRY.address);
  await staking.deployed();
  console.log(`Staking contract deployed to: ${staking.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
