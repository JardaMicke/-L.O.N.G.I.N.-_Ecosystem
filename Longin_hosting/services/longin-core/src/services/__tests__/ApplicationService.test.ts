import { ApplicationService } from '../ApplicationService';
import { AppDataSource } from '../../config/database';
import { Application } from '../../entities/Application.entity';

// Mock dependencies
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ApplicationService', () => {
  let applicationService: ApplicationService;
  let mockApplicationRepo: any;
  let mockUserRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApplicationRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    mockUserRepo = {
      findOne: jest.fn(),
    };

    // Setup Repo Mocks
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity.name === 'Application') return mockApplicationRepo;
      if (entity.name === 'User') return mockUserRepo;
      return {};
    });

    applicationService = new ApplicationService();
  });

  describe('createApplication', () => {
    const userId = 'user-uuid';
    const appData = { name: 'My App' };

    it('should create an application successfully', async () => {
      // Mock User found
      mockUserRepo.findOne.mockResolvedValue({ id: userId });

      // Mock Slug availability (first try available)
      mockApplicationRepo.findOne.mockResolvedValue(null);

      // Mock Port availability (none used)
      mockApplicationRepo.find.mockResolvedValue([]);

      // Mock Create/Save
      const createdApp = { ...appData, id: 'app-uuid', port: 3100, slug: 'my-app' };
      mockApplicationRepo.create.mockReturnValue(createdApp);
      mockApplicationRepo.save.mockResolvedValue(createdApp);

      const result = await applicationService.createApplication(userId, appData);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockApplicationRepo.findOne).toHaveBeenCalledWith({ where: { slug: 'my-app' } });
      expect(mockApplicationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My App',
        slug: 'my-app',
        port: 3100,
        status: 'stopped'
      }));
      expect(result).toEqual(createdApp);
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(applicationService.createApplication(userId, appData))
        .rejects.toThrow('User not found');
    });

    it('should handle slug collision', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: userId });

      // First slug exists, second available
      mockApplicationRepo.findOne
        .mockResolvedValueOnce({ id: 'existing' }) // 'my-app' taken
        .mockResolvedValueOnce(null); // 'my-app-1' available

      mockApplicationRepo.find.mockResolvedValue([]);
      
      const createdApp = { ...appData, slug: 'my-app-1', port: 3100 };
      mockApplicationRepo.create.mockReturnValue(createdApp);
      mockApplicationRepo.save.mockResolvedValue(createdApp);

      await applicationService.createApplication(userId, appData);

      expect(mockApplicationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        slug: 'my-app-1'
      }));
    });

    it('should allocate next available port', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: userId });
      mockApplicationRepo.findOne.mockResolvedValue(null);

      // Port 3100 is taken
      mockApplicationRepo.find.mockResolvedValue([{ port: 3100 }]);

      const createdApp = { ...appData, port: 3101 };
      mockApplicationRepo.create.mockReturnValue(createdApp);
      mockApplicationRepo.save.mockResolvedValue(createdApp);

      await applicationService.createApplication(userId, appData);

      expect(mockApplicationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        port: 3101
      }));
    });
  });

  describe('findAllByUser', () => {
    it('should return user applications', async () => {
      const apps = [{ id: '1' }, { id: '2' }];
      mockApplicationRepo.find.mockResolvedValue(apps);

      const result = await applicationService.findAllByUser('user-1');

      expect(mockApplicationRepo.find).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        order: { created_at: 'DESC' },
        relations: ['containers', 'deployments'],
      });
      expect(result).toEqual(apps);
    });
  });

  describe('findOne', () => {
    it('should return application if found and owned by user', async () => {
      const app = { id: 'app-1', user_id: 'user-1' };
      mockApplicationRepo.findOne.mockResolvedValue(app);

      const result = await applicationService.findOne('app-1', 'user-1');

      expect(result).toEqual(app);
    });

    it('should throw error if application not found', async () => {
      mockApplicationRepo.findOne.mockResolvedValue(null);

      await expect(applicationService.findOne('app-1', 'user-1'))
        .rejects.toThrow('Application not found');
    });
  });
});
