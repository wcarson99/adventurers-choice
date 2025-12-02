import { EntityId } from './Entity';
import { Component, ComponentType } from './Component';
import { System } from './System';

export class World {
  private nextEntityId: EntityId = 1;
  private entities: Set<EntityId> = new Set();
  private components: Map<EntityId, Map<ComponentType, Component>> = new Map();
  private systems: System[] = [];

  // Entity Management
  createEntity(): EntityId {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.components.set(id, new Map());
    return id;
  }

  destroyEntity(id: EntityId) {
    this.entities.delete(id);
    this.components.delete(id);
  }

  // Component Management
  addComponent(entityId: EntityId, component: Component) {
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      entityComponents.set(component.type, component);
    }
  }

  removeComponent(entityId: EntityId, type: ComponentType) {
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      entityComponents.delete(type);
    }
  }

  getComponent<T extends Component>(entityId: EntityId, type: ComponentType): T | undefined {
    return this.components.get(entityId)?.get(type) as T | undefined;
  }
  
  // Queries
  getEntitiesWith(types: ComponentType[]): EntityId[] {
    const result: EntityId[] = [];
    for (const id of this.entities) {
      const comps = this.components.get(id);
      if (comps && types.every(t => comps.has(t))) {
        result.push(id);
      }
    }
    return result;
  }

  getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  // System Management
  addSystem(system: System) {
    this.systems.push(system);
  }

  update(delta: number) {
    for (const system of this.systems) {
      system.update(this, delta);
    }
  }
}
