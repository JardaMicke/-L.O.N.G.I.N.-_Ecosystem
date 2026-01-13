import { BehaviorTreeComponent } from './behavior-tree-component';

export class BehaviorTreeRegistry {
  private static trees: BehaviorTreeComponent[] = [];

  public static register(tree: BehaviorTreeComponent): void {
    if (!this.trees.includes(tree)) {
      this.trees.push(tree);
    }
  }

  public static unregister(tree: BehaviorTreeComponent): void {
    const index = this.trees.indexOf(tree);
    if (index > -1) {
      this.trees.splice(index, 1);
    }
  }

  public static getAll(): BehaviorTreeComponent[] {
    return this.trees;
  }
}
