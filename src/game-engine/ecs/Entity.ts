export type EntityId = number;

export class Entity {
  id: EntityId;
  
  constructor(id: EntityId) {
    this.id = id;
  }
}
