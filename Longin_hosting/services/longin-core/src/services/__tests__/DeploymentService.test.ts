import { DeploymentService } from '../DeploymentService';
import { AppDataSource } from '../../config/database';
import { DockerService } from '../DockerService';

// Mock dependencies
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../DockerService');

describe('DeploymentService', () => {
  let deploymentService: DeploymentService;
  let mockDeploymentRepo: any;
  let mockApplicationRepo: any;
  let mockContainerRepo: any;
  let mockUserRepo: any;
  let mockDockerService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeploymentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };
    mockApplicationRepo = {
      findOne: jest.fn(),
    };
    mockContainerRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockUserRepo = {
      findOne: jest.fn(),
    };

    // Setup Repo Mocks
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity.name === 'Deployment') return mockDeploymentRepo;
      if (entity.name === 'Application') return mockApplicationRepo;
      if (entity.name === 'Container') return mockContainerRepo;
      if (entity.name === 'User') return mockUserRepo;
      return {};
    });

    // Mock DockerService
    mockDockerService = {
      createContainer: jest.fn(),
      startContainer: jest.fn(),
      stopContainer: jest.fn(),
    };
    (DockerService as jest.Mock).mockImplementation(() => mockDockerService);

    deploymentService = new DeploymentService();
  });

  describe('deployApplication', () => {
    const appId = 'app-id';
    const userId = 'user-id';
    const version = 'sha123';
    const config = { image: 'test-image', env: ['TEST=1'] };

    it('should deploy application successfully', async () => {
      // Mock App found
      const app = { id: appId, name: 'test-app', port: 3000 };
      mockApplicationRepo.findOne.mockResolvedValue(app);

      // Mock User found
      mockUserRepo.findOne.mockResolvedValue({ id: userId });

      // Mock Deployment creation
      const deployment: any = { id: 'deploy-id', logs: '', status: 'pending', deployment_log: '' };
      mockDeploymentRepo.create.mockReturnValue(deployment);
      mockDeploymentRepo.save.mockResolvedValue(deployment);

      // Mock Existing Container (none)
      mockContainerRepo.findOne.mockResolvedValue(null);

      // Mock Docker Creation
      mockDockerService.createContainer.mockResolvedValue({ id: 'docker-id' });

      // Mock Container Creation
      mockContainerRepo.create.mockReturnValue({ id: 'container-id' });

      await deploymentService.deployApplication(appId, userId, version, config);

      expect(mockApplicationRepo.findOne).toHaveBeenCalledWith({ where: { id: appId } });
      expect(mockDeploymentRepo.save).toHaveBeenCalled();
      expect(mockDockerService.createContainer).toHaveBeenCalledWith(
        'test-app-deploy-id',
        'test-image',
        ['TEST=1'],
        { '3000/tcp': [{ HostPort: '3000' }] }
      );
      expect(mockDockerService.startContainer).toHaveBeenCalledWith('docker-id');
      expect(deployment.status).toBe('success');
    });

    it('should stop existing running container before deploying new one', async () => {
      // Mock App
      mockApplicationRepo.findOne.mockResolvedValue({ id: appId, name: 'test-app', port: 3000 });
      mockDeploymentRepo.create.mockReturnValue({ id: 'deploy-id', logs: '', status: 'pending', deployment_log: '' });
      
      // Mock Existing Container
      const existingContainer = { 
        id: 'old-container-id', 
        docker_container_id: 'old-docker-id',
        status: 'running'
      };
      mockContainerRepo.findOne.mockResolvedValue(existingContainer);

      mockDockerService.createContainer.mockResolvedValue({ id: 'new-docker-id' });

      await deploymentService.deployApplication(appId, userId, version, config);

      expect(mockDockerService.stopContainer).toHaveBeenCalledWith('old-docker-id');
      expect(existingContainer.status).toBe('stopped');
      expect(mockContainerRepo.save).toHaveBeenCalledWith(existingContainer);
    });

    it('should handle deployment failure', async () => {
      mockApplicationRepo.findOne.mockResolvedValue({ id: appId });
      const deployment: any = { id: 'deploy-id', logs: '', status: 'pending', deployment_log: '' };
      mockDeploymentRepo.create.mockReturnValue(deployment);

      mockDockerService.createContainer.mockRejectedValue(new Error('Docker Error'));

      await expect(deploymentService.deployApplication(appId, userId, version, config))
        .rejects.toThrow('Docker Error');

      expect(deployment.status).toBe('failed');
      expect(mockDeploymentRepo.save).toHaveBeenCalledTimes(2); // Initial pending, then failed
    });
  });
});
