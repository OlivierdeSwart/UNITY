import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { ethers } from 'ethers';

// Components
import Navigation from './Navigation';
import Info from './Info';
import Loading from './Loading';
import Progress from './Progress';
import Buy from './Buy';

// ABIs
import TOKEN_ABI from '../abis/Token.json'
import CROWDSALE_ABI from '../abis/Crowdsale.json'

// Config
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [crowdsale, setCrowdsale] = useState(null)

  const [account, setAccount] = useState(null)
  const [accountBalance, setAccountBalance] = useState(0)


  const [price, setPrice] = useState(0)
  const [maxTokens, setMaxTokens] = useState(0)
  const [tokensSold, setTokensSold] = useState(0)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    //initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // Fetch Chain ID
    const { chainId } = await provider.getNetwork()

    console.log('test')
    console.log(provider)
    console.log(chainId)
    // console.log([config[chainId].token.address])
    // console.log([provider])

    //initiate contracts
    const token = new ethers.Contract(config[chainId].token.address,TOKEN_ABI,provider)
    const crowdsale = new ethers.Contract(config[chainId].crowdsale.address,CROWDSALE_ABI,provider)
    setCrowdsale(crowdsale)

    //initiate accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    //fetch account balance
    const accountBalance = ethers.utils.formatUnits(await token.balanceOf(account), 18)
    setAccountBalance(accountBalance)

    const price = ethers.utils.formatUnits(await crowdsale.price(), 18)
    setPrice(price)
    const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18)
    setMaxTokens(maxTokens)
    const tokensSold = ethers.utils.formatUnits(await crowdsale.tokensSold(), 18)
    setTokensSold(tokensSold)

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading])

  return (
    <Container>
      <Navigation />

      <h1 className='my-4 text-center'>Introducing DApp Token!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <p className='text-center'><strong>Current Price:</strong> {price} ETH</p>
          <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
          <Buy provider={provider} price={price} crowdsale={crowdsale} setIsLoading={setIsLoading} />
        </>
      )}

      <hr />

      {account && (
        <Info account={account} accountBalance={accountBalance} />
      )}
    </Container>
  );
}

export default App;
