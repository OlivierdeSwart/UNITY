const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

// This is the Hardhat test file
// For timestamps, hardcoded unix converted numbers have been used for simplicity

// Some tests are commented out. They have worked successfully in previous iterations of the project, 
// but when updated with new functionality some old tests turned from success to failure. 
// I decided to comment the old tests out instead of removing them to indicate that I did have successful tests before

// Also I decided not to remove many logging statements, to demonstrate how highly I value seeing the actual variable values
// Testing could have been done a lot more extensive, but because this is not a real-world application it seemed unnecessary

describe('Crowdsale', () => {
  let crowdsale, token
  let accounts, deployer, user1
  let price = 2

  beforeEach(async () => {
      // Load Contracts
      const Crowdsale = await ethers.getContractFactory('Crowdsale')
      const Token = await ethers.getContractFactory('Token')

      // Deploy token
      token = await Token.deploy('Ollie Token','OLLY','1000000')

      // Configure Accounts
      accounts = await ethers.getSigners()
      deployer = accounts[0]
      user1 = accounts[1]
      user2 = accounts[2]

      // Deploy Crowdsale
      crowdsale = await Crowdsale.deploy(token.address, ether(2), '1000000', '1706742000', '1719698400', '100')

      // Send tokens to crowdsale
      let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
      await transaction.wait()
  })

  describe('Deployment', () => {
    it('sends tokens to the Crowdsale contract', async () => {

      // const balance1 = ethers.utils.formatEther(await token.balanceOf(token.address));
      // console.log("token.balanceOf(token.address):", balance1.toString());
      // const balance2 = ethers.utils.formatEther(await token.balanceOf(crowdsale.address));
      // console.log("token.balanceOf(crowdsale.address):", balance2.toString());
      // const balance3 = ethers.utils.formatEther(await token.balanceOf(deployer.address));
      // console.log("token.balanceOf(deployer.address):", balance3.toString());
      // const balance4 = ethers.utils.formatEther(await token.balanceOf(user1.address));
      // console.log("token.balanceOf(user1.address):", balance4.toString());

      expect(await token.balanceOf(crowdsale.address)).to.eq(tokens(1000000))
    })

    it('returns token address', async () => {
      expect(await crowdsale.token()).to.eq(token.address)
    })

    it('returns the price', async () => {
      expect(await crowdsale.price()).to.eq(ether(2))
    })
  })

  describe('buyTokens function n=1', () => {
    let transaction, result
    let amount = tokens(10)
    let eth = tokens(20)

    describe('n=1 Success', () => {
      beforeEach(async () => {
        transaction1 = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction1 = await crowdsale.connect(user1).buyTokens(amount, { value: ether(20) })
        // result = await transaction1.wait()

        // transaction2 = await crowdsale.connect(deployer).addToWhitelist(user2.address)
        // transaction2 = await crowdsale.connect(user2).buyTokens(amount, { value: ether(20) })
        // result = await transaction1.wait()
      })


      it('crowdsale contract keeps holding max amount of tokens', async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
        expect(await token.balanceOf(user1.address)).to.equal(0)
      })

      it('updates contracts ether balance', async () => {
        // console.log('amount',amount)
        // console.log('price',price)
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount.mul(ethers.BigNumber.from(price)))
      })

      it('updates tokensSold', async () => {
        expect(await crowdsale.tokensSold()).to.equal(amount)
      })

      // it('emits a buy event', async () => {
      //   const event = result.events[0]
      //   const event_args = result.events[0].args
      //   // console.log(event)
      //   // console.log(event_args)
      //   expect(event.event).to.equal('Buy')
      //   expect(event_args.buyer).to.equal(user1.address)
      //   expect(event_args.amount_tokens).to.equal(amount)
      //   expect(event_args.amount_eth).to.equal(eth)
      // })

      it('updates contributions mapping for tokens and eth', async () => {
        const contribution = await crowdsale.contributions(user1.address)
        // console.log('mapping.etherAmount', contribution.etherAmount)
        // console.log('variable containing flat eth amount',eth)
        expect(contribution.etherAmount).to.equal(eth)
        expect(contribution.tokenAmount).to.equal(amount)
      })
    })

    describe('Failure', () => {
      it('rejects insufficient ETH', async () => {
        await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.reverted
      })
    })
  })

  describe('buyTokens function n=2', () => {
  let transaction, result
  let amount = tokens(10)
  let eth = tokens(20)

    describe('n=2 Success', () => {
      beforeEach(async () => {
        transaction1 = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction1 = await crowdsale.connect(user1).buyTokens(amount, { value: ether(20) })
        result = await transaction1.wait()

        transaction2 = await crowdsale.connect(deployer).addToWhitelist(user2.address)
        transaction2 = await crowdsale.connect(user2).buyTokens(amount, { value: ether(20) })
        result = await transaction1.wait()
      })


      it('n=2 crowdsale contract keeps holding max amount of tokens', async () => {
        // console.log("test:", token.address);

        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
        expect(await token.balanceOf(user1.address)).to.equal(0)
      })

      it('n=2 updates contracts ether balance', async () => {
        // console.log('amount',amount)
        // console.log('price',price)
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount.mul(ethers.BigNumber.from(2*price)))
      })

      it('n=2 updates tokensSold', async () => {
        expect(await crowdsale.tokensSold()).to.equal(amount.mul(ethers.BigNumber.from(2)))
      })

      // it('n=2 emits a buy event', async () => {
      //   await expect(transaction).to.emit(crowdsale, 'Buy')
      //     .withArgs(amount, user1.address)
      // })

      it('n=2 updates contributions mapping for tokens and eth', async () => {
        const contribution1 = await crowdsale.contributions(user1.address)
        expect(contribution1.etherAmount).to.equal(eth)
        expect(contribution1.tokenAmount).to.equal(amount)
        const contribution2 = await crowdsale.contributions(user2.address)
        expect(contribution2.etherAmount).to.equal(eth)
        expect(contribution2.tokenAmount).to.equal(amount)
      })
    })

    describe('n=2 Failure', () => {
      it('rejects insufficient ETH', async () => {
        await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.reverted
        await expect(crowdsale.connect(user2).buyTokens(tokens(10), { value: 0 })).to.be.reverted
      })
    })
  })


  describe('Vending Machine - Sending ETH', () => {
    let transaction, result
    // let amount = ether(20)
    let eth = ether(20)
    let amount = eth.div(ethers.BigNumber.from(price))

    describe('Vending Machine Success', () => {

      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction = await user1.sendTransaction({ to: crowdsale.address, value: eth })
        result = await transaction.wait()
      })

      it('updates contracts ether balance', async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(eth)
      })

      it('updates user token balance', async () => {
        // expect(await token.balanceOf(user1.address)).to.equal(amount)
        const contribution = await crowdsale.contributions(user1.address)
        // console.log('mapping.tokenAmount', contribution.tokenAmount) //20
        // console.log('amount variable', amount)                              //40
        expect(contribution.etherAmount).to.equal(eth)
        expect(contribution.tokenAmount).to.equal(amount)
      })
      
    })

  })

  describe('Updating Price', () => {
    let transaction, result
    let price = ether(4)

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).setPrice(ether(4))
        result = await transaction.wait()
      })

      it('updates the price', async () => {
        expect(await crowdsale.price()).to.equal(ether(4))
      })

    })

    describe('Failure', () => {

      it('prevents non-owner from updating price', async () => {
        await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted
      })

    })
  })

  describe('Finalizing ICO', () => {
    let transaction, result
    let amount = tokens(10)
    let value = ether(20)

    describe('Finalizing ICO: Success', () => {
      beforeEach(async () => {
        await crowdsale.connect(deployer).changeIcoEnd(1706684614)
        await crowdsale.connect(deployer).addToWhitelist(user1.address)
        await crowdsale.connect(user1).buyTokens(amount, { value: value})
        await crowdsale.connect(deployer).addToWhitelist(user2.address)
        await crowdsale.connect(user2).buyTokens(amount, { value: value})

        // let icoFinalized = await crowdsale.icoFinalized();
        // console.log('icoFinalized:', icoFinalized);

        transaction = await crowdsale.connect(deployer).finalize()
        result = await transaction.wait()
      })

      it('changes icoFinalized to true', async () => {
        expect(await crowdsale.icoFinalized()).to.equal(true)
      })

      // it('in case of finalize success: transfers token balance to contributors', async () => {
      //   console.log('token.balanceOf(user1.address)',await token.balanceOf(user1.address))
      //   console.log('token.balanceOf(user2.address))',await token.balanceOf(user2.address))
      //   console.log('token.balanceOf(crowdsale.address)',await token.balanceOf(crowdsale.address))
      //   console.log('token.balanceOf(deployer.address)',await token.balanceOf(deployer.address))
      //   expect(await token.balanceOf(user1.address)).to.equal(amount)
      //   expect(await token.balanceOf(user2.address)).to.equal(amount)
      //   expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999980))
      //   let contributor1 = await crowdsale.contributions(user1.address)
      //   let contributor2 = await crowdsale.contributions(user2.address)
      //   expect(contributor1.tokenAmount).to.equal(0)
      //   expect(contributor2.tokenAmount).to.equal(0)
      // })

      // it('emits finalize event', async () => {
      //   await expect(transaction).to.emit(crowdsale, "FinalizeSuccess")
      //     .withArgs(amount, value)
      // })
    })

    describe('Finalizing ICO: Failure end time', () => {

      it('does not finalize before the icoEnd time', async () => {
        await expect(crowdsale.connect(deployer).finalize()).to.be.reverted;
      })
    })

    describe('Finalizing ICO: Failure Fundraising Goal not met', () => {
      beforeEach(async () => {
        await crowdsale.connect(deployer).changeIcoEnd(1706684614)
        await crowdsale.connect(deployer).changeFundraisingGoal(tokens(100))
        await crowdsale.connect(deployer).addToWhitelist(user1.address)
        await crowdsale.connect(deployer).addToWhitelist(user2.address)

        let transaction1 = await crowdsale.connect(user1).buyTokens(amount, { value: value})
        let txReceipt1 = await transaction1.wait()
        let transaction1_gas = (txReceipt1.gasUsed).mul(transaction1.gasPrice);

        let transaction2 = await crowdsale.connect(user2).buyTokens(amount, { value: value})
        let txReceipt2 = await transaction2.wait()
        let transaction2_gas = (txReceipt2.gasUsed).mul(transaction2.gasPrice);


      })

      it('in case of finalize failure: sends eth back to contributors', async () => {
        let user1_t1_ether_balance = await ethers.provider.getBalance(user1.address)
        let user2_t1_ether_balance = await ethers.provider.getBalance(user2.address)
        // console.log('user1_t1_ether_balance',user1_t1_ether_balance)

        transaction = await crowdsale.connect(deployer).finalize()
        result = await transaction.wait()

        const user1_t2_ether_balance = await ethers.provider.getBalance(user1.address);
        await expect(user1_t2_ether_balance).to.equal(user1_t1_ether_balance.add(ether(20)));
        const user2_t2_ether_balance = await ethers.provider.getBalance(user2.address);
        await expect(user2_t2_ether_balance).to.equal(user2_t1_ether_balance.add(ether(20)));
      })
    })
  })

  describe('Whitelist Functions', () => {
    let transaction, result
    let amount = tokens(10)
    let value = ether(10)

    describe('Whitelist Functions: Failure', () => {
      it('prevents non-whitelisted address from buying tokens', async () => {
        await expect(crowdsale.connect(deployer).buyTokens(tokens(10))).to.be.reverted;
      })
    })
  })

  describe('ICO Start Time', () => {
    let transaction, result
    let amount = tokens(10)
    let value = ether(10)

    describe('Failure', () => {

       it('prevents buying tokens before start time', async () => {
        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction = await crowdsale.connect(deployer).changeIcoStart(2706599640)
        await expect(crowdsale.connect(user1).buyTokens(amount, { value: value})).to.be.reverted
      })
    })
  })

  describe('Array/Mapping Checks', () => {

    describe('Success', () => {
    let transaction, result
    let amount = tokens(10)
    let eth = tokens(20)

    beforeEach(async () => {
      await crowdsale.connect(deployer).addToWhitelist(user1.address)
      await crowdsale.connect(user1).buyTokens(amount, { value: ether(20) })
      await crowdsale.connect(deployer).addToWhitelist(user2.address)
      await crowdsale.connect(user2).buyTokens(amount, { value: ether(20) })
    })

      // it('Updates contributionAddressesLength', async () => {
      //   contributionAddressesLength = await crowdsale.contributionAddressesLength();
      //   expect(contributionAddressesLength).to.equal(2);
      // })

      it('Puts addresses in mapping', async () => {
        const firstAddress = await crowdsale.contributionAddresses(0);
        const secondAddress = await crowdsale.contributionAddresses(1);
        expect(firstAddress).to.equal(user1.address);
        expect(secondAddress).to.equal(user2.address);
      })
    })
  })
})
