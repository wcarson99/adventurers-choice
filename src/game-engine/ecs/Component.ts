export type ComponentType = 'Position' | 'Renderable' | 'Stats' | 'PlayerControlled' | 'Attributes';

export interface Component {
  type: ComponentType;
}

export interface PositionComponent extends Component {
  type: 'Position';
  x: number;
  y: number;
}

export interface RenderableComponent extends Component {
  type: 'Renderable';
  char: string; // For text fallback
  color: string;
  sprite?: string; // URL or key
}

export interface StatsComponent extends Component {
  type: 'Stats';
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
}

export interface PlayerControlledComponent extends Component {
  type: 'PlayerControlled';
}

export interface AttributesComponent extends Component {
  type: 'Attributes';
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}
