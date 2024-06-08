import { ethers } from 'ethers';
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';
import { createVerifiableCredentialJwt, verifyCredential } from 'did-jwt-vc';
import { EthrDID } from 'ethr-did';

// Infura project ID and Issuer private key
const INFURA_PROJECT_ID = '9c97e763f8f34f20bad5bbc3bc4eabb1';
const ISSUER_PRIVATE_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

// Configure DID resolver with Infura project ID
const providerConfig = {
  networks: [
    {
      name: 'mainnet',
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
    }
  ]
};

const ethrDidResolver = getResolver(providerConfig);
const didResolver = new Resolver(ethrDidResolver);

// Create issuer object
const issuerWallet = new ethers.Wallet(ISSUER_PRIVATE_KEY);
const issuer = new EthrDID({
  identifier: issuerWallet.address,  // Ensure no double 0x prefix
  privateKey: ISSUER_PRIVATE_KEY.replace(/^0x/, '')  // Ensure no double 0x prefix
});

// Create a provider and signer for the issuer
const issuerProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);
const issuerDid = `did:ethr:${issuerWallet.address}`;

export const createDID = async () => {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available');
    }
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

export const createVerifiableCredential = async (holderDid) => {
  try {
    console.log('Starting to create verifiable credential');

    const vcPayload = {
      sub: holderDid,
      nbf: Math.floor(Date.now() / 1000),
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: {
          id: holderDid,
          name: 'Alice'
        }
      }
    };

    console.log('VC Payload created:', vcPayload);

    const jwt = await createVerifiableCredentialJwt(vcPayload, {
      did: issuerDid,
      alg: 'ES256K-R',
      signer: issuer.signer
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
