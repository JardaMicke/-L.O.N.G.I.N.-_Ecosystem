import { BehaviorTreeComponent } from '../ai/behavior-tree/behavior-tree-component';
import { Entity } from '../ecs/entity';
import { Logger } from '../utils/logger';
import { BehaviorNode, NodeDefinition } from '../ai/behavior-tree/node';
import { CompositeNode } from '../ai/behavior-tree/nodes/composite/composite';
import { BehaviorTreeBuilder } from '../ai/behavior-tree/builder';
import { NodeRegistry } from '../ai/behavior-tree/node-registry';
import { NodeStatus } from '../ai/behavior-tree/enums';

export class BTEditor {
    private container: HTMLDivElement;
    private isVisible: boolean = false;
    private selectedEntity: Entity | null = null;
    private selectedNode: BehaviorNode | null = null;
    private clipboardNode: NodeDefinition | null = null;
    private propertiesPanel: HTMLDivElement | null = null;
    private treeView: HTMLDivElement | null = null;
    private libraryPanel: HTMLDivElement | null = null;
    private updateLoopId: number | null = null;

    // Drag and Drop state
    private draggedNode: BehaviorNode | null = null;
    private dragTarget: BehaviorNode | null = null;

    constructor() {
        if (typeof document !== 'undefined') {
            this.container = document.createElement('div');
            this.setupUI();
            document.body.appendChild(this.container);
        } else {
            this.container = {} as HTMLDivElement;
        }
    }

    public toggle(): void {
        if (typeof document === 'undefined') return;
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'flex' : 'none';

        if (this.isVisible) {
            this.refresh();
            this.startUpdateLoop();
        } else {
            this.stopUpdateLoop();
        }
    }

    public selectEntity(entity: Entity): void {
        this.selectedEntity = entity;
        this.selectedNode = null;
        if (this.isVisible) {
            this.refresh();
        }
    }

    private startUpdateLoop(): void {
        if (this.updateLoopId !== null) return;

        const loop = () => {
            if (this.isVisible) {
                this.updateStatus();
                this.updateLoopId = requestAnimationFrame(loop);
            }
        };
        this.updateLoopId = requestAnimationFrame(loop);
    }

    private stopUpdateLoop(): void {
        if (this.updateLoopId !== null) {
            cancelAnimationFrame(this.updateLoopId);
            this.updateLoopId = null;
        }
    }

    private setupUI(): void {
        this.container.className = 'glass-panel modern-ui fade-in';
        this.container.style.position = 'fixed';
        this.container.style.top = '60px'; // Below dev toolbar
        this.container.style.left = '50px';
        this.container.style.width = '1000px';
        this.container.style.height = '700px';
        this.container.style.zIndex = '10000';
        this.container.style.display = 'none';
        this.container.style.padding = '20px';
        this.container.style.flexDirection = 'column';
        this.container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.borderBottom = '1px solid #555';
        header.style.paddingBottom = '5px';
        header.style.marginBottom = '10px';

        const title = document.createElement('h3');
        title.innerText = 'Behavior Tree Editor';
        title.style.margin = '0';

        const controls = document.createElement('div');

        const validateBtn = this.createButton('Validate', () => this.validateTree());
        controls.appendChild(validateBtn);

        const exportBtn = this.createButton('Export JSON', () => this.exportToJson());
        controls.appendChild(exportBtn);

        const loadJsonBtn = this.createButton('Import JSON', () => this.loadFromJson());
        controls.appendChild(loadJsonBtn);

        const refreshBtn = this.createButton('Refresh', () => this.refresh());
        controls.appendChild(refreshBtn);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'X';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#fff';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '16px';
        closeBtn.onclick = () => this.toggle();
        controls.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(controls);
        this.container.appendChild(header);

        // Main Layout
        const mainLayout = document.createElement('div');
        mainLayout.style.display = 'flex';
        mainLayout.style.flex = '1';
        mainLayout.style.overflow = 'hidden';
        this.container.appendChild(mainLayout);

        // Library Panel (NEW)
        this.libraryPanel = document.createElement('div');
        this.libraryPanel.id = 'bt-editor-library';
        this.libraryPanel.style.flex = '0 0 200px';
        this.libraryPanel.style.borderRight = '1px solid #555';
        this.libraryPanel.style.padding = '10px';
        this.libraryPanel.style.overflowY = 'auto';
        this.libraryPanel.style.backgroundColor = '#2a2a2a';
        mainLayout.appendChild(this.libraryPanel);

        // Tree View
        this.treeView = document.createElement('div');
        this.treeView.id = 'bt-editor-tree';
        this.treeView.style.flex = '2';
        this.treeView.style.overflow = 'auto';
        this.treeView.style.position = 'relative';
        this.treeView.style.borderRight = '1px solid #555';
        this.treeView.style.padding = '10px';
        this.treeView.style.display = 'flex';
        this.treeView.style.justifyContent = 'center';
        mainLayout.appendChild(this.treeView);

        // Properties Panel
        this.propertiesPanel = document.createElement('div');
        this.propertiesPanel.id = 'bt-editor-props';
        this.propertiesPanel.style.flex = '1';
        this.propertiesPanel.style.padding = '10px';
        this.propertiesPanel.style.overflowY = 'auto';
        this.propertiesPanel.style.backgroundColor = '#252525';
        mainLayout.appendChild(this.propertiesPanel);
    }

