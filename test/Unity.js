const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
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
        await deployer.sendTransaction({ to: unity.address, value: tokens(1000) });
    });

    describe('Deployment', async () => {
        it('Should initialize totalTokensLended to zero', async () => {
            expect(await unity.totalTokensLended()).to.equal(tokens(0));
        });

        it('Should initialize totalBorrowers to zero', async () => {
            expect(await unity.totalBorrowers()).to.equal(0);
        });

        it('Should initialize totalTreasuryTokens to zero', async () => {
            expect(await unity.totalTreasuryTokens()).to.equal(tokens(0));
        });
    });

    describe('Start New Loan', async () => {
        it('Should allow user to start a new loan', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: tokens(10) });

            const loanAmount = tokens(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
            const participant = await unity.customerMapping(user1.address);
            expect(participant.loanAmountWei).to.equal(loanAmount);
            expect(participant.currentLoanActive).to.be.true;
        });

        it('Should update totalTokensLended and totalBorrowers correctly', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: tokens(10) });

            const loanAmount = tokens(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
            expect(await unity.totalTokensLended()).to.equal(loanAmount);
            expect(await unity.totalBorrowers()).to.equal(1);
        });

        it('Should revert if the user has an active loan', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: tokens(10) });

            const loanAmount = tokens(10); // 10 ETH in wei
            await unity.connect(user1).startNewLoan(loanAmount);
            await expect(unity.connect(user1).startNewLoan(loanAmount)).to.be.revertedWith('Current loan is active.');
        });

        it('Should transfer the loan amount to the user', async () => {
            // Ensure the user has sufficient balance
            await deployer.sendTransaction({ to: user1.address, value: tokens(10) });
        
            // Fund the contract with enough ether to cover the loan
            await deployer.sendTransaction({ to: unity.address, value: tokens(50) });
        
            const initialUserBalance = await ethers.provider.getBalance(user1.address);
            const initialContractBalance = await ethers.provider.getBalance(unity.address);
        
            console.log(`Initial user balance: ${ethers.utils.formatEther(initialUserBalance)} ETH`);
            console.log(`Initial contract balance: ${ethers.utils.formatEther(initialContractBalance)} ETH`);
        
            const loanAmount = tokens(10); // 10 ETH in wei
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
});
