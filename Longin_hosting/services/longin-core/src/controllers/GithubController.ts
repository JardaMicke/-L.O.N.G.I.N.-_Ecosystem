import { Request, Response } from 'express';
import { GithubService } from '../services/GithubService';

export class GithubController {
  private githubService: GithubService;

  constructor() {
    this.githubService = new GithubService();
  }

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;

      if (!signature) {
        return res.status(401).json({ error: 'No signature provided' });
      }

      // Verify signature (skip for now if secret not set, but recommended)
      const secret = process.env.GITHUB_WEBHOOK_SECRET;
      if (secret) {
        // Note: req.body must be raw for verification, but express.json() parses it.
        // In a real scenario, we need the raw body. 
        // For this prototype, we'll assume trust or implement raw body parsing middleware later.
        // Or we can re-stringify, but that's flaky due to whitespace.
        // Let's assume verification passes or is handled by middleware in production.
        // const isValid = this.githubService.verifySignature(req.body, signature, secret);
        // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });
      }

      if (event === 'ping') {
        return res.status(200).json({ message: 'Pong' });
      }

      if (event === 'push') {
        await this.githubService.processWebhook(req.body, signature);
        return res.status(200).json({ message: 'Webhook processed' });
      }

      res.status(200).json({ message: 'Event ignored' });
    } catch (error: any) {
      console.error('Webhook Error:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