    private createButton(text: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.className = 'modern-btn';
        btn.innerText = text;
        btn.style.marginRight = '10px';
        btn.style.padding = '4px 12px';
        btn.style.fontSize = '12px';
        btn.onclick = onClick;
        return btn;
    }

    private refresh(): void {
        if (!this.treeView) return;
        this.treeView.innerHTML = '';

        this.updatePropertiesPanel();
        this.updateLibraryPanel();

        if (!this.selectedEntity) {
            this.treeView.innerHTML = '<p style="padding: 20px; text-align: center;">No entity selected.</p>';
            return;
        }

        const btComponent = this.selectedEntity.getComponent<BehaviorTreeComponent>('BehaviorTree');
        if (!btComponent) {
            this.treeView.innerHTML = '<div style="padding: 20px; text-align: center;"><p>Selected entity has no BehaviorTree component.</p><button id="btn-add-bt">Add Behavior Tree</button></div>';
            const addBtn = this.treeView.querySelector('#btn-add-bt') as HTMLButtonElement;
            if (addBtn) {
                addBtn.onclick = () => {
                    // Create a default empty tree
                    const def = { name: 'New Tree', root: { type: 'Sequence' } };
                    const tree = BehaviorTreeBuilder.build(def);
                    const comp = new BehaviorTreeComponent(tree);
                    this.selectedEntity!.addComponent(comp);
                    this.refresh();
                };
            }
            return;
        }

        if (btComponent.root) {
            const treeContainer = document.createElement('div');
            treeContainer.style.display = 'flex';
            treeContainer.style.flexDirection = 'column';
            treeContainer.style.alignItems = 'center';

            this.renderTree(btComponent.root, treeContainer);
            this.treeView.appendChild(treeContainer);
        } else {
            this.treeView.innerHTML = '<p>Behavior Tree is empty.</p>';
        }
    }

