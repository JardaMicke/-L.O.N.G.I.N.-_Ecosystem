import { Serializer } from '../../src/core/serialization';
import { Component } from '../../src/ecs/component';
import { Entity } from '../../src/ecs/entity';
import { Tilemap } from '../../src/world/tilemap';

class MockComponentA extends Component {
  public readonly name = 'MockA';
  public value: number = 0;
}

class MockComponentB extends Component {
  public readonly name = 'MockB';
  public text: string = '';
}

describe('Serializer', () => {
  let serializer: Serializer;
  let entity: Entity;

  beforeEach(() => {
    serializer = new Serializer();
    serializer.registerComponent('MockA', MockComponentA);
    serializer.registerComponent('MockB', MockComponentB);

    entity = new Entity('test-entity');
    const compA = new MockComponentA();
    compA.value = 42;
    entity.addComponent(compA);

    const compB = new MockComponentB();
    compB.text = 'hello';
    entity.addComponent(compB);
  });

  it('should serialize and deserialize an entity', () => {
    const serialized = serializer.serializeEntity(entity);
    expect(serialized.id).toBe('test-entity');
    expect(serialized.components.length).toBe(2);

    const deserialized = serializer.deserializeEntity(serialized);
    expect(deserialized.id).toBe('test-entity');

    const compA = deserialized.getComponent<MockComponentA>('MockA');
    expect(compA).toBeDefined();
    expect(compA?.value).toBe(42);

    const compB = deserialized.getComponent<MockComponentB>('MockB');
    expect(compB).toBeDefined();
    expect(compB?.text).toBe('hello');
  });

  it('should serialize and deserialize world', () => {
    const tilemap = new Tilemap(10, 10, 32);
    tilemap.createLayer('ground');
    tilemap.setTile('ground', 1, 1, 5);

    const json = serializer.serializeWorld([entity], tilemap);
    const result = serializer.deserializeWorld(json);

    expect(result.entities.length).toBe(1);
    expect(result.entities[0].id).toBe('test-entity');

    expect(result.tilemap).toBeDefined();
    expect(result.tilemap?.width).toBe(10);
    expect(result.tilemap?.getTileId('ground', 1, 1)).toBe(5);
  });

  it('should handle unknown components gracefully', () => {
    // Create data with unknown component
    const data = {
      id: 'unknown-comp',
      components: [{ name: 'Unknown', data: {} }],
    };

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = serializer.deserializeEntity(data);

    expect(result.getAllComponents().length).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
