// src/App.js
import {useEffect, useState} from "react";
import {
  loadDefaultData,
  loadUserData,
  startNewLoan,
  connectWallet,
} from "./blockchainServices";
import Navigation from "./Navigation";
import UnityInfo from "./UnityInfo";
import UserInfo from "./UserInfo";
import HeroSection from "./HeroSection";
import Footer from "./Footer";
import LoadingModal from "./LoadingModal";
import "../index.css";
import sampleImage from "../coins.png";

function App() {
  const [defaultProvider, setDefaultProvider] = useState(null);
  const [provider, setProvider] = useState(null);
  const [unity, setUnity] = useState(null);
  const [account, setAccount] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [status, setStatus] = useState("loading"); // 'loading', 'connected', 'alreadyProcessing', or 'error'
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // State variables for contract data
  const [totalTokensLended, setTotalTokensLended] = useState(null);
  const [loanAmountWei, setLoanAmountWei] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
          window.location.reload();
        });
        window.ethereum.on("accountsChanged", (accounts) => {
          if (accounts.length === 0) {
            // User has disconnected their wallet
            setAccount(null);
            setProvider(null);
            setUnity(null);
          } else {
            // User has switched accounts
            setAccount(accounts[0]);
            loadUserData(
              setProvider,
              setAccount,
              setIsLoading,
              unity,
              setLoanAmountWei
            );
          }
        });
      }
    };

    init();
  }, [unity]);

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
  }, [isLoading]);

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

  const handleStartNewLoan = async () => {
    if (provider && unity) {
      await startNewLoan(provider, unity);
      await loadUserData(
        setProvider,
        setAccount,
        setIsLoading,
        unity,
        setLoanAmountWei
      ); // Refresh user data
    }
  };

  const handleConnectWallet = async () => {
    setModalIsOpen(true);
    setStatus("loading");
    setIsButtonDisabled(true);
    await connectWallet(setProvider, setAccount, setStatus);
    setTimeout(() => {
      setModalIsOpen(false);
      setIsButtonDisabled(false);
    }, 2000); // Close modal after 2 seconds
  };

  const footerOpacity = Math.min(scrollPosition / window.innerHeight, 1);

  return (
    <div>
      <Navigation
        connectWallet={handleConnectWallet}
        isButtonDisabled={isButtonDisabled}
      />
      <HeroSection setScrollPosition={setScrollPosition} />
      <LoadingModal
        modalIsOpen={modalIsOpen}
        closeModal={() => setModalIsOpen(false)}
        status={status}
      />
      <div id="content" className="pt-24 p-4 bg-gray-100 min-h-screen">
        <div className="container mx-auto flex flex-wrap lg:flex-nowrap h-full">
          <div className="w-full lg:w-1/2 p-4 flex flex-col">
            <div className="flex-1">
              <UnityInfo totalTokensLended={totalTokensLended} />
            </div>
            <div className="flex-1 mt-4 h-full">
              {account && (
                <UserInfo
                  account={account}
                  loanAmountWei={loanAmountWei}
                  startNewLoan={handleStartNewLoan}
                />
              )}
            </div>
          </div>
          <div className="w-full lg:w-1/2 p-4 h-full">
            <img
              src={sampleImage}
              alt="Sample"
              className="w-full h-full object-cover rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>
      <Footer opacity={footerOpacity} />
    </div>
  );
}

export default App;