    private renderTree(node: BehaviorNode, container: HTMLElement): void {
        const nodeWrapper = document.createElement('div');
        nodeWrapper.style.display = 'flex';
        nodeWrapper.style.flexDirection = 'column';
        nodeWrapper.style.alignItems = 'center';
        nodeWrapper.style.margin = '0 10px';

        const nodeEl = document.createElement('div');
        nodeEl.className = 'bt-node';
        nodeEl.dataset.nodeId = node.name; // Use name as ID for now (weakness: duplicate names)
        // Ideally we need a unique ID on nodes. BehaviorNode doesn't have UUID.
        // We can map node instance to element using Map.
        (nodeEl as any)._nodeInstance = node;

        nodeEl.style.padding = '8px 12px';
        nodeEl.style.margin = '5px';
        nodeEl.style.border = this.selectedNode === node ? '2px solid #2196F3' : '1px solid #888';
        nodeEl.style.borderRadius = '5px';
        nodeEl.style.backgroundColor = '#444';
        nodeEl.style.minWidth = '100px';
        nodeEl.style.textAlign = 'center';
        nodeEl.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
        nodeEl.style.cursor = 'pointer';

        // Drag and Drop
        nodeEl.draggable = true;
        nodeEl.addEventListener('dragstart', (e) => this.handleDragStart(e, node));
        nodeEl.addEventListener('dragover', (e) => this.handleDragOver(e, node));
        nodeEl.addEventListener('dragleave', (e) => this.handleDragLeave(e, node));
        nodeEl.addEventListener('drop', (e) => this.handleDrop(e, node));

        nodeEl.onclick = (e) => {
            e.stopPropagation();
            this.selectedNode = node;
            this.refresh();
        };

        const nameEl = document.createElement('div');
        nameEl.innerText = `${node.name}`;
        nameEl.style.fontWeight = 'bold';
        nameEl.style.marginBottom = '5px';
        nameEl.style.fontSize = '14px';
        nodeEl.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.innerText = `(${node.constructor.name})`;
        typeEl.style.fontSize = '10px';
        typeEl.style.color = '#aaa';
        typeEl.style.marginBottom = '5px';
        nodeEl.appendChild(typeEl);

        const statusEl = document.createElement('div');
        statusEl.className = 'node-status';
        const status = node.getStatus();
        statusEl.innerText = status;
        statusEl.style.fontSize = '12px';
        statusEl.style.fontWeight = 'bold';
        this.setNodeStatusColor(statusEl, status);

        nodeEl.appendChild(statusEl);

        nodeWrapper.appendChild(nodeEl);
        container.appendChild(nodeWrapper);

        if (node instanceof CompositeNode) {
            const children = node.getChildren();
            if (children.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.style.display = 'flex';
                childrenContainer.style.justifyContent = 'center';
                childrenContainer.style.marginTop = '10px';
                childrenContainer.style.position = 'relative';

                // Add connector line (simplified)
                const line = document.createElement('div');
                line.style.position = 'absolute';
                line.style.top = '-10px';
                line.style.left = '50%';
                line.style.width = '1px';
                line.style.height = '10px';
                line.style.backgroundColor = '#888';
                childrenContainer.appendChild(line);

                nodeWrapper.appendChild(childrenContainer);

                children.forEach(child => {
                    this.renderTree(child, childrenContainer);
                });
            }
        }
    }

    private setNodeStatusColor(el: HTMLElement, status: string): void {
        if (status === 'SUCCESS') el.style.color = '#4caf50';
        else if (status === 'FAILURE') el.style.color = '#f44336';
        else el.style.color = '#ffeb3b';
    }

    private updateStatus(): void {
        if (!this.treeView) return;

        // Traverse DOM and update status from attached node instances
        const nodes = this.treeView.querySelectorAll('.bt-node');
        nodes.forEach(nodeEl => {
            const node = (nodeEl as any)._nodeInstance as BehaviorNode;
            if (node) {
                const statusEl = nodeEl.querySelector('.node-status') as HTMLElement;
                if (statusEl) {
                    const status = node.getStatus();
                    statusEl.innerText = status;
                    this.setNodeStatusColor(statusEl, status);
                }
            }
        });
    }

    private async updateLibraryPanel(): Promise<void> {
        if (!this.libraryPanel) return;
        this.libraryPanel.innerHTML = '<h4>BT Templates</h4>';

        const saveBtn = this.createButton('Save Current', async () => {
            if (!this.selectedEntity) return;
            const btComp = this.selectedEntity.getComponent<BehaviorTreeComponent>('BehaviorTree');
            if (!btComp || !btComp.root) return;

            const name = prompt('Template Name:', btComp.name || 'New Template');
            if (!name) return;

            const template = {
                name,
                description: 'Behavior Tree Template',
                category: 'General',
                tree_json: { name, root: btComp.root.serialize() },
                author: 'Editor',
                version: 1
            };

            try {
                const resp = await fetch('/api/bt-templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(template)
                });
                if (resp.ok) {
                    Logger.info('Template saved successfully');
                    this.updateLibraryPanel();
                } else {
                    Logger.error('Failed to save template');
                }
            } catch (e) {
                Logger.error('Error saving template', e as Error);
            }
        });
        saveBtn.style.width = '100%';
        saveBtn.style.marginBottom = '10px';
        this.libraryPanel.appendChild(saveBtn);

