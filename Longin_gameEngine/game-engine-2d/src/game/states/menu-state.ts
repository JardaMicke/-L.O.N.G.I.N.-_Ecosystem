import { Engine } from '../../core/engine';
import { State } from '../../core/game-state';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';
import { Logger } from '../../utils/logger';

export class MenuState implements State {
  public name: string = 'Menu';

  public onEnter(engine: Engine): void {
    Logger.info('Entering MenuState');

    // Create HTML overlay for menu
    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'menu-overlay';
    menuOverlay.className = 'modern-ui fade-in';
    menuOverlay.style.position = 'fixed';
    menuOverlay.style.top = '0';
    menuOverlay.style.left = '0';
    menuOverlay.style.width = '100%';
    menuOverlay.style.height = '100%';
    menuOverlay.style.display = 'flex';
    menuOverlay.style.flexDirection = 'column';
    menuOverlay.style.alignItems = 'center';
    menuOverlay.style.justifyContent = 'center';
    menuOverlay.style.gap = '20px';
    menuOverlay.style.background = 'radial-gradient(circle, rgba(20,20,30,0.8) 0%, rgba(10,10,15,0.95) 100%)';
    menuOverlay.style.zIndex = '1000';
    document.body.appendChild(menuOverlay);

    // Title
    const title = document.createElement('h1');
    title.textContent = 'L.O.N.G.I.N. ENGINE';
    title.style.fontSize = '4rem';
    title.style.margin = '0 0 40px 0';
    title.style.background = 'linear-gradient(to bottom, #fff, #888)';
    title.style.webkitBackgroundClip = 'text';
    title.style.webkitTextFillColor = 'transparent';
    title.style.textShadow = '0 10px 20px rgba(0,0,0,0.5)';
    menuOverlay.appendChild(title);

    const buttons = [
      { label: '🚀 Start Project', onClick: () => engine.gameStateManager.switchState('ProjectSelection') },
      { label: '⚙️ Settings', onClick: () => engine.configEditor.toggle() },
      { label: '🧠 AI Behavior Editor', onClick: () => engine.toolManager.btEditor?.toggle() },
      { label: '🗺️ Map Editor', onClick: () => engine.gameStateManager.switchState('Editor') },
      { label: '❌ Exit', onClick: () => window.close() }
    ];

    buttons.forEach((btnData, index) => {
      const btn = document.createElement('button');
      btn.className = 'glass-panel modern-btn';
      btn.textContent = btnData.label;
      btn.style.width = '280px';
      btn.style.height = '60px';
      btn.style.fontSize = '1.2rem';
      btn.style.animationDelay = `${index * 0.1}s`;
      btn.onclick = btnData.onClick;
      menuOverlay.appendChild(btn);
    });
  }

  public onExit(engine: Engine): void {
    Logger.info('Exiting MenuState');
    const overlay = document.getElementById('menu-overlay');
    if (overlay) document.body.removeChild(overlay);
    engine.uiManager.clear();
  }

  public onUpdate(engine: Engine, deltaTime: number): void {
    // Menu animations or logic here
  }

  public onRender(engine: Engine, interpolation: number): void {
    // Custom menu rendering if needed (beyond UI)
  }
}
