import { ethers } from 'ethers';
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';
import { createVerifiableCredentialJwt, verifyCredential } from 'did-jwt-vc';

// Initialize ethers.js provider and signer
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Configure DID resolver with Infura project ID
const providerConfig = { rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID' };
const ethrDidResolver = getResolver(providerConfig);
const didResolver = new Resolver(ethrDidResolver);

export const createDID = async () => {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const account = accounts[0];
  const did = `did:ethr:${account}`;
  return did;
};

export const resolveDID = async (did) => {
  const resolvedDid = await didResolver.resolve(did);
  return resolvedDid;
};

export const createVerifiableCredential = async (did) => {
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

  const jwt = await createVerifiableCredentialJwt(vcPayload, {
    issuer: did,
    signer: async (data) => {
      const signature = await signer.signMessage(data);
      return signature;
    }
  });

  return jwt;
};

export const verifyVerifiableCredential = async (jwt) => {
  const verifiedCredential = await verifyCredential(jwt, didResolver);
  return verifiedCredential;
};
