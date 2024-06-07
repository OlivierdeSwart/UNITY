import { useEffect, useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { ethers } from 'ethers';

// Components
import Navigation from './Navigation';
import Loading from './Loading';

// ABIs
import WBNRY_ABI from '../abis/WBNRY.json';
import STAKING_ABI from '../abis/Staking.json';

// Config
import config from '../config.json';

function App() {
  const [defaultProvider, setDefaultProvider] = useState(null);
  const [provider, setProvider] = useState(null);
  const [staking, setStaking] = useState(null);
  const [wbnry, setWBNRY] = useState(null);

  // State variables for contract data
  const [wbnryAddress, setWBNRYAddress] = useState(null);
  const [wbnryName, setWBNRYName] = useState(null);
  const [wbnrySupply, setWBNRYSupply] = useState(null);
  const [stakingAddress, setStakingAddress] = useState(null);
  const [totalStaked, setTotalStaked] = useState(null);
  const [totalStakers, setTotalStakers] = useState(null);
  const [totalTreasuryTokens, setTotalTreasuryTokens] = useState(null);
  const [annualYield, setAnnualYield] = useState(null);

  const [account, setAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [directStakeAmountSatoshi, setDirectStakeAmountSatoshi] = useState(0);

  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const TARGET_NETWORK_ID = '31337'; // Hardhat network ID

  const loadDefaultData = async () => {
    try {
      // Initiate default provider
      const defaultProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      setDefaultProvider(defaultProvider);

      // Fetch Chain ID
      const { chainId } = await defaultProvider.getNetwork();

      // Initiate contracts
      const WBNRY = new ethers.Contract(config[chainId].WBNRY.address, WBNRY_ABI, defaultProvider);
      const Staking = new ethers.Contract(config[chainId].Staking.address, STAKING_ABI, defaultProvider);

      // Fetch contract information and update state
      const wbnrySupply = await WBNRY.totalSupply();
      const totalStaked = await Staking.totalTokensStaked();
      const totalTreasuryTokens = await Staking.totalTreasuryTokens();
      const annualYield = await Staking.annualYield();

      setWBNRYAddress(WBNRY.address);
      setWBNRYName(await WBNRY.name());
      setWBNRYSupply(wbnrySupply);
      setStakingAddress(Staking.address);
      setTotalStaked(totalStaked);
      setTotalStakers((await Staking.totalStakers()).toNumber());
      setTotalTreasuryTokens(totalTreasuryTokens);
      setAnnualYield(annualYield.toString());

      // Set the contract instances to state
      setStaking(Staking);
      setWBNRY(WBNRY);
    } catch (error) {
      console.error("Error loading default data:", error);
    }
  };

  const loadUserData = async () => {
    try {
      // Initiate provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      // Fetch Chain ID
      const { chainId } = await provider.getNetwork();

      if (chainId.toString() !== TARGET_NETWORK_ID) {
        alert(`Please connect to the correct network. Current Network ID: ${chainId}, Required Network ID: ${TARGET_NETWORK_ID}`);
        setIsLoading(false);
        return;
      }

      // Initiate contracts
      const WBNRY = new ethers.Contract(config[chainId].WBNRY.address, WBNRY_ABI, provider);
      const Staking = new ethers.Contract(config[chainId].Staking.address, STAKING_ABI, provider);
      setStaking(Staking);
      setWBNRY(WBNRY);

      // Initiate accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
      
      const participant = await Staking.getParticipant(account.address);
      const directStakeAmountSatoshi = participant.directStakeAmountSatoshi;
      setDirectStakeAmountSatoshi(directStakeAmountSatoshi);

      // Fetch account balance
      setAccountBalance(ethers.utils.formatUnits(await WBNRY.balanceOf(account), 8));


      setIsLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsLoading(false);
    }
  };

  const handleStake = async (event) => {
    event.preventDefault();

    if (!staking || !wbnry || !account || !stakeAmount) return;

    try {
      const amountToStake = ethers.utils.parseUnits(stakeAmount, 8); // Use user input
      const userBalance = await wbnry.balanceOf(account);

      if (userBalance.lt(amountToStake)) {
        alert('Insufficient token balance');
        return;
      }

      // Request approval to transfer tokens
      const approvalTx = await wbnry.connect(provider.getSigner()).approve(staking.address, amountToStake);
      await approvalTx.wait();

      // Verify approval
      const allowance = await wbnry.allowance(account, staking.address);
      if (allowance.lt(amountToStake)) {
        alert('Approval failed or insufficient approval amount');
        return;
      }

      // Stake tokens
      const stakeTx = await staking.connect(provider.getSigner()).stake(amountToStake);
      await stakeTx.wait();

      alert("Staking successful!");

      // Reload variables
      await loadDefaultData();
      await loadUserData();

      // Clear the form
      setStakeAmount('');
    } catch (error) {
      console.error("Staking failed:", error);
      alert("Staking failed! Check the console for more details.");
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();

    if (!staking || !account || !withdrawAmount) return;

    try {
      const amountToWithdraw = ethers.utils.parseUnits(withdrawAmount, 8); // Use user input

      // Withdraw tokens
      const withdrawTx = await staking.connect(provider.getSigner()).withdraw(amountToWithdraw);
      await withdrawTx.wait();

      alert("Withdrawal successful!");

      // Reload variables
      await loadDefaultData();
      await loadUserData();

      // Clear the form
      setWithdrawAmount('');
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal failed! Check the console for more details.");
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadDefaultData();
      if (window.ethereum) {
        window.ethereum.on('chainChanged', () => {
          setIsLoading(true);
        });
        window.ethereum.on('accountsChanged', () => {
          setIsLoading(true);
        });
      }
      setIsLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (isLoading) {
      loadUserData();
    }
  }, [isLoading]);

  return (
    <Container>
      <Navigation />
      <h1 className='my-4 text-center'>Introducing WBNRY Staking!</h1>

      <section>
        <h2>Staking Information</h2>
        <p>WBNRY Smart Contract Address: {wbnryAddress}</p>
        <p>WBNRY Total Circulation: {wbnrySupply !== null && wbnrySupply !== undefined ? Number(ethers.utils.formatUnits(wbnrySupply, 8)).toFixed(1) : 'Loading...'}</p>
        <p>Staking Address: {stakingAddress}</p>
        <p>Total Staked: {totalStaked !== null && totalStaked !== undefined ? Number(ethers.utils.formatUnits(totalStaked, 8)).toFixed(1) : 'Loading...'}</p>
        <p>Total Stakers: {totalStakers}</p>
        <p>Total Treasury Tokens: {totalTreasuryTokens !== null && totalTreasuryTokens !== undefined ? Number(ethers.utils.formatUnits(totalTreasuryTokens, 8)).toFixed(1) : 'Loading...'}</p>
        <p>Annual Yield: {annualYield}%</p>
      </section>

      <hr /> {/* Line break to separate contract information and user information */}

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <h2>User Information</h2>
          <p><strong>Current account address: </strong>{account}</p>
          <p><strong>WBNRY Owned: </strong>{accountBalance}</p>
          <p><strong>WBNRY Staked: </strong>{directStakeAmountSatoshi}</p>
          {account && (
            <>
              <Form onSubmit={handleStake}>
                <Form.Group controlId="stakeAmount">
                  <Form.Label>Amount to Stake</Form.Label>
                  <Form.Control
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount to stake"
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  Stake WBNRY
                </Button>
              </Form>
              <Form onSubmit={handleWithdraw}>
                <Form.Group controlId="withdrawAmount" className="mt-3">
                  <Form.Label>Amount to Withdraw</Form.Label>
                  <Form.Control
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  Withdraw WBNRY
                </Button>
              </Form>
            </>
          )}
        </>
      )}
    </Container>
  );
}

export default App;
