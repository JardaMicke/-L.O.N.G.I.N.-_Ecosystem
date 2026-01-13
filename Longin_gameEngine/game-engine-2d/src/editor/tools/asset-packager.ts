import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../utils/logger';

export class AssetPackager {
    private baseDir: string;

    constructor(baseDir: string = './assets') {
        this.baseDir = baseDir;
    }

    public bundleAssets(outputFile: string): void {
        Logger.info(`Bundling assets from ${this.baseDir}...`);

        const bundle: Record<string, any> = {};

        try {
            this.scanDirectory(this.baseDir, bundle);
            fs.writeFileSync(outputFile, JSON.stringify(bundle, null, 2));
            Logger.info(`Asset bundle created at ${outputFile}. Total items: ${Object.keys(bundle).length}`);
        } catch (e) {
            Logger.error('Failed to create asset bundle', e as Error);
        }
    }

    private scanDirectory(dir: string, bundle: Record<string, any>): void {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                this.scanDirectory(fullPath, bundle);
            } else {
                // Only bundle json/text files for now, or read binary as base64
                if (file.endsWith('.json')) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const relativePath = path.relative(this.baseDir, fullPath).replace(/\\/g, '/');
                    try {
                        bundle[relativePath] = JSON.parse(content);
                    } catch {
                        bundle[relativePath] = content; // Fallback
                    }
                }
            }
        }
    }
}
