// src/blockchainService.js
import {ethers} from "ethers";
import UNITY_ABI from "../abis/Unity.json";
import config from "../config.json";

export const TARGET_NETWORK_ID = "31337"; // Hardhat network ID

export const loadDefaultData = async (
  setDefaultProvider,
  setUnity,
  setTotalTokensLended,
  setIsLoading
) => {
  try {
    // Initiate default provider
    const defaultProvider = new ethers.providers.JsonRpcProvider(
      "http://127.0.0.1:8545"
    );
    setDefaultProvider(defaultProvider);

    // Fetch Chain ID
    const {chainId} = await defaultProvider.getNetwork();

    // Initiate contracts
    const Unity = new ethers.Contract(
      config[chainId].Unity.address,
      UNITY_ABI,
      defaultProvider
    );

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

export const loadUserData = async (
  setProvider,
  setAccount,
  setIsLoading,
  unity,
  setLoanAmountWei
) => {
  try {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    // Fetch Chain ID
    const {chainId} = await provider.getNetwork();

    if (chainId.toString() !== TARGET_NETWORK_ID) {
      alert(
        `Please connect to the correct network. Current Network ID: ${chainId}, Required Network ID: ${TARGET_NETWORK_ID}`
      );
      setIsLoading(false);
      return;
    }

    // Initiate accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
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

export const startNewLoan = async (provider, unity) => {
  try {
    const signer = provider.getSigner();
    const unityWithSigner = unity.connect(signer);
    const tx = await unityWithSigner.startNewLoan();
    await tx.wait();
    console.log("Loan started successfully.");
  } catch (error) {
    console.error("Error starting new loan:", error);
  }
};

export const connectWallet = async (setProvider, setAccount, setStatus) => {
  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    setStatus("connected");
  } catch (error) {
    if (error.code === -32002) {
      setStatus("alreadyProcessing");
    } else {
      console.error("Error connecting to wallet:", error);
      setStatus("error");
    }
  }
};
