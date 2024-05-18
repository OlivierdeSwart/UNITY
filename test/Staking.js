const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 8);
}

describe('Staking & Withdrawing', () => {
    let staking, token, deployer_owner, user1, user2;
    beforeEach(async () => {
        // Load and deploy Token contract
        const Token = await ethers.getContractFactory('Token');
        token = await Token.deploy('Wrapped Binary Bit Token', 'WBNRY', tokens(120000000));
        await token.deployed();

        // Load and deploy Staking contract
        const Staking = await ethers.getContractFactory('Staking');
        staking = await Staking.deploy(token.address);
        await staking.deployed();

        // Configure accounts
        [deployer_owner, user1, user2] = await ethers.getSigners();
        
        // Send tokens to user1 & 2
        let transaction = await token.connect(deployer_owner).transfer(user1.address, tokens(1000));
        await transaction.wait();
        transaction = await token.connect(deployer_owner).transfer(user2.address, tokens(1000));
        await transaction.wait();
    });

    describe('Deployment', async () => {
        it('Should have the right token address', async () => {
            expect(await staking.token()).to.equal(token.address);
        });

        it('Should have the right owner address', async () => {
            expect(await staking.owner()).to.equal(deployer_owner.address);
        });

        it('Should have the right balance', async () => {
            expect(await token.balanceOf(deployer_owner.address)).to.equal(tokens(2000));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(1000));
            expect(await token.balanceOf(user2.address)).to.equal(tokens(1000));
        });
    });

    describe('Staking one user once positive', async () => {
        beforeEach(async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(20));
            await approval.wait();

            let transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();
        });

        it('Should have the right balance after staking', async () => {
            const participant = await staking.getParticipant(user1.address);
            expect(participant.tokenAmountSatoshi).to.equal(tokens(20));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(980));
            expect(await token.balanceOf(staking.address)).to.equal(tokens(20));
        });

        it('Should retrieve all customer addresses', async () => {
            const customerAddresses = await staking.getCustomerAddressesArray();
            expect(customerAddresses).to.include(user1.address);
        });

        it('Should correctly store and retrieve participant data', async () => {
            const participant = await staking.getParticipant(user1.address);
            expect(participant.user).to.equal(user1.address);
            expect(participant.tokenAmountSatoshi).to.equal(tokens(20));
            let latestStakeTime = participant.latestStakeTime.toNumber();
            
            expect(latestStakeTime).to.be.a('number');
            
            latestStakeTime = new Date(latestStakeTime * 1000);
            // console.log('Latest Stake Time (CEST):', latestStakeTime.toLocaleString('en-GB', { timeZone: 'Europe/Berlin' }));
        });
    });

    describe('Staking two users once positive', async () => {
        beforeEach(async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(20));
            await approval.wait();
            let transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();         

            approval = await token.connect(user2).approve(staking.address, tokens(20));
            await approval.wait();
            transaction = await staking.connect(user2).stake(tokens(20));
            await transaction.wait();
        });

        it('Should have the right balance after staking twice', async () => {
            const participant1 = await staking.getParticipant(user1.address);
            expect(participant1.tokenAmountSatoshi).to.equal(tokens(20));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(980));
            expect(await token.balanceOf(staking.address)).to.equal(tokens(40));   
            
            const participant2 = await staking.getParticipant(user2.address);
            expect(participant2.tokenAmountSatoshi).to.equal(tokens(20));
            expect(await token.balanceOf(user2.address)).to.equal(tokens(980));
            expect(await token.balanceOf(staking.address)).to.equal(tokens(40));
        });


        it('Array: Should retrieve all customer addresses', async () => {
            const customerAddresses = await staking.getCustomerAddressesArray();
            expect(customerAddresses).to.include(user1.address);
            expect(customerAddresses).to.include(user2.address);
            expect(customerAddresses.length).to.equal(2);
        });

        it('Mapping: Should retrieve all customer mappings', async () => {
            const participant1 = await staking.getParticipant(user1.address);
            expect(participant1.user).to.equal(user1.address);
            expect(participant1.tokenAmountSatoshi).to.equal(tokens(20));
        
            const participant2 = await staking.getParticipant(user2.address);
            expect(participant2.user).to.equal(user2.address);
            expect(participant2.tokenAmountSatoshi).to.equal(tokens(20));
        });

        it('Struct: Should correctly store and retrieve participant data', async () => {
            const participant1 = await staking.getParticipant(user1.address);
            expect(participant1.user).to.equal(user1.address);
            expect(participant1.tokenAmountSatoshi).to.equal(tokens(20));
            expect(ethers.BigNumber.isBigNumber(participant1.latestStakeTime)).to.be.true;
            
            const participant2 = await staking.getParticipant(user2.address);
            expect(participant2.user).to.equal(user2.address);
            expect(participant2.tokenAmountSatoshi).to.equal(tokens(20));
            expect(ethers.BigNumber.isBigNumber(participant2.latestStakeTime)).to.be.true;
        });
    });

    describe('Staking one user twice positive', async () => {
        beforeEach(async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(40));
            await approval.wait();
            let transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();    
            transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();
        });

        it('Should have the right balance after staking twice', async () => {
            const participant1 = await staking.getParticipant(user1.address);
            expect(participant1.tokenAmountSatoshi).to.equal(tokens(40));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(960));
            expect(await token.balanceOf(staking.address)).to.equal(tokens(40));  
        });

        it('Should retrieve all customer addresses', async () => {
            const customerAddresses = await staking.getCustomerAddressesArray();
            expect(customerAddresses).to.include(user1.address);
            expect(customerAddresses).to.not.include(user2.address);
        });

        it('Should correctly store and retrieve participant data', async () => {
            const participant1 = await staking.getParticipant(user1.address);
            expect(participant1.user).to.equal(user1.address);
            expect(participant1.tokenAmountSatoshi).to.equal(tokens(40));
            expect(ethers.BigNumber.isBigNumber(participant1.latestStakeTime)).to.be.true;
        });
    });

    describe('Staking negative', async () => {
        beforeEach(async () => {
            // let approval = await token.connect(user1).approve(staking.address, tokens(20));
            // await approval.wait();

            // let transaction = await staking.connect(user1).stake(tokens(20));
            // await transaction.wait();
        });

        it('Should not stake if not approved', async () => {
            let transaction = staking.connect(user1).stake(tokens(20));
            await expect(transaction).to.be.reverted;
        });

        it('Should not stake if not enough tokens', async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(20));
            await approval.wait();

            let transaction = staking.connect(user1).stake(tokens(21));
            await expect(transaction).to.be.reverted;
        });

        it('Should not stake if value is 0', async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(20));
            await approval.wait();

            let transaction = staking.connect(user1).stake(tokens(0));
            await expect(transaction).to.be.reverted;
        });


    });

    describe('Withdraw positive', async () => {
        beforeEach(async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(20));
            await approval.wait();

            let transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();
            
            transaction = await staking.connect(user1).withdraw(tokens(10));
            await transaction.wait();
        });

        it('Should withdraw', async () => {

            const participant = await staking.getParticipant(user1.address);
            expect(participant.tokenAmountSatoshi).to.equal(tokens(10));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(990));
            expect(await token.balanceOf(staking.address)).to.equal(tokens(10));
        });

        it('Should withdraw twice', async () => {
            let transaction = await staking.connect(user1).withdraw(tokens(9));
            await transaction.wait();

            const participant = await staking.getParticipant(user1.address);
            expect(participant.tokenAmountSatoshi).to.equal(tokens(1));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(999));
            expect(await token.balanceOf(staking.address)).to.equal(tokens(1));
        });
    });

    describe('Withdraw negative', async () => {
        beforeEach(async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(20));
            await approval.wait();

            let transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();
        });

        it('Should not withdraw when input is 0', async () => {
            await expect(staking.connect(user1).withdraw(tokens(0))).to.be.revertedWith("Token amount must be greater than zero");
        });

        it('Should not withdraw when input is greater than balance', async () => {
            await expect(staking.connect(user1).withdraw(tokens(21))).to.be.reverted;
        });
    });
});