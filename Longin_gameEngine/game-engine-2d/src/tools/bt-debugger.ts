import { BehaviorTreeRegistry } from '../ai/behavior-tree/behavior-tree-registry';
import { BehaviorTreeComponent } from '../ai/behavior-tree/behavior-tree-component';
import { BehaviorNode } from '../ai/behavior-tree/node';
import { CompositeNode } from '../ai/behavior-tree/nodes/composite/composite';
import { NodeStatus } from '../ai/behavior-tree/enums';

export class BTDebugger {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private updateInterval: any;

  constructor() {
    if (typeof document !== 'undefined') {
      this.container = document.createElement('div');
      this.setupUI();
      document.body.appendChild(this.container);
    } else {
      this.container = {} as HTMLDivElement;
    }
  }

  toggle(): void {
    if (typeof document === 'undefined') return;
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';

    if (this.isVisible) {
      this.updateInterval = setInterval(() => this.refresh(), 100);
    } else {
      if (this.updateInterval) clearInterval(this.updateInterval);
    }
  }

  private setupUI(): void {
    this.container.className = 'glass-panel modern-ui fade-in';
    this.container.style.position = 'fixed';
    this.container.style.top = '60px'; // Below dev toolbar
    this.container.style.left = '10px';
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
    header.style.borderBottom = '1px solid #556';
    header.style.paddingBottom = '10px';

    const title = document.createElement('h3');
    title.innerText = '🧠 BT Debugger';
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

    const content = document.createElement('div');
    content.id = 'bt-debugger-content';
    this.container.appendChild(content);
  }

  private refresh(): void {
    const content = this.container.querySelector('#bt-debugger-content');
    if (!content) return;
    content.innerHTML = '';

    const trees = BehaviorTreeRegistry.getAll();
    if (trees.length === 0) {
      content.innerHTML = '<div style="color: #888; font-style: italic;">No active Behavior Trees</div>';
      return;
    }

    for (const tree of trees) {
      const treeDiv = document.createElement('div');
      treeDiv.style.marginBottom = '20px';
      treeDiv.style.border = '1px solid #445';
      treeDiv.style.backgroundColor = 'rgba(0,0,0,0.2)';
      treeDiv.style.padding = '10px';
      treeDiv.style.borderRadius = '3px';

      const title = document.createElement('div');
      title.innerText = `${tree.treeName || tree.name}`;
      title.style.fontWeight = 'bold';
      title.style.color = '#aaa';
      title.style.fontSize = '12px';
      title.style.marginBottom = '10px';
      treeDiv.appendChild(title);

      const root = tree.getRoot();
      if (root) {
        this.renderNode(treeDiv, root);
      } else {
        const empty = document.createElement('div');
        empty.innerText = 'Empty Tree';
        empty.style.color = '#666';
        empty.style.fontStyle = 'italic';
        empty.style.fontSize = '12px';
        treeDiv.appendChild(empty);
      }
      content.appendChild(treeDiv);
    }
  }

  private renderNode(parent: HTMLElement, node: BehaviorNode): void {
    const nodeDiv = document.createElement('div');
    nodeDiv.style.marginLeft = '15px';
    nodeDiv.style.padding = '2px 0';
    nodeDiv.style.display = 'flex';
    nodeDiv.style.alignItems = 'center';

    const status = node.getStatus();
    let color = '#555';
    if (status === NodeStatus.SUCCESS) color = '#4CAF50';
    if (status === NodeStatus.FAILURE) color = '#f44336';
    if (status === NodeStatus.RUNNING) color = '#FFC107'; // Amber

    const indicator = document.createElement('div');
    indicator.style.width = '8px';
    indicator.style.height = '8px';
    indicator.style.borderRadius = '50%';
    indicator.style.backgroundColor = color;
    indicator.style.marginRight = '8px';
    indicator.style.boxShadow = `0 0 5px ${color}`;

    const text = document.createElement('span');
    text.innerText = `${node.name}`;
    text.style.fontSize = '12px';

    nodeDiv.appendChild(indicator);
    nodeDiv.appendChild(text);
    parent.appendChild(nodeDiv);

    if (node instanceof CompositeNode) {
      const children = node.getChildren();
      if (children && children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.style.borderLeft = '1px solid #444';
        childrenContainer.style.marginLeft = '3px'; // Visual connection
        childrenContainer.style.paddingLeft = '0';

        for (const child of children) {
          this.renderNode(childrenContainer, child);
        }
        parent.appendChild(childrenContainer);
      }
    }
  }
}
