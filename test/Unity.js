const { expect } = require('chai');
const { ethers } = require('hardhat');

const eth = (n) => {
    return ethers.utils.parseUnits(n.toString(), 18);
}

describe('UNITY', () => {
    let unity, deployer, user1, user2, user3, user4;

    beforeEach(async () => {
        // Load and deploy UNITY contract
        const Unity = await ethers.getContractFactory('Unity');
        unity = await Unity.deploy();
        await unity.deployed();

        // Configure accounts
        [deployer, user1, user2, user3, user4] = await ethers.getSigners();

        // Fund the contract with enough ether to cover the loans
        await deployer.sendTransaction({ to: unity.address, value: eth(1000) });
    });

    describe('Deployment', async () => {
        it('Should initialize totalTokensLended to zero', async () => {
            expect(await unity.totalTokensLended()).to.equal(ethers.BigNumber.from(0));
        });

        it('Should initialize totalBorrowers to zero', async () => {
            expect(await unity.totalBorrowers()).to.equal(0);
        });

        it('Should initialize totalTreasuryTokens to zero', async () => {
            expect(await unity.totalTreasuryTokens()).to.equal(ethers.BigNumber.from(0));
        });
    });

    describe('Start New Loan', async () => {
        it('Should allow user to start a new loan', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: eth(10) });

            const loanAmount = eth(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
            const participant = await unity.customerMapping(user1.address);
            expect(participant.loanAmountFlatWei).to.equal(loanAmount);
            expect(participant.loanAmountWithInterestWei).to.equal(loanAmount.add(loanAmount.div(10))); // 110% of loanAmount
            expect(participant.currentLoanActive).to.be.true;
        });

        it('Should update totalTokensLended and totalBorrowers correctly', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: eth(10) });

            const loanAmount = eth(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
            expect(await unity.totalTokensLended()).to.equal(loanAmount);
            expect(await unity.totalBorrowers()).to.equal(1);
        });

        it('Should revert if the user has an active loan', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: eth(10) });

            const loanAmount = eth(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
            await expect(unity.connect(user1).startNewLoan(loanAmount)).to.be.revertedWith('Current loan is active.');
        });

        it('Should transfer the loan amount to the user', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: eth(10) });

            const initialUserBalance = await ethers.provider.getBalance(user1.address);
            const initialContractBalance = await ethers.provider.getBalance(unity.address);

            console.log(`Initial user balance: ${ethers.utils.formatEther(initialUserBalance)} ETH`);
            console.log(`Initial contract balance: ${ethers.utils.formatEther(initialContractBalance)} ETH`);

            const loanAmount = eth(10); // 10 ETH in wei
            const tx = await unity.connect(user1).startNewLoan(loanAmount);
            const receipt = await tx.wait();

            const gasUsed = receipt.gasUsed;
            const effectiveGasPrice = receipt.effectiveGasPrice;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const finalUserBalance = await ethers.provider.getBalance(user1.address);
            const finalContractBalance = await ethers.provider.getBalance(unity.address);

            console.log(`Final user balance: ${ethers.utils.formatEther(finalUserBalance)} ETH`);
            console.log(`Final contract balance: ${ethers.utils.formatEther(finalContractBalance)} ETH`);

            expect(finalUserBalance.add(gasCost).sub(initialUserBalance)).to.equal(loanAmount);
        });
    });

    describe('Repay Installment', async () => {
        it('Should allow user to repay an installment', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: eth(20) }); // Increased to cover gas fees
    
            const loanAmount = eth(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
    
            const loanAmountWithInterest = loanAmount.add(loanAmount.div(10)); // 110% of the loan amount
            const installmentAmount = loanAmountWithInterest.div(10); // 10% of loanAmountWithInterest
    
            const initialUserBalance = await ethers.provider.getBalance(user1.address);
            await unity.connect(user1).repayInstallment({ value: installmentAmount });
            const finalUserBalance = await ethers.provider.getBalance(user1.address);
    
            const participant = await unity.customerMapping(user1.address);
            expect(participant.repaidAmountWei).to.equal(installmentAmount);
            expect(participant.creditScore).to.equal(installmentAmount);
            expect(participant.currentLoanActive).to.be.true;
    
            expect(initialUserBalance.sub(finalUserBalance)).to.be.closeTo(installmentAmount, ethers.utils.parseUnits('0.01', 'ether'));
        });
    
        it('Should mark loan as repaid after all installments', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: eth(20) }); // Increased to cover gas fees
    
            const loanAmount = eth(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
    
            const loanAmountWithInterest = loanAmount.add(loanAmount.div(10)); // 110% of the loan amount
            const installmentAmount = loanAmountWithInterest.div(10); // 10% of loanAmountWithInterest
    
            for (let i = 0; i < 10; i++) {
                await unity.connect(user1).repayInstallment({ value: installmentAmount });
            }
    
            const participant = await unity.customerMapping(user1.address);
            expect(participant.repaidAmountWei).to.equal(loanAmountWithInterest);
            expect(participant.creditScore).to.equal(loanAmountWithInterest);
            expect(participant.currentLoanActive).to.be.false;
        });
    });
    
    describe('Repay Entire Loan', async () => {
        // it('Should allow user to repay the entire loan', async () => {
        //     // Ensure the user has sufficient balance
        //     await deployer.sendTransaction({ to: user1.address, value: eth(20) }); // Increased to cover gas fees
    
        //     const loanAmount = eth(10); // 10 ETH in wei
        //     await unity.connect(user1).startNewLoan(loanAmount);
    
        //     const loanAmountWithInterest = loanAmount.add(loanAmount.div(10)); // 110% of the loan amount
    
        //     const initialUserBalance = await ethers.provider.getBalance(user1.address);
        //     await unity.connect(user1).repayEntireLoan({ value: loanAmountWithInterest });
        //     const finalUserBalance = await ethers.provider.getBalance(user1.address);
    
        //     const participant = await unity.customerMapping(user1.address);
        //     expect(participant.repaidAmountWei).to.equal(loanAmountWithInterest);
        //     expect(participant.creditScore).to.equal(loanAmountWithInterest);
        //     expect(participant.currentLoanActive).to.be.false;
    
        //     expect(initialUserBalance.sub(finalUserBalance)).to.be.closeTo(loanAmountWithInterest, ethers.utils.parseUnits('0.01', 'ether'));
        // });
    
        // it('Should handle partial repayments before repaying entire loan', async () => {
        //     // Ensure the user has sufficient balance
        //     await deployer.sendTransaction({ to: user1.address, value: eth(20) }); // Increased to cover gas fees
    
        //     const loanAmount = eth(10); // 10 ETH in wei
        //     await unity.connect(user1).startNewLoan(loanAmount);
    
        //     const loanAmountWithInterest = loanAmount.add(loanAmount.div(10)); // 110% of the loan amount
        //     const installmentAmount = loanAmountWithInterest.div(10); // 10% of loanAmountWithInterest
        //     await unity.connect(user1).repayInstallment({ value: installmentAmount });
    
        //     const remainingAmount = loanAmountWithInterest.sub(installmentAmount);
    
        //     const initialUserBalance = await ethers.provider.getBalance(user1.address);
        //     await unity.connect(user1).repayEntireLoan({ value: remainingAmount });
        //     const finalUserBalance = await ethers.provider.getBalance(user1.address);
    
        //     const participant = await unity.customerMapping(user1.address);
        //     expect(participant.repaidAmountWei).to.equal(loanAmountWithInterest);
        //     expect(participant.creditScore).to.equal(loanAmountWithInterest);
        //     expect(participant.currentLoanActive).to.be.false;
    
        //     expect(initialUserBalance.sub(finalUserBalance)).to.be.closeTo(remainingAmount, ethers.utils.parseUnits('0.01', 'ether'));
        // });
    });
});
