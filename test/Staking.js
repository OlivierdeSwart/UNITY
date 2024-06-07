const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 8);
}

describe('Staking & Withdrawing', () => {
    let staking, token, deployer_owner, user1, user2, user3;
    
    beforeEach(async () => {
        // Load and deploy WBNRY contract
        const WBNRY = await ethers.getContractFactory('WBNRY');
        token = await WBNRY.deploy();
        await token.deployed();

        // Load and deploy Staking contract
        const Staking = await ethers.getContractFactory('Staking');
        staking = await Staking.deploy(token.address);
        await staking.deployed();

        // Configure accounts
        [deployer_owner, user1, user2, user3] = await ethers.getSigners();
        
        // Mint tokens to deployer_owner and transfer tokens to user1, user2, and user3
        await token.connect(deployer_owner).mint(deployer_owner.address, tokens(10000)); // Mint to deployer_owner
        let transaction = await token.connect(deployer_owner).transfer(user1.address, tokens(1000));
        await transaction.wait();
        transaction = await token.connect(deployer_owner).transfer(user2.address, tokens(1000));
        await transaction.wait();
        transaction = await token.connect(deployer_owner).transfer(user3.address, tokens(1000));
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
            expect(await token.balanceOf(deployer_owner.address)).to.equal(tokens(7000));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(1000));
            expect(await token.balanceOf(user2.address)).to.equal(tokens(1000));
        });
    });

    describe('calculateCurrentBalance', async () => {
        beforeEach(async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(30));
            await approval.wait();

            let transaction = await staking.connect(user1).stake(tokens(10));
            await transaction.wait();
        });

        it('Should calculate the right balance after no passed time', async () => {
            const currentBalance = await staking.calculateCurrentBalanceCompound(user1.address);
            expect(currentBalance).to.be.closeTo(tokens(10), tokens(1)); // Allow small deviation for testing
        });

        it('Should calculate the right balance after 1 year of time', async () => {
            const oneYearAgo = (await ethers.provider.getBlock('latest')).timestamp - 365 * 24 * 60 * 60;
            await staking.connect(deployer_owner).updateTimestamp(user1.address, oneYearAgo);
            
            const participant = await staking.getParticipant(user1.address);
            let latestActionTime = participant.latestActionTime.toNumber(); // Ensure proper conversion to number
            
            expect(latestActionTime).to.equal(oneYearAgo);
            
            latestActionTime = new Date(latestActionTime * 1000);
            // console.log('Latest Action Time (CEST):', latestActionTime.toLocaleString('en-GB', { timeZone: 'Europe/Berlin' }));

            // const currentBalanceLinear = await staking.calculateCurrentBalanceLinear(user1.address);
            // console.log('currentBalanceLinear:', currentBalanceLinear);

            const currentBalanceCompound = await staking.calculateCurrentBalanceCompound(user1.address);
            // console.log('currentBalanceCompound:', currentBalanceCompound);
            expect(currentBalanceCompound).to.be.closeTo(tokens(18), tokens(1)); // Allow small deviation for testing
        });

        it('Stake once wait 3 years in 1 year increments', async () => {
            // Stake initially
            // await staking.connect(user1).stake(tokens(10));
            console.log('1. Initial stake', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
        
            // Wait 1 year
            let oneYearLater = (await ethers.provider.getBlock('latest')).timestamp + 365 * 24 * 60 * 60;
            await ethers.provider.send('evm_setNextBlockTimestamp', [oneYearLater]);
            await ethers.provider.send('evm_mine');
            console.log('2. After 1 year', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
        
            // Wait another year
            oneYearLater += 365 * 24 * 60 * 60;
            await ethers.provider.send('evm_setNextBlockTimestamp', [oneYearLater]);
            await ethers.provider.send('evm_mine');
            console.log('3. After 2 years', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
        
            // Wait another year
            oneYearLater += 365 * 24 * 60 * 60;
            await ethers.provider.send('evm_setNextBlockTimestamp', [oneYearLater]);
            await ethers.provider.send('evm_mine');
            console.log('4. After 3 years', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
        
            expect(await staking.calculateCurrentBalanceCompound(user1.address)).to.be.above(tokens(10));
        });
        

        it('Should calculate the right balance stake 10 token, wait 1 year, iterate 3x', async () => {
            
            // Staked in before each
            console.log('1. Staked in before each', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            // console.log('1. Participant struct', await staking.getParticipant(user1.address))
            
            // Wait 1 year
            const oneYearAgo = (await ethers.provider.getBlock('latest')).timestamp - 365 * 24 * 60 * 60;
            await staking.connect(deployer_owner).updateTimestamp(user1.address, oneYearAgo);
            // console.log('2. Participant struct', await staking.getParticipant(user1.address))
            console.log('2. Wait 1 year', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));

            // Stake again
            let transaction = await staking.connect(user1).stake(tokens(10));
            await transaction.wait();
            console.log('3. Staked second time', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US')); // should be 18 + 10 = 28. Not 20
            // console.log('3. Participant struct', await staking.getParticipant(user1.address))
            
            // Wait 1 year again
            await staking.connect(deployer_owner).updateTimestamp(user1.address, oneYearAgo);
            console.log('4. Wait 1 year again', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            expect(await staking.calculateCurrentBalanceCompound(user1.address)).to.be.above(tokens(30));

            // Stake again
            transaction = await staking.connect(user1).stake(tokens(10));
            await transaction.wait();
            console.log('5. Staked second time', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US')); // should be 18 + 10 = 28. Not 20
            // console.log('5. Participant struct', await staking.getParticipant(user1.address))
            
            // Wait 1 year again
            await staking.connect(deployer_owner).updateTimestamp(user1.address, oneYearAgo);
            console.log('6. Wait 1 year again', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            // console.log('6. Participant struct', await staking.getParticipant(user1.address))
            expect(await staking.calculateCurrentBalanceCompound(user1.address)).to.be.above(tokens(30));

            // Withdraw


        });

        
    });

    describe('Staking one user once positive', async () => {
        beforeEach(async () => {
            let approval = await token.connect(user1).approve(staking.address, tokens(30));
            await approval.wait();

            let transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();
        });

        it('Should emit correct event', async () => {
            let transaction = await staking.connect(user1).stake(tokens(10));
            const receipt = await transaction.wait();
            const logs = receipt.events;
        
            // Filter logs to get only Stake events
            let stakeEventLogs = logs.filter(log => log.event === 'Stake');
        
            // Ensure there is at least one Stake event log
            expect(stakeEventLogs.length).to.be.greaterThan(0);
        
            // Check if the correct event name is present
            expect(stakeEventLogs.some(log => log.event === 'Stake')).to.be.true;
        
            // Check if the event contains the correct user address argument
            expect(stakeEventLogs.some(log => log.args && log.args.customer === user1.address)).to.be.true;
        
            // Check if the event contains the correct token amount argument
            expect(stakeEventLogs.some(log => log.args && log.args.amount_wbnry.eq(tokens(10)))).to.be.true;
        })

        it('Should have the right balance after staking', async () => {
            const participant = await staking.getParticipant(user1.address);
            expect(participant.directStakeAmountSatoshi).to.be.closeTo(tokens(20), tokens(1));
            expect(participant.rewardAmountSatoshi).be.closeTo(tokens(0), tokens(1));
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
            let latestActionTime = participant.latestActionTime.toNumber();
            expect(latestActionTime).to.be.a('number');
            expect(participant.directStakeAmountSatoshi).to.equal(tokens(20));
            expect(participant.rewardAmountSatoshi).to.equal(tokens(0));
            
            latestActionTime = new Date(latestActionTime * 1000);
            // console.log('Latest Stake Time (CEST):', latestActionTime.toLocaleString('en-GB', { timeZone: 'Europe/Berlin' }));
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
            expect(participant1.directStakeAmountSatoshi).to.equal(tokens(20));
            expect(participant1.rewardAmountSatoshi).to.to.be.closeTo(tokens(0), tokens(1));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(980));
            expect(await token.balanceOf(staking.address)).to.equal(tokens(40));   
            
            const participant2 = await staking.getParticipant(user2.address);
            expect(participant2.directStakeAmountSatoshi).to.equal(tokens(20));
            expect(participant2.rewardAmountSatoshi).to.be.closeTo(tokens(0), tokens(1));
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
            expect(participant1.directStakeAmountSatoshi).to.equal(tokens(20));
            expect(participant1.rewardAmountSatoshi).to.equal(tokens(0));
        
            const participant2 = await staking.getParticipant(user2.address);
            expect(participant2.user).to.equal(user2.address);
            expect(participant2.directStakeAmountSatoshi).to.equal(tokens(20));
            expect(participant2.rewardAmountSatoshi).to.equal(tokens(0));
        });

        it('Struct: Should correctly store and retrieve participant data', async () => {
            const participant1 = await staking.getParticipant(user1.address);
            expect(participant1.user).to.equal(user1.address);
            expect(participant1.directStakeAmountSatoshi).to.equal(tokens(20));
            expect(participant1.rewardAmountSatoshi).to.equal(tokens(0));
            expect(ethers.BigNumber.isBigNumber(participant1.latestActionTime)).to.be.true;
            
            const participant2 = await staking.getParticipant(user2.address);
            expect(participant2.user).to.equal(user2.address);
            expect(participant2.directStakeAmountSatoshi).to.equal(tokens(20));
            expect(participant2.rewardAmountSatoshi).to.equal(tokens(0));
            expect(ethers.BigNumber.isBigNumber(participant2.latestActionTime)).to.be.true;
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
            expect(participant1.directStakeAmountSatoshi).to.equal(tokens(40));
            expect(participant1.rewardAmountSatoshi).to.be.closeTo(tokens(0), tokens(1));
            // console.log(participant1.rewardAmountSatoshi)
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
            expect(ethers.BigNumber.isBigNumber(participant1.latestActionTime)).to.be.true;
            expect(participant1.directStakeAmountSatoshi).to.equal(tokens(40));
            expect(participant1.rewardAmountSatoshi).to.be.closeTo(tokens(0), tokens(1));
        });
    });

    describe('Staking negative', async () => {

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

    describe('Treasury funding', async () => {
        beforeEach(async () => {
        // Fund treasury
        let approval = await token.connect(deployer_owner).approve(staking.address, tokens(2000));
        await approval.wait();
        let transaction = await staking.connect(deployer_owner).fundTreasury(tokens(1000));
        await transaction.wait();
        });

        it('Should have a funded treasury', async () => {
            expect(await token.balanceOf(staking.address)).to.equal(tokens(1000));
        });

        it('Should have the right total treasury tokens', async () => {
            expect(await staking.totalTreasuryTokens()).to.equal(tokens(1000));
        });

        it('Should emit correct event for fundTreasury', async () => {
            // Perform the fundTreasury transaction
            let transaction = await staking.connect(deployer_owner).fundTreasury(tokens(1000));
            const receipt = await transaction.wait();
            const logs = receipt.events;
        
            // Filter logs to get only FundTreasury events
            const fundTreasuryEventLogs = logs.filter(log => log.event === 'FundTreasury');
        
            // Ensure there is at least one FundTreasury event log
            expect(fundTreasuryEventLogs.length).to.be.greaterThan(0);
        
            // Check if the correct event name is present
            expect(fundTreasuryEventLogs.some(log => log.event === 'FundTreasury')).to.be.true;
        
            // Check if the event contains the correct funder address argument
            expect(fundTreasuryEventLogs.some(log => log.args && log.args.funder === deployer_owner.address)).to.be.true;
        
            // Check if the event contains the correct token amount argument
            expect(fundTreasuryEventLogs.some(log => log.args && log.args.amount_wbnry.eq(tokens(1000)))).to.be.true;
        });
        

    });

    describe('Simple withdraw positive', async () => {
        beforeEach(async () => {
            // Fund treasury
            let approval = await token.connect(deployer_owner).approve(staking.address, tokens(1000));
            await approval.wait();
            let transaction = await staking.connect(deployer_owner).fundTreasury(tokens(1000));
            await transaction.wait();

            // Stake 20 tokens
            approval = await token.connect(user1).approve(staking.address, tokens(20));
            await approval.wait();
            transaction = await staking.connect(user1).stake(tokens(20));
            await transaction.wait();   
        });

        it('Should emit correct event for withdraw', async () => {
        
            // Perform the withdraw
            let transaction = await staking.connect(user1).withdraw(tokens(5));
            const receipt = await transaction.wait();
            const logs = receipt.events;
        
            // Filter logs to get only Withdraw events
            const withdrawEventLogs = logs.filter(log => log.event === 'Withdraw');
        
            // Ensure there is at least one Withdraw event log
            expect(withdrawEventLogs.length).to.be.greaterThan(0);
        
            // Check if the correct event name is present
            expect(withdrawEventLogs.some(log => log.event === 'Withdraw')).to.be.true;
        
            // Check if the event contains the correct user address argument
            expect(withdrawEventLogs.some(log => log.args && log.args.customer === user1.address)).to.be.true;
        
            // Check if the event contains the correct token amount argument
            expect(withdrawEventLogs.some(log => log.args && log.args.amount_wbnry.eq(tokens(5)))).to.be.true;
        });
        

        it('Should withdraw', async () => {
            // console.log(await staking.getParticipant(user1.address))

            transaction = await staking.connect(user1).withdraw(tokens(10));
            await transaction.wait();

            const participant = await staking.getParticipant(user1.address);

            // console.log(await staking.getParticipant(user1.address))            
            // console.log("Total Tokens Staked:", (await staking.totalTokensStaked()).toString());
            // console.log("Total Treasury Tokens:", (await staking.totalTreasuryTokens()).toString());
            
            expect(participant.directStakeAmountSatoshi).to.be.closeTo(tokens(10), tokens(1));
            expect(participant.rewardAmountSatoshi).to.equal(tokens(0));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(990));
            expect(await token.balanceOf(staking.address)).to.be.closeTo(tokens(1010), tokens(1));

            // expect(await staking.calculateCurrentBalanceCompound(user1.address)).to.be.above(tokens(30));
        });

        it('Should withdraw twice', async () => {
                     
            let transaction = await staking.connect(user1).withdraw(tokens(10));
            await transaction.wait();
            transaction = await staking.connect(user1).withdraw(tokens(9));
            await transaction.wait();

            // console.log(await staking.getParticipant(user1.address))            
            // console.log("Contract total Tokens Staked:", (await staking.totalTokensStaked()).toString());
            // console.log("Contract total Treasury Tokens:", (await staking.totalTreasuryTokens()).toString());

            const participant = await staking.getParticipant(user1.address);
            expect(participant.directStakeAmountSatoshi).to.be.closeTo(tokens(1), tokens(1));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(999));
            expect(await token.balanceOf(staking.address)).to.be.closeTo(tokens(1001), tokens(1));
        });
    });

    describe('Complex withdrawal positive', async () => {
        it('Should withdraw correctly when withdraw_amount < accrued rewards. Check contract treasury & total stake too', async () => {
            // Fund treasury
            let approval = await token.connect(deployer_owner).approve(staking.address, tokens(1000));
            await approval.wait();
            let transaction = await staking.connect(deployer_owner).fundTreasury(tokens(1000));
            await transaction.wait();

            // Staking preparation
            approval = await token.connect(user1).approve(staking.address, tokens(30));
            await approval.wait(); 
            // 1. Stake 1
            transaction = await staking.connect(user1).stake(tokens(10));
            await transaction.wait();
            console.log('1. t0 Staked 10 at t0', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            // 2. Wait 1 year
            const oneYearAgo = (await ethers.provider.getBlock('latest')).timestamp - 365 * 24 * 60 * 60;
            await staking.connect(deployer_owner).updateTimestamp(user1.address, oneYearAgo);
            console.log('2. t1 Waited 1 year', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            // 3. Stake 2
            transaction = await staking.connect(user1).stake(tokens(10));
            await transaction.wait();
            console.log('3. t1 Staked 10 more at t1', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            // 4. Wait 1 year again
            await staking.connect(deployer_owner).updateTimestamp(user1.address, oneYearAgo);
            console.log('4. t2 Waited 1 year', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            // 5. Stake 3
            transaction = await staking.connect(user1).stake(tokens(10));
            // console.log('After stakes & waits before withdraw',await staking.getParticipant(user1.address))
            console.log('5. t2 Stake 10 more at t2', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            

            let participant1 = await staking.getParticipant(user1.address);

            console.log('5. Participant Address:', participant1.user);
            console.log('5. directStakeAmountSatoshi:', Number(participant1.directStakeAmountSatoshi.toString()).toLocaleString('en-US'));
            console.log('5. rewardAmountSatoshi:', Number(participant1.rewardAmountSatoshi.toString()).toLocaleString('en-US'));
            console.log('5. latestActionTime:', Number(participant1.latestActionTime.toString()).toLocaleString('en-US'));

            // Withdraw
            transaction = await staking.connect(user1).withdraw(tokens(15));
            await transaction.wait();

            // console.log('6. t3 Withdraw 15', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));

            // console.log('6. t3 Withdraw 15', await staking.getParticipant(user1.address))

            let participant2 = await staking.getParticipant(user1.address);

            console.log('6. t3 CCBC after withdraw', Number((await staking.calculateCurrentBalanceCompound(user1.address)).toString()).toLocaleString('en-US'));
            console.log('6. t3 Withdraw 15 Participant Address:', participant2.user);
            console.log('6. t3 Withdraw 15 directStakeAmountSatoshi:', Number(participant2.directStakeAmountSatoshi.toString()).toLocaleString('en-US'));
            console.log('6. t3 Withdraw 15 rewardAmountSatoshi:', Number(participant2.rewardAmountSatoshi.toString()).toLocaleString('en-US'));
            console.log('6. t3 Withdraw 15 latestActionTime:', Number(participant2.latestActionTime.toString()).toLocaleString('en-US'));
            // console.log("Total Tokens Staked:", (await staking.totalTokensStaked()).toString());
            // console.log("Total Treasury Tokens:", (await staking.totalTreasuryTokens()).toString());
        
            expect(participant2.directStakeAmountSatoshi).to.equal(tokens(30));
            expect(participant2.rewardAmountSatoshi).to.be.closeTo(tokens(16), tokens(1));
            expect(await token.balanceOf(user1.address)).to.equal(tokens(985));
            expect(await token.balanceOf(staking.address)).to.be.closeTo(tokens(1015), tokens(1));
            expect(await staking.totalTokensStaked()).to.equal(tokens(30));
            expect(await staking.totalTreasuryTokens()).to.equal(tokens(985));
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

    describe('Annual yield change', async () => {
        it('Should change the annual yield', async () => {
            // Prepare users and stakes
            let approval = await token.connect(user1).approve(staking.address, tokens(30));
            await approval.wait();
            let transaction = await staking.connect(user1).stake(tokens(10));
            await transaction.wait();
            approval = await token.connect(user2).approve(staking.address, tokens(30));
            await approval.wait();
            transaction = await staking.connect(user2).stake(tokens(20));
            await transaction.wait();
            approval = await token.connect(user3).approve(staking.address, tokens(30));
            await approval.wait();
            transaction = await staking.connect(user3).stake(tokens(30));
            await transaction.wait();

            // Wait 1 year
            const oneYearAgo = (await ethers.provider.getBlock('latest')).timestamp - 365 * 24 * 60 * 60;
            await staking.connect(deployer_owner).updateTimestamp(user1.address, oneYearAgo);
            await staking.connect(deployer_owner).updateTimestamp(user2.address, oneYearAgo);
            await staking.connect(deployer_owner).updateTimestamp(user3.address, oneYearAgo);

            // console.log(await staking.getParticipant(user1.address))
            // console.log(await staking.getParticipant(user2.address))
            // console.log(await staking.getParticipant(user3.address))

            await staking.connect(deployer_owner).changeAnnualYield(40);

            // console.log(await staking.getParticipant(user1.address))
            // console.log(await staking.getParticipant(user2.address))
            // console.log(await staking.getParticipant(user3.address))

            expect(await staking.annualYield()).to.equal(40);
        });

        it('Should emit correct AnnualYieldChanged event', async () => {
            let transaction = await staking.connect(deployer_owner).changeAnnualYield(75);
            const receipt = await transaction.wait();
            const logs = receipt.events;
        
            // Filter logs to get only AnnualYieldChanged events
            const annualYieldChangedEventLogs = logs.filter(log => log.event === 'AnnualYieldChanged');
        
            // Ensure there is at least one AnnualYieldChanged event log
            expect(annualYieldChangedEventLogs.length).to.be.greaterThan(0);
        
            // Check if the correct event name is present
            expect(annualYieldChangedEventLogs.some(log => log.event === 'AnnualYieldChanged')).to.be.true;
        
            // Check if the event contains the correct new annual yield argument
            expect(annualYieldChangedEventLogs.some(log => log.args && log.args.newAnnualYield.eq(75))).to.be.true;
        })
    });
});
