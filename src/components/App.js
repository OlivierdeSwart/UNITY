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
// ethodid
import {
  createDID,
  resolveDID,
  createVerifiableCredential,
  verifyVerifiableCredential,
  createVerifiablePresentation,
  verifyVerifiablePresentation,
} from "../ethodid/didService";

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

  //ethoids
  // ethodid
  const [did, setDid] = useState(null);
  const [vc, setVc] = useState(null);
  const [verifiedVc, setVerifiedVc] = useState(null);
  const [vp, setVp] = useState(null);
  const [verifiedVp, setVerifiedVp] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");

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

  const handleCreateDID = async () => {
    try {
      const newDid = await createDID();
      setDid(newDid);
      alert(`DID Created: ${newDid}`);
    } catch (error) {
      console.error("Error creating DID:", error);
      alert("Error creating DID");
    }
  };

  const handleResolveDID = async () => {
    try {
      const resolved = await resolveDID(did);
      console.log("Resolved DID:", resolved);
      alert(`DID Resolved: ${JSON.stringify(resolved)}`);
    } catch (error) {
      console.error("Error resolving DID:", error);
      alert("Error resolving DID");
    }
  };

  const handleCreateVC = async () => {
    try {
      if (!did) {
        alert("No DID found. Create a DID first.");
        return;
      }
      const jwt = await createVerifiableCredential(did);
      setVc(jwt);
      console.log("Verifiable Credential JWT:", jwt);
      alert("Verifiable Credential Created");
    } catch (error) {
      console.error("Error creating verifiable credential:", error.message);
      alert("Error creating verifiable credential");
    }
  };

  const handleVerifyVC = async () => {
    try {
      if (!vc) {
        alert(
          "No verifiable credential found. Create a verifiable credential first."
        );
        return;
      }
      const verified = await verifyVerifiableCredential(vc);
      setVerifiedVc(verified);
      console.log("Verified Credential:", verified);
      alert("Verifiable Credential Verified");
    } catch (error) {
      console.error("Error verifying verifiable credential:", error);
      alert("Error verifying verifiable credential");
    }
  };

  const handleCreateVP = async () => {
    try {
      if (!vc) {
        alert(
          "No verifiable credential found. Create a verifiable credential first."
        );
        return;
      }
      const vpJwt = await createVerifiablePresentation(vc);
      setVp(vpJwt);
      console.log("Verifiable Presentation JWT:", vpJwt);
      alert("Verifiable Presentation Created");
    } catch (error) {
      console.error("Error creating verifiable presentation:", error);
      alert("Error creating verifiable presentation");
    }
  };

  const handleVerifyVP = async () => {
    try {
      if (!vp) {
        alert(
          "No verifiable presentation found. Create a verifiable presentation first."
        );
        return;
      }
      const verifiedPresentation = await verifyVerifiablePresentation(vp);
      setVerifiedVp(verifiedPresentation);
      console.log("Verified Presentation:", verifiedPresentation);
      setVerificationMessage(
        "Decentralized Identity Verified: All credentials and claims are trusted and authenticated!"
      );
      alert(
        "Decentralized Identity Verified: All credentials and claims are trusted and authenticated!"
      );
    } catch (error) {
      console.error("Error verifying verifiable presentation:", error);
      alert("Error verifying verifiable presentation");
    }
  };
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
                  handleCreateDID={handleCreateDID}
                  handleResolveDID={handleResolveDID}
                  handleCreateVC={handleCreateVC}
                  handleVerifyVC={handleVerifyVC}
                  handleCreateVP={handleCreateVP}
                  handleVerifyVP={handleVerifyVP}
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
