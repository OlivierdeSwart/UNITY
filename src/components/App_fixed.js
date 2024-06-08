import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { ethers } from 'ethers';

// Components
import Navigation from './Navigation';

// ABIs
import UNITY_ABI from '../abis/Unity.json';

// Config
import config from '../config.json';

function App() {
  const [defaultProvider, setDefaultProvider] = useState(null);
  const [provider, setProvider] = useState(null);
  const [unity, setUnity] = useState(null);
  const [account, setAccount] = useState(null);

  // State variables for contract data
  const [totalTokensLended, setTotalTokensLended] = useState(null);
  const [loanAmountWei, setLoanAmountWei] = useState(null);
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
      const Unity = new ethers.Contract(config[chainId].Unity.address, UNITY_ABI, defaultProvider);

      // Fetch contract information and update state
      const totalTokensLended = await Unity.totalTokensLended();
      setTotalTokensLended(ethers.utils.formatUnits(totalTokensLended, 18)); // Assuming totalTokensLended is in wei

      // Set the contract instance to state
      setUnity(Unity);

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading default data:", error);
      setIsLoading(false);
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

      // Initiate accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);

      // Fetch the loan amount for the user if unity contract is set
      if (unity) {
        const participant = await unity.customerMapping(account);
        console.log("Fetched participant data:", participant); // Debugging line
        setLoanAmountWei(ethers.utils.formatUnits(participant.loanAmountWei, 18)); // Assuming loanAmountWei is in wei
      } else {
        console.error("Unity contract is not set");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsLoading(false);
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
    };

    init();
  }, []);

  useEffect(() => {
    if (isLoading && window.ethereum) {
      loadUserData();
    }
  }, [isLoading]);

  useEffect(() => {
    if (unity && account) {
      loadUserData();
    }
  }, [unity, account]);

  return (
    <Container>
      <Navigation />
      <h1 className='my-4 text-center'>Introducing Unity!</h1>

      <section>
        <h2>Unity Lending Information</h2>
        <p>Unity totalTokensLended: {totalTokensLended !== null ? totalTokensLended : 'Loading...'}</p>
      </section>

      <hr /> {/* Line break to separate contract information and user information */}

      <section>
        <h2>User Information</h2>
        <p>User Address: {account !== null ? account : 'Loading...'}</p>
        <p>Loan Amount: {loanAmountWei !== null ? `${loanAmountWei} ETH` : 'Loading...'}</p>
      </section>
    </Container>
  );
}

export default App;