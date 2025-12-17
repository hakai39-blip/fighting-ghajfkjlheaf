export enum PlayerState {
  IDLE,
  WALK,
  JUMP,
  CROUCH,
  ATTACK_PUNCH,
  ATTACK_KICK,
  ATTACK_DASH,
  ATTACK_GRAB,
  HIT,
  DEAD,
  WIN
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  size: number;
  vy: number;
}

export interface Fighter {
  id: 'p1' | 'p2';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  direction: 1 | -1; // 1 = facing right, -1 = facing left
  state: PlayerState;
  frameTimer: number; // Counts frames for current state
  hasJumpAttacked: boolean;
  isGrounded: boolean;
  isBlocking: boolean; // New blocking state
  hitStunTimer: number;
  // Attack properties
  activeHitbox: Box | null;
  didHit: boolean; // Prevent multi-hit per single attack swing
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface GameState {
  player: Fighter;
  cpu: Fighter;
  timeRemaining: number;
  particles: Particle[];
  floatingTexts: FloatingText[];
  gameStatus: 'MENU' | 'PLAYING' | 'ENDING' | 'GAME_OVER';
  winner: 'PLAYER' | 'CPU' | 'DRAW' | null;
  endingTimer: number;
}

export interface InputState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  j: boolean;
  k: boolean;
  l: boolean;
  h: boolean;
}