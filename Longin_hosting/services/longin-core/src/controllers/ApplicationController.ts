import { Request, Response } from 'express';
import { ApplicationService } from '../services/ApplicationService';

const applicationService = new ApplicationService();

export class ApplicationController {
  static async create(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const app = await applicationService.createApplication(userId, req.body);
      res.status(201).json(app);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async findAll(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const apps = await applicationService.findAllByUser(userId);
      res.json(apps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async findOne(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const app = await applicationService.findOne(req.params.id, userId);
      res.json(app);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const app = await applicationService.update(req.params.id, userId, req.body);
      res.json(app);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user.id;
      await applicationService.remove(req.params.id, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async validateUrl(req: Request, res: Response) {
    try {
      const { url, appId } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      const result = await applicationService.validateUrl(url, appId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
