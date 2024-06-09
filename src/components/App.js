// src/App.js
import { useEffect, useState } from 'react';
import { loadDefaultData, loadUserData, startNewLoan } from './blockchainServices';
import Navigation from './Navigation';
import UnityInfo from './UnityInfo';
import UserInfo from './UserInfo';
import HeroSection from './HeroSection';
import Footer from './Footer';
import '../index.css'; 
import sampleImage from '../coins.png';

function App() {
  const [defaultProvider, setDefaultProvider] = useState(null);
  const [provider, setProvider] = useState(null);
  const [unity, setUnity] = useState(null);
  const [account, setAccount] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // State variables for contract data
  const [totalTokensLended, setTotalTokensLended] = useState(null);
  const [loanAmountWei, setLoanAmountWei] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadDefaultData(setDefaultProvider, setUnity, setTotalTokensLended, setIsLoading);
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
      loadUserData(setProvider, setAccount, setIsLoading, unity, setLoanAmountWei);
    }
  }, [isLoading]);

  useEffect(() => {
    if (unity && account) {
      loadUserData(setProvider, setAccount, setIsLoading, unity, setLoanAmountWei);
    }
  }, [unity, account]);

  const handleStartNewLoan = async () => {
    if (provider && unity) {
      await startNewLoan(provider, unity);
      await loadUserData(setProvider, setAccount, setIsLoading, unity, setLoanAmountWei); // Refresh user data
    }
  };

  const footerOpacity = Math.min(scrollPosition / window.innerHeight, 1);

  return (
    <div>
      <Navigation />
      <HeroSection setScrollPosition={setScrollPosition} />
      <div id="content" className="pt-24 p-4 bg-gray-100 min-h-screen">
        <div className="container mx-auto flex flex-wrap lg:flex-nowrap h-full">
          <div className="w-full lg:w-1/2 p-4 flex flex-col">
            <div className="flex-1">
              <UnityInfo totalTokensLended={totalTokensLended} />
            </div>
            <div className="flex-1 mt-4 h-full">
              {account && <UserInfo account={account} loanAmountWei={loanAmountWei} startNewLoan={handleStartNewLoan} />}
            </div>
          </div>
          <div className="w-full lg:w-1/2 p-4 h-full">
            <img src={sampleImage} alt="Sample" className="w-full h-full object-cover rounded-lg shadow-md" />
          </div>
        </div>
      </div>
      <Footer opacity={footerOpacity} />
    </div>
  );
}

export default App;