import express from 'express';
import { createDID, resolveDID, createVerifiableCredential, verifyVerifiableCredential } from './didService';

const router = express.Router();

router.get('/create-did', async (req, res) => {
  try {
    const did = await createDID();
    res.json({ did });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/resolve-did/:did', async (req, res) => {
  try {
    const did = req.params.did;
    const resolvedDid = await resolveDID(did);
    res.json({ resolvedDid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-vc', async (req, res) => {
  try {
    const { did } = req.body;
    const jwt = await createVerifiableCredential(did);
    res.json({ jwt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-vc', async (req, res) => {
  try {
    const { jwt } = req.body;
    const verifiedCredential = await verifyVerifiableCredential(jwt);
    res.json({ verifiedCredential });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
