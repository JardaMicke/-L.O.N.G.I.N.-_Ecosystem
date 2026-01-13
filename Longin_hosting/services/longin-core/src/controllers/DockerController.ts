import { Request, Response } from 'express';
import { DockerService } from '../services/DockerService';

export class DockerController {
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  listContainers = async (req: Request, res: Response) => {
    try {
      const all = req.query.all === 'true';
      const containers = await this.dockerService.listContainers(all);
      res.json(containers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getContainer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const container = await this.dockerService.getContainer(id);
      res.json(container);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  startContainer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.dockerService.startContainer(id);
      res.json({ message: `Container ${id} started` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  stopContainer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.dockerService.stopContainer(id);
      res.json({ message: `Container ${id} stopped` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  restartContainer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.dockerService.restartContainer(id);
      res.json({ message: `Container ${id} restarted` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getLogs = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tail = req.query.tail ? parseInt(req.query.tail as string) : 100;
      const logs = await this.dockerService.getContainerLogs(id, tail);
      res.json({ logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getStats = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stats = await this.dockerService.getContainerStats(id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
