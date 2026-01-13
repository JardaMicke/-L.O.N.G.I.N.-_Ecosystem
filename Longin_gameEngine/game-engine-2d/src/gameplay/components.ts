import { Component } from '../ecs/component';

export class HealthComponent extends Component {
  public readonly name = 'Health';
  public current: number;
  public max: number;
  public isDead: boolean = false;

  constructor(max: number = 100) {
    super();
    this.max = max;
    this.current = max;
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;
    this.current = Math.max(0, this.current - amount);
    if (this.current === 0) {
      this.isDead = true;
    }
  }

  public heal(amount: number): void {
    if (this.isDead) return;
    this.current = Math.min(this.max, this.current + amount);
  }
}
