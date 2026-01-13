/**
 * Base Component class
 */
export abstract class Component {
  public abstract readonly name: string;
}

export interface ComponentClass<T extends Component> {
  new (...args: any[]): T;
  readonly name: string; // Ensure the class itself has a name property if needed for reflection, but usually instance name is enough
}
