import { Component } from '../ecs/component';

export interface ScriptInstanceData {
    name: string;
    properties: Record<string, any>;
    state: Record<string, any>;
    active: boolean;
}

export class ScriptComponent extends Component {
    public readonly name = 'Script';
    
    public scripts: ScriptInstanceData[] = [];

    constructor(initialScripts: Array<{ name: string, properties?: any }> = []) {
        super();
        initialScripts.forEach(s => this.addScript(s.name, s.properties));
    }

    public addScript(name: string, properties: Record<string, any> = {}) {
        this.scripts.push({
            name,
            properties,
            state: {},
            active: true
        });
    }
}
