import { Logger } from '../utils/logger';

export interface Plugin {
    name: string;
    version: string;
    onLoad(): void;
    onUnload(): void;
}

export class PluginLoader {
    private plugins: Map<string, Plugin> = new Map();

    public async loadPlugin(path: string): Promise<void> {
        Logger.info(`Loading plugin from ${path}...`);
        try {
            // Using Function constructor to avoid webpack static analysis issues in some setups, 
            // or just standard dynamic import if environment supports it.
            // For node env: output is commonjs, require is available.

            // @ts-ignore
            const module = __non_webpack_require__ ? __non_webpack_require__(path) : await import(path);

            const PluginClass = module.default || module;
            if (PluginClass && typeof PluginClass === 'function') {
                const plugin = new PluginClass();
                this.register(plugin);
            } else {
                Logger.error(`Plugin at ${path} does not export a default class.`);
            }
        } catch (e) {
            Logger.error(`Failed to load plugin from ${path}`, e as Error);
        }
    }

    public register(plugin: Plugin): void {
        if (this.plugins.has(plugin.name)) {
            Logger.warn(`Plugin ${plugin.name} already loaded.`);
            return;
        }

        this.plugins.set(plugin.name, plugin);
        plugin.onLoad();
        Logger.info(`Plugin ${plugin.name} v${plugin.version} loaded.`);
    }

    public unload(name: string): void {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.onUnload();
            this.plugins.delete(name);
            Logger.info(`Plugin ${name} unloaded.`);
        }
    }
}
