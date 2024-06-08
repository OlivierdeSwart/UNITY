import { ethers } from 'ethers';
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';
import { createVerifiableCredentialJwt, verifyCredential } from 'did-jwt-vc';

// Configure DID resolver with Infura project ID
const providerConfig = {
  networks: [
    {
      name: "mainnet",
      rpcUrl: "https://mainnet.infura.io/v3/9c97e763f8f34f20bad5bbc3bc4eabb1"
    }
  ]
};

const ethrDidResolver = getResolver(providerConfig);
const didResolver = new Resolver(ethrDidResolver);

export const createDID = async () => {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    const did = `did:ethr:${account}`;
    return did;
  } catch (error) {
    console.error('Error creating DID:', error);
    throw new Error('Error creating DID');
  }
};

export const resolveDID = async (did) => {
  try {
    const resolvedDid = await didResolver.resolve(did);
    return resolvedDid;
  } catch (error) {
    console.error('Error resolving DID:', error);
    throw new Error('Error resolving DID');
  }
};

export const createVerifiableCredential = async (did) => {
  try {
    console.log('Starting to create verifiable credential');

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log('Accounts obtained:', accounts);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log('Provider initialized');

    const signer = provider.getSigner();
    console.log('Signer obtained:', signer);

    const vcPayload = {
      sub: did,
      nbf: Math.floor(Date.now() / 1000),
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: {
          id: did,
          name: 'Alice'
        }
      }
    };

    console.log('VC Payload created:', vcPayload);

    const jwt = await createVerifiableCredentialJwt(vcPayload, {
      issuer: did,
      signer: async (data) => {
        console.log('Signing data:', data);
        const signature = await signer.signMessage(data);
        console.log('Data signed:', signature);
        return signature;
      }
    });

    console.log('JWT created:', jwt);
    return jwt;
  } catch (error) {
    console.error('Error creating verifiable credential:', error.message);
    console.error('Error details:', error);
    throw new Error('Error creating verifiable credential');
  }
};

export const verifyVerifiableCredential = async (jwt) => {
  try {
    const verifiedCredential = await verifyCredential(jwt, didResolver);
    return verifiedCredential;
  } catch (error) {
    console.error('Error verifying verifiable credential:', error);
    throw new Error('Error verifying verifiable credential');
  }
};

