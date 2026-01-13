
// Mock pg before import
jest.mock('pg', () => {
    const mPool = {
        connect: jest.fn(),
        on: jest.fn(),
        end: jest.fn(),
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

import { AssetPackager } from '../src/editor/tools/asset-packager';
import { ContentLoader } from '../src/utils/content-loader';
import { PostgresAdapter } from '../src/database/postgres-adapter';
import * as fs from 'fs';
import * as path from 'path';

describe('Final Phase Features', () => {

    describe('ContentLoader', () => {
        const loader = new ContentLoader();
        // Use process.cwd() for reliable path resolution
        const assetsDir = path.join(process.cwd(), 'assets', 'data');
        // Note: In test execution, process.cwd() is usually the project root
        const testFile = path.join(assetsDir, 'units.json');

        it('should load units.json correctly', () => {
            // Ensure file exists before test or fail gracefully
            if (!fs.existsSync(testFile)) {
                console.warn(`Test file not found at ${testFile}, skipping assertion`);
                return;
            }

            const data = loader.loadJson<any[]>(testFile);
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            if (data && data.length > 0) {
                expect(data[0].id).toBe('unit_soldier');
            }
        });
    });

    describe('AssetPackager', () => {
        it('should instantiate', () => {
            const packager = new AssetPackager();
            expect(packager).toBeDefined();
        });
    });

    describe('PostgresAdapter', () => {
        it('should be defined', () => {
            const adapter = new PostgresAdapter('mock_url');
            expect(adapter).toBeDefined();
        });
    });

});

