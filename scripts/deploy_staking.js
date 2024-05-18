const hre = require("hardhat");

async function main() {
  const NAME = 'Wrapped Binary Bit Token'
  const SYMBOL = 'WBNRY'
  const MAX_SUPPLY = '120000000'

  const Token = await hre.ethers.getContractFactory('Token')
  let token = await Token.deploy(NAME,SYMBOL,MAX_SUPPLY)
  await token.deployed()
  console.log(`Token deployed to: ${ token.address} \n`)

  const Crowdsale = await hre.ethers.getContractFactory('Staking')
  let crowdsale = await Crowdsale.deploy(token.address)
  await crowdsale.deployed()
  console.log(`Crowdsale deployed to: ${ crowdsale.address} \n`)

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
