import { LeafNode } from '../../leaf-node';
import { Blackboard } from '../../blackboard';
import { NodeStatus } from '../../enums';
import { Logger } from '../../../../utils/logger';

export class LogAction extends LeafNode {
  private message: string;
  private level: 'info' | 'warn' | 'error' | 'debug';

  constructor(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info') {
    super(`Log: ${message}`);
    this.message = message;
    this.level = level;
  }

  tick(blackboard: Blackboard): NodeStatus {
    switch (this.level) {
      case 'info':
        Logger.info(`[BT] ${this.message}`);
        break;
      case 'warn':
        Logger.warn(`[BT] ${this.message}`);
        break;
      case 'error':
        Logger.error(`[BT] ${this.message}`);
        break;
      case 'debug':
        Logger.debug(`[BT] ${this.message}`);
        break;
    }
    return NodeStatus.SUCCESS;
  }
}
