import * as fs from 'fs';
import { Logger } from './logger';

export class ContentLoader {
    private cache: Map<string, any> = new Map();

    public loadJson<T>(path: string): T | null {
        if (this.cache.has(path)) {
            return this.cache.get(path) as T;
        }

        try {
            if (!fs.existsSync(path)) {
                Logger.error(`Content file not found: ${path}`);
                return null;
            }
            const content = fs.readFileSync(path, 'utf8');
            const data = JSON.parse(content);
            this.cache.set(path, data);
            Logger.info(`Loaded content from ${path}`);
            return data as T;
        } catch (e) {
            Logger.error(`Failed to load content from ${path}`, e as Error);
            return null;
        }
    }

    public clearCache(): void {
        this.cache.clear();
    }
}
