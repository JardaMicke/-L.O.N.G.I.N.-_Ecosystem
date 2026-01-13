import { ResourceSystem, ResourceType } from '../../src/gameplay/resource-system';

describe('ResourceSystem', () => {
    let resources: ResourceSystem;

    beforeEach(() => {
        resources = new ResourceSystem();
    });

    it('should start with zero resources', () => {
        expect(resources.get(ResourceType.GOLD)).toBe(0);
    });

    it('should add resources correctly', () => {
        resources.add(ResourceType.GOLD, 100);
        expect(resources.get(ResourceType.GOLD)).toBe(100);
    });

    it('should cap resources at capacity', () => {
        resources.add(ResourceType.GOLD, 500); // Max is 200
        expect(resources.get(ResourceType.GOLD)).toBe(200);
    });

    it('should remove resources if available', () => {
        resources.add(ResourceType.WOOD, 50);
        const success = resources.remove(ResourceType.WOOD, 30);
        expect(success).toBe(true);
        expect(resources.get(ResourceType.WOOD)).toBe(20);
    });

    it('should fail to remove insufficient resources', () => {
        resources.add(ResourceType.WOOD, 10);
        const success = resources.remove(ResourceType.WOOD, 20);
        expect(success).toBe(false);
        expect(resources.get(ResourceType.WOOD)).toBe(10);
    });
});
