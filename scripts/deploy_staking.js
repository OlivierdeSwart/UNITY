const hre = require("hardhat");

async function main() {
  const tokenAddress = process.env.TOKEN_ADDRESS; // Use environment variable for token address

  if (!tokenAddress) {
    console.error("Please set the TOKEN_ADDRESS environment variable.");
    process.exit(1);
  }

  const Staking = await hre.ethers.getContractFactory('Staking');
  let staking = await Staking.deploy(tokenAddress);
  await staking.deployed();
  console.log(`Staking contract deployed to: ${staking.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
