import { ConfigManager } from '../core/config-manager';

export class ConfigEditor {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    // Only initialize UI in browser environment
    if (typeof document !== 'undefined') {
      this.container = document.createElement('div');
      this.setupUI();
      document.body.appendChild(this.container);
    } else {
      // Mock container for non-browser env
      this.container = {} as HTMLDivElement;
    }
  }

  toggle(): void {
    if (typeof document === 'undefined') return;
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';
    if (this.isVisible) {
      this.refresh();
    }
  }

  private setupUI(): void {
    this.container.className = 'glass-panel modern-ui fade-in';
    this.container.style.position = 'fixed';
    this.container.style.top = '60px'; // Below dev toolbar
    this.container.style.right = '10px';
    this.container.style.width = '350px';
    this.container.style.maxHeight = '80vh';
    this.container.style.overflowY = 'auto';
    this.container.style.padding = '20px';
    this.container.style.zIndex = '9999';
    this.container.style.display = 'none';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.borderBottom = '1px solid #444';
    header.style.paddingBottom = '10px';

    const title = document.createElement('h3');
    title.innerText = '⚙ Config Editor';
    title.style.margin = '0';
    title.style.fontSize = '16px';

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#fff';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.onclick = () => this.toggle();

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.container.appendChild(header);

    const controls = document.createElement('div');
    controls.style.marginBottom = '15px';
    controls.style.display = 'flex';
    controls.style.gap = '10px';

    const saveBtn = this.createButton('Save', '#4CAF50');
    saveBtn.onclick = () => {
      console.log('Config Saved:', JSON.stringify(this.configManager.getConfig(), null, 2));
      alert('Config saved!');
    };

    const backBtn = this.createButton('Back & Save', '#2196F3');
    backBtn.onclick = () => {
      // In a real app, this would persist to disk/server
      console.log('Config Saved and Closing:', JSON.stringify(this.configManager.getConfig(), null, 2));
      this.toggle();
    };

    const resetBtn = this.createButton('Reset Defaults', '#f44336');
    resetBtn.onclick = () => {
      if (confirm('Are you sure you want to reset all settings?')) {
        this.configManager.resetToDefaults();
        this.refresh();
      }
    };

    controls.appendChild(saveBtn);
    controls.appendChild(backBtn);
    controls.appendChild(resetBtn);
    this.container.appendChild(controls);

    const content = document.createElement('div');
    content.id = 'config-editor-content';
    this.container.appendChild(content);
  }

  private createButton(text: string, color: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.style.backgroundColor = color;
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '5px 10px';
    btn.style.borderRadius = '3px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '12px';
    return btn;
  }

  private refresh(): void {
    const content = this.container.querySelector('#config-editor-content');
    if (!content) return;
    content.innerHTML = '';

    const config = this.configManager.getConfig();
    this.renderObject(content as HTMLElement, config, '');
  }

  private renderObject(parent: HTMLElement, obj: any, path: string): void {
    for (const key in obj) {
      const fullPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      const wrapper = document.createElement('div');
      wrapper.style.marginLeft = '15px';
      wrapper.style.marginBottom = '8px';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';

      const label = document.createElement('span');
      label.innerText = key;
      label.style.minWidth = '120px';
      label.style.fontSize = '12px';
      label.style.color = '#aaa';
      wrapper.appendChild(label);

      if (typeof value === 'object' && value !== null) {
        label.style.fontWeight = 'bold';
        label.style.color = '#fff';
        label.style.marginBottom = '5px';
        const group = document.createElement('div');
        group.appendChild(label);
        parent.appendChild(group);

        const childrenContainer = document.createElement('div');
        childrenContainer.style.borderLeft = '1px solid #444';
        group.appendChild(childrenContainer);

        this.renderObject(childrenContainer, value, fullPath);
      } else {
        const input = document.createElement('input');
        input.style.backgroundColor = '#333';
        input.style.border = '1px solid #555';
        input.style.color = 'white';
        input.style.padding = '2px 5px';
        input.style.borderRadius = '3px';

        if (typeof value === 'boolean') {
          input.type = 'checkbox';
          input.checked = value;
          input.onchange = (e) => this.configManager.set(fullPath, (e.target as HTMLInputElement).checked);
        } else if (typeof value === 'number') {
          input.type = 'number';
          input.value = value.toString();
          input.style.width = '80px';
          input.onchange = (e) => this.configManager.set(fullPath, parseFloat((e.target as HTMLInputElement).value));
        } else {
          input.type = 'text';
          input.value = value.toString();
          input.style.width = '120px';
          input.onchange = (e) => this.configManager.set(fullPath, (e.target as HTMLInputElement).value);
        }

        wrapper.appendChild(input);
        parent.appendChild(wrapper);
      }
    }
  }
}
