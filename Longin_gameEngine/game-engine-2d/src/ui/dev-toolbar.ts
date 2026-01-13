import { Engine } from '../core/engine';
import { Logger } from '../utils/logger';

/**
 * A floating developer toolbar that provides quick access to all engine tools.
 */
export class DevToolbar {
    private container: HTMLDivElement | null = null;
    private engine: Engine;
    private isVisible: boolean = true;
    private statsContainer: HTMLDivElement | null = null;
    private statsInterval: any = null;

    constructor(engine: Engine) {
        this.engine = engine;
        if (typeof document !== 'undefined') {
            this.injectStyles();
            this.setupUI();
            this.setupKeyboardListeners();
        }
    }

    private injectStyles(): void {
        const styleId = 'modern-ui-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
        :root {
          --primary-h: 220;
          --primary-s: 70%;
          --primary-l: 60%;
          --bg-h: 0; --bg-s: 0%; --bg-l: 10%;
          --accent-h: 280; --accent-s: 60%; --accent-l: 55%;
          --glass-bg: hsla(0, 0%, 15%, 0.7);
          --glass-border: hsla(0, 0%, 100%, 0.1);
          --glass-shadow: rgba(0, 0, 0, 0.5);
          --text-main: hsla(0, 0%, 100%, 0.9);
          --text-muted: hsla(0, 0%, 100%, 0.6);
          --transition-speed: 0.3s;
        }
        .modern-ui { font-family: sans-serif; color: var(--text-main); }
        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          box-shadow: 0 8px 32px 0 var(--glass-shadow);
        }
        .modern-btn {
          background: hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.2);
          border: 1px solid hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.4);
          color: var(--text-main); padding: 8px 16px; border-radius: 8px;
          cursor: pointer; font-weight: 500; transition: all var(--transition-speed) ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .modern-btn:hover {
          background: hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.4);
          box-shadow: 0 0 15px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.3);
          transform: translateY(-1px);
        }
        #dev-toolbar {
          position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 10px; padding: 8px; z-index: 99999;
          animation: fadeIn 0.3s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `;
        document.head.appendChild(style);
    }

    private setupUI(): void {
        this.container = document.createElement('div');
        this.container.id = 'dev-toolbar';
        this.container.className = 'glass-panel modern-ui fade-in';

        // Define tools
        const tools = [
            { id: 'menu', label: '🏠', title: 'Main Menu', action: () => this.engine.gameStateManager.switchState('Menu') },
            { id: 'map', label: '🗺️', title: 'Map Editor', action: () => this.toggleMapEditor() },
            { id: 'bt', label: '🧠', title: 'BT Editor', action: () => this.engine.toolManager.btEditor?.toggle() },
            { id: 'bt-debug', label: '🐞', title: 'BT Debugger', action: () => this.engine.btDebugger.toggle() },
            { id: 'sprites', label: '🎨', title: 'Sprite Editor', action: () => this.toggleSpriteEditor() },
            { id: 'anim', label: '🎞️', title: 'Animation Editor', action: () => this.engine.toolManager.animationEditor?.toggle() },
            { id: 'config', label: '⚙️', title: 'Config Editor', action: () => this.engine.configEditor.toggle() },
            { id: 'stats', label: '📈', title: 'Performance Stats', action: () => this.toggleStats() }
        ];

        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = 'modern-btn tool-btn';
            btn.innerHTML = tool.label;
            btn.title = tool.title;
            btn.onclick = (e) => {
                e.stopPropagation();
                tool.action();
            };
            this.container?.appendChild(btn);
        });

        document.body.appendChild(this.container);
    }

    private setupKeyboardListeners(): void {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F1' || e.key === '`') {
                this.toggleVisibility();
            }
        });
    }

    public toggleVisibility(): void {
        this.isVisible = !this.isVisible;
        if (this.container) {
            this.container.style.display = this.isVisible ? 'flex' : 'none';
        }
    }

    private toggleMapEditor(): void {
        const currentState = this.engine.gameStateManager.getCurrentState()?.name;
        if (currentState === 'Editor') {
            this.engine.gameStateManager.switchState('Menu');
        } else {
            this.engine.gameStateManager.switchState('Editor');
        }
    }

    private toggleSpriteEditor(): void {
        // Basic implementation for now
        this.engine.toolManager.spriteEditor?.toggle?.() ||
            this.engine.toolManager.startSpriteEditing(32, 32).toggle?.();
    }

    private toggleStats(): void {
        if (this.statsContainer) {
            document.body.removeChild(this.statsContainer);
            this.statsContainer = null;
            if (this.statsInterval) clearInterval(this.statsInterval);
            this.statsInterval = null;
            return;
        }

        this.statsContainer = document.createElement('div');
        this.statsContainer.className = 'glass-panel modern-ui fade-in';
        this.statsContainer.style.position = 'fixed';
        this.statsContainer.style.bottom = '10px';
        this.statsContainer.style.right = '10px';
        this.statsContainer.style.padding = '10px';
        this.statsContainer.style.fontSize = '12px';
        this.statsContainer.style.zIndex = '99999';
        this.statsContainer.style.pointerEvents = 'none';

        const updateStats = () => {
            if (!this.statsContainer) return;
            const fps = (this.engine.gameLoop as any).fps || 0;
            const memory = (performance as any).memory ?
                Math.round((performance as any).memory.usedJSHeapSize / 1048576) + ' MB' : 'N/A';

            this.statsContainer.innerHTML = `
            <div style="color: var(--text-muted)">Performance</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: ${fps > 55 ? '#4ade80' : '#f87171'}">${Math.round(fps)} FPS</div>
            <div style="margin-top: 5px;">Memory: ${memory}</div>
          `;
        };

        updateStats();
        this.statsInterval = setInterval(updateStats, 500);
        document.body.appendChild(this.statsContainer);
    }
}
```
