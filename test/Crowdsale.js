const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Crowdsale', () => {
  let crowdsale, token
  let accounts, deployer, user1
  let price = 2

  beforeEach(async () => {
      // Load Contracts
      const Crowdsale = await ethers.getContractFactory('Crowdsale')
      const Token = await ethers.getContractFactory('Token')

      // Deploy token
      token = await Token.deploy('Dapp University','DAPP','1000000') //NAME, SYMBOL, TOTAL_SUPPLY

      // Configure Accounts
      accounts = await ethers.getSigners()
      deployer = accounts[0]
      user1 = accounts[1]
      user2 = accounts[2]

      // Deploy Crowdsale
      crowdsale = await Crowdsale.deploy(token.address, ether(2), '1000000') //TOKEN, PRICE, MAX_SUPPLY

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
        result = await transaction1.wait()

        // transaction2 = await crowdsale.connect(deployer).addToWhitelist(user2.address)
        // transaction2 = await crowdsale.connect(user2).buyTokens(amount, { value: ether(20) })
        // result = await transaction1.wait()
      })


      it('crowdsale contract keeps holding max amount of tokens', async () => {
        // console.log("test:", token.address); //VALUE FROM SMART CONTRACT

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

      it('emits a buy event', async () => {
        const event = result.events[0]
        const event_args = result.events[0].args
        // console.log(event)
        // console.log(event_args)
        expect(event.event).to.equal('Buy')
        expect(event_args.buyer).to.equal(user1.address)
        expect(event_args.amount_tokens).to.equal(amount)
        expect(event_args.amount_eth).to.equal(eth)
      })

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
        // console.log("test:", token.address); //VALUE FROM SMART CONTRACT

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

  describe('Finalizing Sale', () => {
    let transaction, result
    let amount = tokens(10)
    let value = ether(20)

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).changeIcoEnd(1706684614)
        transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
        transaction = await crowdsale.connect(user1).buyTokens(amount, { value: value})
        result = await transaction.wait()

        transaction = await crowdsale.connect(deployer).finalize()
        result = await transaction.wait()
      })

      it('changes ico_finalized to true', async () => {
        console.log(crowdsale.ico_finalized)
        expect(await crowdsale.ico_finalized).to.equal(true)
        // expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990))
      })

      // it('transfers ETH balance to owner', async () => {
      //   expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0)
      // })

      it('emits finalize event', async () => {
        await expect(transaction).to.emit(crowdsale, "Finalize")
          .withArgs(amount, value)
      })
    })

    describe('Failure', () => {

       it('prevents non-owner from finalizing', async () => {
        await expect(crowdsale.connect(user1).finalize()).to.be.reverted
      })
    })
  })

  describe('Whitelist Functions', () => {
    let transaction, result
    let amount = tokens(10)
    let value = ether(10)

    describe('Failure', () => {

      //  it('prevents non-whitelisted address from buying tokens', async () => {
      //   await expect(crowdsale.connect(user1).buyTokens(amount, { value: value})).to.be.reverted
      // })
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
})
