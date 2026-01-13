import { Engine } from '../../core/engine';
import { State } from '../../core/game-state';
import { Logger } from '../../utils/logger';
import { ProjectManager } from '../../core/project/project-manager';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';

export class ProjectSelectionState implements State {
  public name: string = 'ProjectSelection';
  private container: HTMLElement | null = null;
  private projectList: HTMLElement | null = null;

  public onEnter(engine: Engine): void {
    Logger.info('Entering ProjectSelectionState');
    this.createUI(engine);
  }

  public onExit(engine: Engine): void {
    Logger.info('Exiting ProjectSelectionState');
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }

  public onUpdate(engine: Engine, deltaTime: number): void {
    // UI is DOM based, no update loop needed for it
  }

  public onRender(engine: Engine, interpolation: number): void {
    const ctx = engine.renderer.getContext();
    if (!ctx) return;
    
    // Clear background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private createUI(engine: Engine): void {
    const projectManager = ProjectManager.getInstance();

    // Main Container
    this.container = document.createElement('div');
    this.container.id = 'project-selection-ui';
    this.container.style.position = 'absolute';
    this.container.style.top = '50%';
    this.container.style.left = '50%';
    this.container.style.transform = 'translate(-50%, -50%)';
    this.container.style.width = '600px';
    this.container.style.height = '500px';
    this.container.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
    this.container.style.border = '2px solid #FFD700';
    this.container.style.borderRadius = '10px';
    this.container.style.color = 'white';
    this.container.style.padding = '20px';
    this.container.style.fontFamily = 'Arial, sans-serif';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.zIndex = '2000';

    // Title
    const title = document.createElement('h2');
    title.innerText = 'Project Management';
    title.style.textAlign = 'center';
    title.style.color = '#FFD700';
    this.container.appendChild(title);

    // Project List Container
    this.projectList = document.createElement('div');
    this.projectList.style.flex = '1';
    this.projectList.style.overflowY = 'auto';
    this.projectList.style.border = '1px solid #555';
    this.projectList.style.marginBottom = '20px';
    this.projectList.style.padding = '10px';
    this.projectList.style.backgroundColor = 'rgba(0,0,0,0.3)';
    this.container.appendChild(this.projectList);

    this.renderProjectList(engine);

    // Buttons Container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.justifyContent = 'space-between';
    this.container.appendChild(buttonsDiv);

    // New Project Button
    const newBtn = document.createElement('button');
    newBtn.innerText = 'Create New Project';
    this.styleButton(newBtn, '#2E8B57');
    newBtn.onclick = () => {
      const name = prompt('Enter project name:');
      if (name) {
        projectManager.createProject(name);
        this.renderProjectList(engine);
      }
    };
    buttonsDiv.appendChild(newBtn);

    // Back Button
    const backBtn = document.createElement('button');
    backBtn.innerText = 'Back to Menu';
    this.styleButton(backBtn, '#8B0000');
    backBtn.onclick = () => {
      engine.gameStateManager.switchState('Menu');
    };
    buttonsDiv.appendChild(backBtn);

    document.body.appendChild(this.container);
  }

  private renderProjectList(engine: Engine): void {
    if (!this.projectList) return;
    this.projectList.innerHTML = '';
    const projects = ProjectManager.getInstance().getProjects();

    if (projects.length === 0) {
      const noProjects = document.createElement('div');
      noProjects.innerText = 'No projects found.';
      noProjects.style.textAlign = 'center';
      noProjects.style.color = '#888';
      this.projectList.appendChild(noProjects);
      return;
    }

    projects.forEach(project => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '10px';
      item.style.marginBottom = '5px';
      item.style.backgroundColor = '#333';
      item.style.borderRadius = '5px';
      item.style.border = '1px solid #444';

      const info = document.createElement('div');
      info.innerHTML = `<strong>${project.name}</strong> <span style="font-size:0.8em;color:#aaa">(${project.version})</span><br><small>ID: ${project.id}</small>`;
      item.appendChild(info);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '5px';

      // Load Button
      const loadBtn = document.createElement('button');
      loadBtn.innerText = 'Open';
      this.styleButton(loadBtn, '#4682B4', '5px 10px', '14px');
      loadBtn.onclick = () => {
        ProjectManager.getInstance().setActiveProject(project.id);
        // Transition to Lobby or Editor? Usually Lobby or direct Game
        // For Engine Editor, we might go to EditorState or Lobby
        engine.gameStateManager.switchState('Lobby');
      };
      actions.appendChild(loadBtn);

      // Edit Button (Rename)
      const editBtn = document.createElement('button');
      editBtn.innerText = 'Rename';
      this.styleButton(editBtn, '#FFA500', '5px 10px', '14px');
      editBtn.onclick = () => {
        const newName = prompt('Enter new name:', project.name);
        if (newName) {
            ProjectManager.getInstance().updateProject(project.id, { name: newName });
            this.renderProjectList(engine);
        }
      };
      actions.appendChild(editBtn);

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = 'Delete';
      this.styleButton(deleteBtn, '#CD5C5C', '5px 10px', '14px');
      deleteBtn.onclick = () => {
        if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
            ProjectManager.getInstance().deleteProject(project.id);
            this.renderProjectList(engine);
        }
      };
      actions.appendChild(deleteBtn);

      item.appendChild(actions);
      this.projectList!.appendChild(item);
    });
  }

  private styleButton(btn: HTMLButtonElement, color: string, padding: string = '10px 20px', fontSize: string = '16px'): void {
    btn.style.backgroundColor = color;
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = padding;
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = fontSize;
    btn.onmouseover = () => btn.style.filter = 'brightness(1.1)';
    btn.onmouseout = () => btn.style.filter = 'brightness(1.0)';
  }
}
