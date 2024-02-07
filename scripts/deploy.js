const hre = require("hardhat");

async function main() {
  const NAME = 'Ollie Token'
  const SYMBOL = 'OLLIE'
  const MAX_SUPPLY = '1000'
  const PRICE = ethers.utils.parseUnits('0.00025','ether')
  const ICO_START = '1706742000'
  const ICO_END = '1719698400'
  const FUNDRAISING_GOAL = '1000'

  const Token = await hre.ethers.getContractFactory('Token')
  let token = await Token.deploy(NAME,SYMBOL,MAX_SUPPLY)
  await token.deployed()
  console.log(`Token deployed to: ${ token.address} \n`)

  const Crowdsale = await hre.ethers.getContractFactory('Crowdsale')
  let crowdsale = await Crowdsale.deploy(token.address,PRICE,ethers.utils.parseUnits(MAX_SUPPLY,'ether'),ICO_START,ICO_END,FUNDRAISING_GOAL)
  await crowdsale.deployed()
  console.log(`Crowdsale deployed to: ${ crowdsale.address} \n`)

  const transaction = await token.transfer(crowdsale.address, ethers.utils.parseUnits(MAX_SUPPLY,'ether'))
  await transaction.wait()

  console.log(`Tokens transferred to Crowdsale\n`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
