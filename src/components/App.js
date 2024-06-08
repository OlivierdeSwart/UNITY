// src/App.js
import { useEffect, useState } from 'react';
import { loadDefaultData, loadUserData, TARGET_NETWORK_ID } from './blockchainServices';
import Navigation from './Navigation';
import UnityInfo from './UnityInfo';
import UserInfo from './UserInfo';
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
    <div className="p-4 bg-gray-200 min-h-screen">
      <Navigation />

      <UnityInfo totalTokensLended={totalTokensLended} />

      {account && <UserInfo account={account} />}
    </div>
  );
}

export default App;