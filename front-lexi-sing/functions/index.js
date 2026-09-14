import { onRequest } from 'firebase-functions/v2/https';
import { reqHandler } from './server/server.mjs';

export const ssr = onRequest(
  { maxInstances: 10, region: 'us-central1' },
  async (req, res) => {
    await reqHandler(req, res);
  }
);