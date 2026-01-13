import { Component } from '../ecs/component';

export class TransformComponent extends Component {
  public readonly name = 'Transform';
  public x: number = 0;
  public y: number = 0;
  public rotation: number = 0;
  public scaleX: number = 1;
  public scaleY: number = 1;

  constructor(x: number = 0, y: number = 0, rotation: number = 0) {
    super();
    this.x = x;
    this.y = y;
    this.rotation = rotation;
  }
}
