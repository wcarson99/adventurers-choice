export type ComponentType = 'Position' | 'Renderable' | 'Stats' | 'PlayerControlled' | 'Attributes' | 'Pushable';

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
  pwr: number;
  mov: number;
  inf: number;
  cre: number;
}

export interface PushableComponent extends Component {
  type: 'Pushable';
  weight: number; // Weight in pounds
  sprite?: string; // Optional sprite path
}
