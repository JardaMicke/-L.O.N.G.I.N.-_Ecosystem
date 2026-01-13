import { Logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  lastModified: number;
  version: string;
}

export class ProjectManager {
  private static instance: ProjectManager;
  private projects: Project[] = [];
  private activeProject: Project | null = null;
  private readonly STORAGE_KEY = 'game_engine_projects';

  private constructor() {
    this.loadProjects();
  }

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  public getProjects(): Project[] {
    return this.projects;
  }

  public getActiveProject(): Project | null {
    return this.activeProject;
  }

  public setActiveProject(id: string): void {
    const project = this.projects.find(p => p.id === id);
    if (project) {
      this.activeProject = project;
      Logger.info(`Active project set to: ${project.name}`);
    } else {
      Logger.error(`Project with ID ${id} not found.`);
    }
  }

  public createProject(name: string, description: string = ''): Project {
    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      createdAt: Date.now(),
      lastModified: Date.now(),
      version: '0.0.1'
    };

    this.projects.push(newProject);
    this.saveProjects();
    Logger.info(`Project created: ${name}`);
    return newProject;
  }

  public updateProject(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): void {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects[index] = {
        ...this.projects[index],
        ...data,
        lastModified: Date.now()
      };
      this.saveProjects();
      Logger.info(`Project updated: ${this.projects[index].name}`);
    }
  }

  public deleteProject(id: string): void {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      const name = this.projects[index].name;
      this.projects.splice(index, 1);
      this.saveProjects();
      Logger.info(`Project deleted: ${name}`);
      
      if (this.activeProject?.id === id) {
        this.activeProject = null;
      }
    }
  }

  private loadProjects(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
          this.projects = JSON.parse(data);
        }
      }
    } catch (error) {
      Logger.error('Failed to load projects', error as Error);
    }

    // Ensure default RFM project exists
    if (this.projects.length === 0) {
        this.createDefaultProject();
    } else {
        // Check if RFM exists by name if list is not empty but might be missing it (unlikely given requirement "only one default on first run")
        // Actually requirement says "On first run, list must contain only one default project named RFM".
        // If I deleted it, it shouldn't come back unless I reset. 
        // But if projects is empty, I create it.
    }
  }

  private createDefaultProject(): void {
    const rfmProject: Project = {
        id: 'default-rfm',
        name: 'RFM',
        description: 'Default Project',
        createdAt: Date.now(),
        lastModified: Date.now(),
        version: '1.0.0'
    };
    this.projects.push(rfmProject);
    this.saveProjects();
    Logger.info('Default RFM project created.');
  }

  private saveProjects(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.projects));
      }
    } catch (error) {
      Logger.error('Failed to save projects', error as Error);
    }
  }
}