        try {
            const resp = await fetch('/api/bt-templates');
            if (!resp.ok) return;
            const templates = await resp.json();

            templates.forEach((t: any) => {
                const item = document.createElement('div');
                item.style.padding = '5px';
                item.style.margin = '5px 0';
                item.style.backgroundColor = '#333';
                item.style.borderRadius = '3px';
                item.style.cursor = 'pointer';
                item.style.fontSize = '12px';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';

                const nameEl = document.createElement('span');
                nameEl.innerText = t.name;
                item.appendChild(nameEl);

                item.onclick = async () => {
                    if (!this.selectedEntity) return;
                    if (!confirm(`Load template "${t.name}"? This will replace current tree.`)) return;

                    try {
                        const fullResp = await fetch(`/api/bt-templates/${t.id}`);
                        const fullT = await fullResp.json();
                        const tree = BehaviorTreeBuilder.build(fullT.tree_json);
                        const comp = new BehaviorTreeComponent(tree);
                        this.selectedEntity.removeComponent('BehaviorTree');
                        this.selectedEntity.addComponent(comp);
                        this.refresh();
                    } catch (e) {
                        Logger.error('Failed to load template', e as Error);
                    }
                };

                const delLink = document.createElement('span');
                delLink.innerText = '🗑️';
                delLink.style.fontSize = '10px';
                delLink.style.marginLeft = '5px';
                delLink.onclick = async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Delete template "${t.name}"?`)) return;
                    await fetch(`/api/bt-templates/${t.id}`, { method: 'DELETE' });
                    this.updateLibraryPanel();
                };
                item.appendChild(delLink);

                this.libraryPanel!.appendChild(item);
            });
        } catch (e) {
            Logger.error('Error fetching templates', e as Error);
        }
    }

    private updatePropertiesPanel(): void {
        if (!this.propertiesPanel) return;
        this.propertiesPanel.innerHTML = '<h4>Properties</h4>';

        if (!this.selectedNode) {
            this.propertiesPanel.innerHTML += '<p style="color: #888;">Select a node to edit properties.</p>';
            return;
        }

        const node = this.selectedNode;
        const type = node.constructor.name;

        this.propertiesPanel.innerHTML += `<p><strong>Type:</strong> ${type}</p>`;
        this.propertiesPanel.innerHTML += `<p><strong>Name:</strong> ${node.name}</p>`;

        // Editable Name
        const nameInput = this.createInput('Name', node.name, (val) => {
            node.name = val;
            // Refresh only if name changed?
            // We can just update the DOM element if we had ID. For now full refresh on next selection.
        });
        this.propertiesPanel.appendChild(nameInput);

        // Add Child (if composite)
        if (node instanceof CompositeNode) {
            const addChildContainer = document.createElement('div');
            addChildContainer.style.marginTop = '10px';
            addChildContainer.style.borderTop = '1px solid #444';
            addChildContainer.style.paddingTop = '10px';

            const label = document.createElement('div');
            label.innerText = 'Add Child:';
            addChildContainer.appendChild(label);

            const select = document.createElement('select');
            select.style.marginRight = '5px';
            select.style.padding = '2px';

            NodeRegistry.getAllNames().forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                select.appendChild(opt);
            });
            addChildContainer.appendChild(select);

            const addBtn = this.createButton('Add', () => {
                const type = select.value;
                const NodeClass = NodeRegistry.get(type);
                if (NodeClass) {
                    const newNode = new NodeClass();
                    node.addChild(newNode);
                    this.refresh();
                }
            });
            addChildContainer.appendChild(addBtn);

            this.propertiesPanel.appendChild(addChildContainer);
        }

        // Dynamic Properties
        const propsContainer = document.createElement('div');
        propsContainer.style.marginTop = '15px';
        propsContainer.innerHTML = '<h5>Fields</h5>';

        Object.keys(node).forEach(key => {
            if (key === 'name' || key === 'id' || key === 'children' || key === 'status' || key === 'blackboard') return;

            const val = (node as any)[key];
            if (typeof val === 'string' || typeof val === 'number') {
                const input = this.createInput(key, val, (newVal) => {
                    const num = parseFloat(newVal);
                    (node as any)[key] = isNaN(num) ? newVal : num;
                });
                propsContainer.appendChild(input);
            }
        });

        this.propertiesPanel.appendChild(propsContainer);

        // Actions Container
        const actionsContainer = document.createElement('div');
        actionsContainer.style.marginTop = '20px';
        actionsContainer.style.borderTop = '1px solid #555';
        actionsContainer.style.paddingTop = '10px';
        actionsContainer.style.display = 'flex';
        actionsContainer.style.gap = '5px';
        actionsContainer.style.flexWrap = 'wrap';

        // Copy
        const copyBtn = this.createButton('Copy', () => {
            this.clipboardNode = node.serialize();
            Logger.info('Node copied to internal clipboard.');
        });
        actionsContainer.appendChild(copyBtn);

        // Cut
        const cutBtn = this.createButton('Cut', () => {
            this.clipboardNode = node.serialize();
            this.deleteSelectedNode();
        });
        actionsContainer.appendChild(cutBtn);

        // Paste Child (if Composite)
        if (node instanceof CompositeNode && this.clipboardNode) {
            const pasteBtn = this.createButton('Paste Child', () => {
                if (this.clipboardNode) {
                    const newNode = BehaviorTreeBuilder.buildNode(this.clipboardNode);
                    if (newNode) {
                        node.addChild(newNode);
                        this.refresh();
                    }
                }
            });
            actionsContainer.appendChild(pasteBtn);
        }

        // Delete
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete Node';
        delBtn.style.backgroundColor = '#d32f2f';
        delBtn.style.color = 'white';
        delBtn.style.border = 'none';
        delBtn.style.padding = '2px 8px';
        delBtn.style.borderRadius = '3px';
        delBtn.style.cursor = 'pointer';
        delBtn.style.marginLeft = 'auto'; // Push to right
        delBtn.onclick = () => this.deleteSelectedNode();
        actionsContainer.appendChild(delBtn);

        this.propertiesPanel.appendChild(actionsContainer);
    }

    private handleDragStart(e: DragEvent, node: BehaviorNode): void {
        this.draggedNode = node;
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', node.name);
            e.dataTransfer.effectAllowed = 'move';
        }
        (e.target as HTMLElement).style.opacity = '0.5';
    }

    private handleDragOver(e: DragEvent, node: BehaviorNode): void {
        e.preventDefault();
        if (this.draggedNode === node) return;
        if (!(node instanceof CompositeNode)) return;

        // Avoid dragging parent into child
        if (this.isDescendant(this.draggedNode!, node)) return;

        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

        const el = e.currentTarget as HTMLElement;
        el.style.border = '2px dashed #ffeb3b';
    }

    private handleDragLeave(e: DragEvent, node: BehaviorNode): void {
        const el = e.currentTarget as HTMLElement;
        el.style.border = this.selectedNode === node ? '2px solid #2196F3' : '1px solid #888';
    }

    private handleDrop(e: DragEvent, targetParent: BehaviorNode): void {
        e.preventDefault();
        e.stopPropagation();

        const el = e.currentTarget as HTMLElement;
        el.style.border = this.selectedNode === targetParent ? '2px solid #2196F3' : '1px solid #888';

        if (!this.draggedNode || this.draggedNode === targetParent) return;
        if (!(targetParent instanceof CompositeNode)) return;

        // Final check for hierarchy
        if (this.isDescendant(this.draggedNode, targetParent)) {
            Logger.warn('Cannot drag parent into its own descendant');
            return;
        }

        // Find old parent and remove
        const btComp = this.selectedEntity?.getComponent<BehaviorTreeComponent>('BehaviorTree');
        if (!btComp || !btComp.root) return;

        const oldParent = this.findParent(btComp.root, this.draggedNode);
        if (oldParent) {
            oldParent.removeChild(this.draggedNode);
        } else if (btComp.root === this.draggedNode) {
            Logger.warn('Cannot reparent root node currently via drag if it has no parent');
            return;
        }

        // Add to new parent
        targetParent.addChild(this.draggedNode);
        this.draggedNode = null;
        this.refresh();
    }

    private isDescendant(parent: BehaviorNode, possibleChild: BehaviorNode): boolean {
        if (parent === possibleChild) return true;
        if (parent instanceof CompositeNode) {
            for (const child of parent.getChildren()) {
                if (this.isDescendant(child, possibleChild)) return true;
            }
        }
        return false;
    }

    private createInput(label: string, value: any, onChange: (val: string) => void): HTMLDivElement {
        const div = document.createElement('div');
        div.style.marginBottom = '5px';

        const lbl = document.createElement('label');
        lbl.innerText = label + ': ';
        lbl.style.display = 'inline-block';
        lbl.style.width = '100px';
        lbl.style.fontSize = '12px';

        const inp = document.createElement('input');
        inp.value = String(value);
        inp.style.width = '120px';
        inp.style.backgroundColor = '#333';
        inp.style.color = '#fff';
        inp.style.border = '1px solid #555';

        inp.onchange = (e) => onChange((e.target as HTMLInputElement).value);

        div.appendChild(lbl);
        div.appendChild(inp);
        return div;
    }

    private deleteSelectedNode(): void {
        if (!this.selectedNode || !this.selectedEntity) return;

        const btComponent = this.selectedEntity.getComponent<BehaviorTreeComponent>('BehaviorTree');
        if (!btComponent || !btComponent.root) return;

        if (btComponent.root === this.selectedNode) {
            if (confirm('Delete Root Node? This will clear the tree.')) {
                // We can't nullify root easily in strict types if BehaviorTree requires it.
                // We'll replace it with a dummy or just warn.
                // Actually BehaviorTree must have root.
                alert('Cannot delete root node. Clear tree instead via console if needed.');
            }
            return;
        }

        const parent = this.findParent(btComponent.root, this.selectedNode);
        if (parent) {
            if (confirm(`Delete node '${this.selectedNode.name}'?`)) {
                parent.removeChild(this.selectedNode);
                this.selectedNode = null;
                this.refresh();
            }
        } else {
            alert('Could not find parent of selected node.');
        }
    }

    private findParent(current: BehaviorNode, target: BehaviorNode): CompositeNode | null {
        if (current instanceof CompositeNode) {
            if (current.getChildren().includes(target)) return current;
            for (const child of current.getChildren()) {
                const found = this.findParent(child, target);
                if (found) return found;
            }
        }
        return null;
    }

    private validateTree(): void {
        if (!this.selectedEntity) {
            alert('No entity selected.');
            return;
        }
        const btComponent = this.selectedEntity.getComponent<BehaviorTreeComponent>('BehaviorTree');
        if (!btComponent || !btComponent.root) {
            alert('No Behavior Tree found.');
            return;
        }

        const errors: string[] = [];
        this.checkNode(btComponent.root, errors);

        if (errors.length > 0) {
            alert('Validation Errors:\n- ' + errors.join('\n- '));
        } else {
            alert('Tree is valid!');
        }
    }

    private checkNode(node: BehaviorNode, errors: string[]): void {
        if (node instanceof CompositeNode) {
            if (node.getChildren().length === 0) {
                errors.push(`Composite node '${node.name}' (${node.constructor.name}) has no children.`);
            }
            node.getChildren().forEach(child => this.checkNode(child, errors));
        } else {
            // Leaf node validation
            const type = node.constructor.name;
            const anyNode = node as any;

            if (type === 'MoveTo') {
                if (!anyNode.targetKey) errors.push(`Node '${node.name}' (MoveTo) missing 'targetKey'.`);
                if (typeof anyNode.speed !== 'number' || anyNode.speed <= 0) errors.push(`Node '${node.name}' (MoveTo) has invalid 'speed'.`);
                if (typeof anyNode.stopDistance !== 'number' || anyNode.stopDistance < 0) errors.push(`Node '${node.name}' (MoveTo) has invalid 'stopDistance'.`);
            } else if (type === 'IsTargetInRange') {
                if (!anyNode.targetKey) errors.push(`Node '${node.name}' (IsTargetInRange) missing 'targetKey'.`);
                if (typeof anyNode.range !== 'number' || anyNode.range < 0) errors.push(`Node '${node.name}' (IsTargetInRange) has invalid 'range'.`);
            } else if (type === 'LogAction') {
                if (!anyNode.message) errors.push(`Node '${node.name}' (LogAction) missing 'message'.`);
            }
        }
    }

    private exportToJson(): void {
        if (!this.selectedEntity) return;
        const btComponent = this.selectedEntity.getComponent<BehaviorTreeComponent>('BehaviorTree');
        if (!btComponent || !btComponent.root) return;

        try {
            const rootDef = btComponent.root.serialize();
            const treeDef = {
                name: 'Exported Tree',
                root: rootDef
            };
            const json = JSON.stringify(treeDef, null, 2);

            // Copy to clipboard
            navigator.clipboard.writeText(json).then(() => {
                alert('Tree JSON copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy', err);
                // Fallback
                console.log(json);
                alert('Could not copy to clipboard. Check console.');
            });
        } catch (e) {
            Logger.error('Export failed', e as Error);
            alert('Export failed');
        }
    }

    private loadFromJson(): void {
        const json = prompt('Paste Behavior Tree JSON here:');
        if (json && this.selectedEntity) {
            try {
                const def = JSON.parse(json);
                const tree = BehaviorTreeBuilder.build(def);
                const comp = new BehaviorTreeComponent(tree);
                // Remove old if exists
                this.selectedEntity.removeComponent('BehaviorTree');
                this.selectedEntity.addComponent(comp);
                this.refresh();
            } catch (e) {
                alert('Invalid JSON');
                Logger.error('Failed to load BT JSON', e as Error);
            }
        }
    }
}
