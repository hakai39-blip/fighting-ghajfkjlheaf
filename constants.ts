// Physics
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const MOVE_SPEED = 5;
export const BACK_WALK_SPEED = 3.0; // Slower speed when moving away
export const JUMP_FORCE = -14;
export const GROUND_Y = 350; // Floor Y coordinate

// Gameplay
export const MATCH_TIME = 90;
export const MAX_HP = 100;
export const DAMAGE_UNIFORM = 10;
export const DAMAGE_AERIAL_KICK_BONUS = 5; // Extra damage for jump kick
export const BLOCK_REDUCTION_RATIO = 0.2; // 1/5th damage when blocking

// Multipliers
export const DAMAGE_MULTIPLIER_GRAB_BLOCKING = 1.5; // 1.5x damage if grabbing a blocking opponent
export const DAMAGE_MULTIPLIER_COUNTER = 1.5; // 1.5x damage on counter hit

// Dimensions
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 100;
export const CROUCH_HEIGHT = 60;

// Frame Data (in game ticks, assuming 60FPS)
// Punch: Fast startup, short recovery
export const ATTACK_PUNCH_STARTUP = 4;
export const ATTACK_PUNCH_ACTIVE = 4;
export const ATTACK_PUNCH_RECOVERY = 8;
export const ATTACK_PUNCH_TOTAL = ATTACK_PUNCH_STARTUP + ATTACK_PUNCH_ACTIVE + ATTACK_PUNCH_RECOVERY;

// Kick: Medium startup, increased range, INCREASED RECOVERY
export const ATTACK_KICK_STARTUP = 8;
export const ATTACK_KICK_ACTIVE = 6;
export const ATTACK_KICK_RECOVERY = 20; // Increased from 12 to 20 (more lag)
export const ATTACK_KICK_TOTAL = ATTACK_KICK_STARTUP + ATTACK_KICK_ACTIVE + ATTACK_KICK_RECOVERY;

// Dash (Charge): Slow startup, moves player, high recovery
export const ATTACK_DASH_STARTUP = 12;
export const ATTACK_DASH_ACTIVE = 10;
export const ATTACK_DASH_RECOVERY = 20;
export const ATTACK_DASH_TOTAL = ATTACK_DASH_STARTUP + ATTACK_DASH_ACTIVE + ATTACK_DASH_RECOVERY;
export const DASH_SPEED = 12;

// Grab: Fast active, very short range, high recovery
export const ATTACK_GRAB_STARTUP = 6;
export const ATTACK_GRAB_ACTIVE = 3;
export const ATTACK_GRAB_RECOVERY = 20; // Long recovery on whiff
export const ATTACK_GRAB_TOTAL = ATTACK_GRAB_STARTUP + ATTACK_GRAB_ACTIVE + ATTACK_GRAB_RECOVERY;

// Aerial Dash (Dive) Specifics
export const DIVE_SPEED_X = 10;
export const DIVE_SPEED_Y = 15; // Plunge speed

export const HIT_STUN_FRAMES = 20;
export const KNOCKBACK_X = 5;
export const KNOCKBACK_Y = -4;
export const HEAVY_KNOCKBACK_X = 15; // Stronger pushback for dive
export const HEAVY_KNOCKBACK_Y = -2; // Low trajectory knockback
export const COUNTER_KNOCKBACK_BONUS = 20.0; // Massive knockback for counters (screen edge to edge)
export const GRAB_KNOCKBACK_X = 50.0; // Strong push for grabs (half of counter)
export const GRAB_HIT_COLOR = '#facc15'; // Yellow