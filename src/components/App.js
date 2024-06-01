import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { ethers } from 'ethers';

// Components
import Navigation from './Navigation';
import Loading from './Loading';
// import StakingForm from './StakingForm';

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

  const [isLoading, setIsLoading] = useState(true);

  const TARGET_NETWORK_ID = '31337'; // Hardhat network ID

  const loadDefaultData = async () => {
    // Initiate default provider (Infura, Alchemy, etc.)
    const defaultProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    setDefaultProvider(defaultProvider);

    // Fetch Chain ID
    const { chainId } = await defaultProvider.getNetwork();

    // Initiate contracts: uses ethers library to construct a smart contract abstraction. Combines chainid, provider (http://127.0.0.1:8545), 
    // address, and ABI
    const WBNRY = new ethers.Contract(config[chainId].WBNRY.address, WBNRY_ABI, defaultProvider);
    const Staking = new ethers.Contract(config[chainId].Staking.address, STAKING_ABI, defaultProvider);

    // Fetch contract information and update state
    setWBNRYAddress(WBNRY.address);
    setWBNRYName(await WBNRY.name());
    setWBNRYSupply(ethers.utils.formatUnits(await WBNRY.totalSupply(), 8));
    setStakingAddress(Staking.address);
    setTotalStaked(ethers.utils.formatUnits(await Staking.totalTokensStaked(), 8));
    setTotalStakers((await Staking.totalStakers()).toNumber());
    setTotalTreasuryTokens((await Staking.totalTreasuryTokens()).toString());
    setAnnualYield((await Staking.annualYield()).toString());

    // Set the contract instances to state
    setStaking(Staking);
    setWBNRY(WBNRY);
  };

  const loadUserData = async () => {
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

    // Initiate accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);

    // Fetch account balance
    setAccountBalance(ethers.utils.formatUnits(await WBNRY.balanceOf(account), 8));

    setIsLoading(false);
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
        <p>WBNRY Total Circulation: {wbnrySupply}</p>
        <p>Staking Address: {stakingAddress}</p>
        <p>Total Staked: {totalStaked}</p>
        <p>WBNRY Total Stakers: {totalStakers}</p>
        <p>Total Treasury Tokens: {totalTreasuryTokens}</p>
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
        </>
      )}
    </Container>
  );
}

export default App;
