import * as fs from 'fs';
import { Logger } from './logger';
import { EventSystem } from '../core/event-system';

export class HotReloadWatcher {
    private watchers: fs.FSWatcher[] = [];
    private eventSystem: EventSystem;
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.eventSystem = EventSystem.getInstance();
    }

    public watch(path: string): void {
        if (!fs.existsSync(path)) {
            Logger.warn(`Cannot watch path ${path}: does not exist`);
            return;
        }

        Logger.info(`Watching ${path} for changes...`);

        const watcher = fs.watch(path, { recursive: true }, (eventType, filename) => {
            if (!filename) return;

            // Basic debounce to avoid double-firing
            const key = `${eventType}:${filename}`;
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key)!);
            }

            const timer = setTimeout(() => {
                Logger.info(`File changed: ${filename} (${eventType})`);
                this.eventSystem.emit('hot-reload:file-changed', { path, filename, eventType });
                this.debounceTimers.delete(key);
            }, 100);

            this.debounceTimers.set(key, timer);
        });

        this.watchers.push(watcher);
    }

    public stop(): void {
        for (const w of this.watchers) {
            w.close();
        }
        this.watchers = [];
        Logger.info('Stopped all file watchers');
    }
}
