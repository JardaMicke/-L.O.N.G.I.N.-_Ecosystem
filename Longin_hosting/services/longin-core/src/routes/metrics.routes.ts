import { Router } from 'express';
import client from 'prom-client';

export const metricsRouter = Router();

// Enable collection of default metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

metricsRouter.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  try {
      const metrics = await client.register.metrics();
      res.end(metrics);
  } catch (ex) {
      res.status(500).end(ex);
  }
});
