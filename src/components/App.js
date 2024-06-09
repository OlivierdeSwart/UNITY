import {useEffect, useState} from "react";
import {Container} from "react-bootstrap";
import {ethers} from "ethers";
import {loadDefaultData, loadUserData} from "./BlockchainServices";

// Components
import Navigation from "./Navigation";

// ABIs
import UNITY_ABI from "../abis/Unity.json";

// Config
import config from "../config.json";

function App() {
  const [defaultProvider, setDefaultProvider] = useState(null);
  const [provider, setProvider] = useState(null);
  const [unity, setUnity] = useState(null);
  const [account, setAccount] = useState(null);

  // State variables for contract data
  const [totalTokensLended, setTotalTokensLended] = useState(null);
  const [loanAmountWei, setLoanAmountWei] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const TARGET_NETWORK_ID = "31337"; // Hardhat network ID

  useEffect(() => {
    const init = async () => {
      await loadDefaultData(
        setDefaultProvider,
        setUnity,
        setTotalTokensLended,
        setIsLoading
      );

      if (window.ethereum) {
        window.ethereum.on("chainChanged", () => {
          setIsLoading(true);
        });
        window.ethereum.on("accountsChanged", () => {
          setIsLoading(true);
        });
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (isLoading && window.ethereum) {
      loadUserData(
        setProvider,
        setAccount,
        setIsLoading,
        unity,
        setLoanAmountWei
      );
    }
  }, [isLoading, unity]);

  useEffect(() => {
    if (unity && account) {
      loadUserData(
        setProvider,
        setAccount,
        setIsLoading,
        unity,
        setLoanAmountWei
      );
    }
  }, [unity, account]);

  return (
    <Container>
      <Navigation />
      <h1 className="my-4 text-center">Introducing Unity!</h1>
      <section>
        <h2>Unity Lending Information</h2>
        <p>
          Unity totalTokensLended:{" "}
          {totalTokensLended !== null ? totalTokensLended : "Loading..."}
        </p>
      </section>
      <hr />{" "}
      {/* Line break to separate contract information and user information */}
      <section>
        <h2>User Information</h2>
        <p>User Address: {account !== null ? account : "Loading..."}</p>
        <p>
          Loan Amount:{" "}
          {loanAmountWei !== null ? `${loanAmountWei} ETH` : "Loading..."}
        </p>
      </section>
    </Container>
  );
}

export default App;
