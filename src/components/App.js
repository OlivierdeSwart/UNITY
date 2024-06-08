// src/App.js
import { useEffect, useState } from 'react';
import { loadDefaultData, loadUserData, TARGET_NETWORK_ID } from './blockchainServices';
import Navigation from './Navigation';
import UnityInfo from './UnityInfo';
import UserInfo from './UserInfo';
import HeroSection from './HeroSection';
import '../index.css'; 

function App() {
  const [defaultProvider, setDefaultProvider] = useState(null);
  const [provider, setProvider] = useState(null);
  const [unity, setUnity] = useState(null);
  const [account, setAccount] = useState(null);

  // State variables for contract data
  const [totalTokensLended, setTotalTokensLended] = useState(null);
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
      loadUserData(setProvider, setAccount, setIsLoading);
    }
  }, [isLoading]);

  return (
    <div>
      <Navigation />
      <HeroSection />
      <div id="content" className="pt-24 p-4 bg-gray-100 min-h-screen">
        <UnityInfo totalTokensLended={totalTokensLended} />
        <hr className="my-8" />
        {account && <UserInfo account={account} />}
      </div>
    </div>
  );
}

export default App;