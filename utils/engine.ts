import { 
  GameState, Fighter, PlayerState, InputState, Box, Particle, FloatingText
} from '../types';
import * as C from '../constants';

// Helper: Check AABB Collision
export const checkCollision = (r1: Box, r2: Box): boolean => {
  return (
    r1.x < r2.x + r2.w &&
    r1.x + r1.w > r2.x &&
    r1.y < r2.y + r2.h &&
    r1.y + r1.h > r2.y
  );
};

// Helper: Create Hitbox based on attack type and direction
const createAttackHitbox = (fighter: Fighter, type: 'PUNCH' | 'KICK' | 'DASH' | 'GRAB'): Box => {
  const dir = fighter.direction;
  const isAir = !fighter.isGrounded;
  let w = 0, h = 0, xOff = 0, yOff = 0;

  switch (type) {
    case 'PUNCH':
      w = 40; h = 30;
      xOff = dir === 1 ? fighter.width : -w;
      yOff = isAir ? 50 : 20; 
      break;
    case 'KICK':
      // Increased reach for Kick
      w = isAir ? 70 : 90; // Was 50/60
      h = isAir ? 60 : 40;
      xOff = dir === 1 ? fighter.width : -w;
      yOff = isAir ? 60 : 40;
      break;
    case 'DASH':
      w = 50; h = isAir ? 50 : 80;
      xOff = dir === 1 ? fighter.width - 10 : -w + 10;
      yOff = isAir ? 50 : 10;
      break;
    case 'GRAB':
      w = 40; h = 40; // Slightly larger range to make it usable
      xOff = dir === 1 ? fighter.width : -w;
      yOff = 30;
      break;
  }

  return {
    x: fighter.x + xOff,
    y: fighter.y + yOff,
    w, h
  };
};

export const createInitialState = (): GameState => ({
  player: {
    id: 'p1',
    x: 100, y: C.GROUND_Y - C.PLAYER_HEIGHT,
    vx: 0, vy: 0,
    hp: C.MAX_HP, maxHp: C.MAX_HP,
    width: C.PLAYER_WIDTH, height: C.PLAYER_HEIGHT,
    direction: 1,
    state: PlayerState.IDLE,
    frameTimer: 0,
    hasJumpAttacked: false,
    isGrounded: true,
    isBlocking: false,
    hitStunTimer: 0,
    activeHitbox: null,
    didHit: false
  },
  cpu: {
    id: 'p2',
    x: 600, y: C.GROUND_Y - C.PLAYER_HEIGHT,
    vx: 0, vy: 0,
    hp: C.MAX_HP, maxHp: C.MAX_HP,
    width: C.PLAYER_WIDTH, height: C.PLAYER_HEIGHT,
    direction: -1,
    state: PlayerState.IDLE,
    frameTimer: 0,
    hasJumpAttacked: false,
    isGrounded: true,
    isBlocking: false,
    hitStunTimer: 0,
    activeHitbox: null,
    didHit: false
  },
  timeRemaining: C.MATCH_TIME,
  particles: [],
  floatingTexts: [],
  gameStatus: 'MENU',
  winner: null,
  endingTimer: 0
});

const updateFighter = (f: Fighter, input: InputState, opponent: Fighter) => {
  if (f.state === PlayerState.DEAD || f.state === PlayerState.WIN) return;

  // 0. Auto-Facing Logic
  f.direction = f.x < opponent.x ? 1 : -1;

  // 1. Handle Hit Stun
  if (f.state === PlayerState.HIT) {
    f.isBlocking = false;
    f.hitStunTimer--;
    if (f.hitStunTimer <= 0) {
      f.state = PlayerState.IDLE;
    } else {
      f.vx *= C.FRICTION;
      f.vy += C.GRAVITY;
      f.x += f.vx;
      f.y += f.vy;
      if (f.y + f.height >= C.GROUND_Y) {
        f.y = C.GROUND_Y - f.height;
        f.vy = 0;
        f.isGrounded = true;
      }
      return; 
    }
  }

  // 2. State Management
  const isAttacking = 
    f.state === PlayerState.ATTACK_PUNCH || 
    f.state === PlayerState.ATTACK_KICK || 
    f.state === PlayerState.ATTACK_DASH ||
    f.state === PlayerState.ATTACK_GRAB;

  let onGround = f.y + f.height >= C.GROUND_Y;
  
  f.isBlocking = false;

  // Handle Attacks
  if (isAttacking) {
    f.frameTimer++;
    let totalFrames = 0;
    let activeStart = 0;
    let activeEnd = 0;
    let attackType: 'PUNCH' | 'KICK' | 'DASH' | 'GRAB' = 'PUNCH';

    if (f.state === PlayerState.ATTACK_PUNCH) {
      totalFrames = C.ATTACK_PUNCH_TOTAL;
      activeStart = C.ATTACK_PUNCH_STARTUP;
      activeEnd = C.ATTACK_PUNCH_STARTUP + C.ATTACK_PUNCH_ACTIVE;
      attackType = 'PUNCH';
    } else if (f.state === PlayerState.ATTACK_KICK) {
      totalFrames = C.ATTACK_KICK_TOTAL;
      activeStart = C.ATTACK_KICK_STARTUP;
      activeEnd = C.ATTACK_KICK_STARTUP + C.ATTACK_KICK_ACTIVE;
      attackType = 'KICK';
    } else if (f.state === PlayerState.ATTACK_DASH) {
      totalFrames = C.ATTACK_DASH_TOTAL;
      activeStart = C.ATTACK_DASH_STARTUP;
      activeEnd = C.ATTACK_DASH_STARTUP + C.ATTACK_DASH_ACTIVE;
      attackType = 'DASH';
      
      if (f.frameTimer >= activeStart && f.frameTimer < activeEnd) {
        if (!onGround) {
          f.vx = f.direction * C.DIVE_SPEED_X;
          f.vy = C.DIVE_SPEED_Y; 
        } else {
          f.vx = f.direction * C.DASH_SPEED;
        }
      } else {
        if (onGround) f.vx *= 0.5; 
      }
    } else if (f.state === PlayerState.ATTACK_GRAB) {
      totalFrames = C.ATTACK_GRAB_TOTAL;
      activeStart = C.ATTACK_GRAB_STARTUP;
      activeEnd = C.ATTACK_GRAB_STARTUP + C.ATTACK_GRAB_ACTIVE;
      attackType = 'GRAB';
      f.vx *= 0.8; // Slow down significantly during grab attempt
    } else {
      if (onGround) f.vx *= C.FRICTION; 
    }

    // Active Hitbox creation
    if (f.frameTimer >= activeStart && f.frameTimer < activeEnd && !f.didHit) {
      f.activeHitbox = createAttackHitbox(f, attackType);
    } else {
      f.activeHitbox = null;
    }

    // End Attack
    if (f.frameTimer >= totalFrames) {
      f.state = onGround ? PlayerState.IDLE : PlayerState.JUMP;
      f.activeHitbox = null;
    }

    if (attackType === 'DASH' && !onGround && f.y + f.height >= C.GROUND_Y) {
       f.y = C.GROUND_Y - f.height;
       f.vy = 0;
       f.isGrounded = true;
       f.state = PlayerState.IDLE; 
       f.activeHitbox = null; 
    }

  } else {
    f.activeHitbox = null;
    f.didHit = false; 

    const holdingRight = input.d;
    const holdingLeft = input.a;
    const facingRight = f.direction === 1;

    f.vx = 0;

    if (holdingRight) {
        if (facingRight) {
            f.vx = C.MOVE_SPEED;
            if (onGround) f.state = PlayerState.WALK;
        } else {
            f.vx = C.BACK_WALK_SPEED; 
            if (onGround) {
              f.state = PlayerState.WALK;
              f.isBlocking = true; 
            }
        }
    } else if (holdingLeft) {
        if (!facingRight) {
            f.vx = -C.MOVE_SPEED;
            if (onGround) f.state = PlayerState.WALK;
        } else {
            f.vx = -C.BACK_WALK_SPEED; 
            if (onGround) {
              f.state = PlayerState.WALK;
              f.isBlocking = true; 
            }
        }
    } else {
        f.vx *= C.FRICTION;
        if (onGround) f.state = PlayerState.IDLE;
    }

    if (onGround && input.s) {
      f.state = PlayerState.CROUCH;
      f.height = C.CROUCH_HEIGHT;
      f.y = C.GROUND_Y - C.CROUCH_HEIGHT;
      f.vx = 0; 
      
      if ((facingRight && holdingLeft) || (!facingRight && holdingRight)) {
          f.isBlocking = true;
      }
    } else {
      if (f.state === PlayerState.CROUCH) {
         f.y -= (C.PLAYER_HEIGHT - C.CROUCH_HEIGHT); 
      }
      f.height = C.PLAYER_HEIGHT;
    }

    if (input.w && onGround && f.state !== PlayerState.CROUCH) {
      f.vy = C.JUMP_FORCE;
      f.isGrounded = false;
      f.state = PlayerState.JUMP;
      f.isBlocking = false; 
    }

    if (!onGround) {
      f.state = PlayerState.JUMP;
      f.isBlocking = false; 
      if (input.a) f.vx -= 0.5;
      if (input.d) f.vx += 0.5;
      if (f.vx > C.MOVE_SPEED) f.vx = C.MOVE_SPEED;
      if (f.vx < -C.MOVE_SPEED) f.vx = -C.MOVE_SPEED;
    }

    const canAirAttack = !onGround && !f.hasJumpAttacked;
    const canGroundAttack = onGround;

    if (canGroundAttack || canAirAttack) {
      if (input.j) {
        f.state = PlayerState.ATTACK_PUNCH;
        f.frameTimer = 0;
        if (!onGround) f.hasJumpAttacked = true;
      } else if (input.k) {
        f.state = PlayerState.ATTACK_KICK;
        f.frameTimer = 0;
        if (!onGround) f.hasJumpAttacked = true;
      } else if (input.l) {
        f.state = PlayerState.ATTACK_DASH;
        f.frameTimer = 0;
        if (!onGround) f.hasJumpAttacked = true;
      } else if (input.h && onGround) {
        // Grab is ground only for now
        f.state = PlayerState.ATTACK_GRAB;
        f.frameTimer = 0;
      }
    }
  }

  if (f.y + f.height < C.GROUND_Y) {
      f.vy += C.GRAVITY;
      f.isGrounded = false;
  }

  f.x += f.vx;
  f.y += f.vy;

  if (f.y + f.height >= C.GROUND_Y) {
    f.y = C.GROUND_Y - f.height;
    f.vy = 0;
    f.isGrounded = true;
    f.hasJumpAttacked = false; 
    if (f.state === PlayerState.JUMP) f.state = PlayerState.IDLE;
  }

  if (f.x < 0) { f.x = 0; f.vx = 0; }
  if (f.x + f.width > 800) { f.x = 800 - f.width; f.vx = 0; }
};

const updateAI = (cpu: Fighter, player: Fighter) => {
  const input: InputState = {
    w: false, a: false, s: false, d: false, j: false, k: false, l: false, h: false
  };

  if (cpu.state === PlayerState.HIT || cpu.state === PlayerState.DEAD || cpu.state === PlayerState.WIN) return input;

  const dx = player.x - cpu.x;
  const dist = Math.abs(dx);
  const isAir = !cpu.isGrounded;

  const rand = Math.random();

  if (dist > 150) {
    if (dx > 0) input.d = true;
    else input.a = true;
    if (dist > 300 && rand < 0.02) input.l = true;
    if (rand < 0.01 && !isAir) input.w = true;
  } else {
    // In range
    if (player.isBlocking && rand < 0.3) {
      // High chance to grab if opponent is blocking
      input.h = true;
    } else if (rand < 0.05) input.j = true; 
    else if (rand < 0.1) input.k = true; 
    else if (rand < 0.12) input.l = true; 
    else if (rand < 0.13) input.h = true; // Random grab
    else if (rand < 0.15) input.s = true; 
    else if (rand < 0.17) input.w = true; 
  }

  if (isAir && !cpu.hasJumpAttacked) {
     if (dist < 100) input.k = true; 
     else if (dist > 150) input.l = true; 
  }

  const playerAttacking = player.state === PlayerState.ATTACK_PUNCH || player.state === PlayerState.ATTACK_KICK || player.state === PlayerState.ATTACK_DASH;
  if (playerAttacking && dist < 120 && !isAir) {
      if (Math.random() < 0.7) { 
          if (dx > 0) input.a = true; 
          else input.d = true; 
      }
  }

  return input;
};

// Check if a fighter is in recovery frames (after active, before end)
const isRecovering = (f: Fighter): boolean => {
    let activeEnd = 0;
    if (f.state === PlayerState.ATTACK_PUNCH) activeEnd = C.ATTACK_PUNCH_STARTUP + C.ATTACK_PUNCH_ACTIVE;
    else if (f.state === PlayerState.ATTACK_KICK) activeEnd = C.ATTACK_KICK_STARTUP + C.ATTACK_KICK_ACTIVE;
    else if (f.state === PlayerState.ATTACK_DASH) activeEnd = C.ATTACK_DASH_STARTUP + C.ATTACK_DASH_ACTIVE;
    else if (f.state === PlayerState.ATTACK_GRAB) activeEnd = C.ATTACK_GRAB_STARTUP + C.ATTACK_GRAB_ACTIVE;
    else return false;

    return f.frameTimer > activeEnd;
};

export const gameTick = (state: GameState, playerInput: InputState): GameState => {
  if (state.gameStatus !== 'PLAYING' && state.gameStatus !== 'ENDING') return state;

  const { player, cpu } = state;
  let particles = [...state.particles];
  let floatingTexts = [...state.floatingTexts];

  // Update particles and floating texts (always runs in PLAYING and ENDING)
  particles = particles.filter(p => p.life > 0).map(p => ({
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    life: p.life - 1
  }));

  floatingTexts = floatingTexts.filter(t => t.life > 0).map(t => ({
      ...t,
      y: t.y + t.vy,
      life: t.life - 1
  }));

  if (state.gameStatus === 'ENDING') {
      const newTimer = state.endingTimer - 1;
      
      // Update winner position (optional, just to keep them grounded)
      // We don't update physics for dead player
      if (state.winner === 'PLAYER') {
          player.x += player.vx; player.y += player.vy; // Simple physics for winner if moving
          if (player.y + player.height >= C.GROUND_Y) player.y = C.GROUND_Y - player.height;
      } else if (state.winner === 'CPU') {
          cpu.x += cpu.vx; cpu.y += cpu.vy;
          if (cpu.y + cpu.height >= C.GROUND_Y) cpu.y = C.GROUND_Y - cpu.height;
      }

      if (newTimer <= 0) {
          return {
              ...state,
              particles,
              floatingTexts,
              gameStatus: 'GAME_OVER',
              endingTimer: 0
          };
      }
      return {
          ...state,
          particles,
          floatingTexts,
          endingTimer: newTimer
      };
  }

  const cpuInput = updateAI(cpu, player);

  updateFighter(player, playerInput, cpu);
  updateFighter(cpu, cpuInput, player);

  const handleHit = (attacker: Fighter, defender: Fighter) => {
    if (attacker.activeHitbox && !attacker.didHit && defender.state !== PlayerState.HIT && defender.state !== PlayerState.DEAD) {
      const hurtbox: Box = { x: defender.x, y: defender.y, w: defender.width, h: defender.height };
      
      if (checkCollision(attacker.activeHitbox, hurtbox)) {
        attacker.didHit = true;
        
        let damage = C.DAMAGE_UNIFORM;
        let kX = C.KNOCKBACK_X;
        let kY = C.KNOCKBACK_Y;
        let isCounter = false;
        let isGuardBreak = false;

        const isAirAttack = !attacker.isGrounded;
        const isGrab = attacker.state === PlayerState.ATTACK_GRAB;

        // Attack Type Bonuses
        if (attacker.state === PlayerState.ATTACK_KICK && isAirAttack) {
          damage += C.DAMAGE_AERIAL_KICK_BONUS;
        } else if (attacker.state === PlayerState.ATTACK_DASH && isAirAttack) {
          kX = C.HEAVY_KNOCKBACK_X;
          kY = C.HEAVY_KNOCKBACK_Y;
        }

        // 1. Counter Check
        if (isRecovering(defender)) {
            isCounter = true;
            damage *= C.DAMAGE_MULTIPLIER_COUNTER;
            // Massive knockback for counter
            kX *= C.COUNTER_KNOCKBACK_BONUS;
        }

        // 2. Block & Grab Logic
        if (isGrab) {
            // GRAB LOGIC: 
            // Strong push regardless, yellow effect
            kX = C.GRAB_KNOCKBACK_X; // Strong fixed knockback for grab
            
            if (defender.isBlocking) {
                // Grab vs Block = Bonus Damage (Guard Break effect)
                damage *= C.DAMAGE_MULTIPLIER_GRAB_BLOCKING;
                isGuardBreak = true;
            } else {
                // Grab vs Normal = Standard Damage
            }
        } else {
            // Standard Attack vs Block
            if (defender.isBlocking && !isCounter) {
                damage *= C.BLOCK_REDUCTION_RATIO;
                kX *= 0.5;
            }
        }

        defender.hp -= damage;
        defender.state = PlayerState.HIT;
        defender.hitStunTimer = C.HIT_STUN_FRAMES;
        
        // Knockback application
        defender.vx = attacker.direction * kX;
        
        // Vertical Knockback: 
        // If Grab or Counter or Normal Hit (Not Blocked) -> Apply Y knockback
        // Counter adds extra air time? For now standard Y is fine, maybe slightly higher for counter?
        if (!defender.isBlocking || isGrab || isCounter) {
             defender.vy = kY; 
             defender.isGrounded = false;
        }

        // VISUALS
        // Particles
        // Grab = Yellow
        // Block = Blue
        // Normal P1 = Cyan, P2 = Pink
        
        let particleColor = (attacker.id === 'p1' ? '#22d3ee' : '#f472b6');
        let particleCount = 8;

        if (isGrab) {
            particleColor = C.GRAB_HIT_COLOR;
            particleCount = 10;
        } else if (defender.isBlocking && !isCounter) {
            particleColor = '#60a5fa'; // Blue
            particleCount = 3;
        }

        for(let i=0; i<particleCount; i++) {
          particles.push({
            x: defender.x + defender.width/2,
            y: defender.y + defender.height/2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 20,
            color: (defender.isBlocking && !isGrab && !isCounter && i % 2 === 0) ? '#ffffff' : particleColor,
            size: Math.random() * 5 + 3
          });
        }

        // Floating Text for Counter
        if (isCounter) {
            floatingTexts.push({
                id: Date.now() + Math.random(),
                x: defender.x,
                y: defender.y - 20,
                text: "COUNTER!",
                color: '#ef4444',
                life: 40,
                size: 32, // Larger text for counter
                vy: -1
            });
        } else if (isGuardBreak) {
             floatingTexts.push({
                id: Date.now() + Math.random(),
                x: defender.x,
                y: defender.y - 20,
                text: "CRUSH!",
                color: '#fbbf24', // Amber
                life: 40,
                size: 20,
                vy: -1
            });
        }
      }
    }
  };

  handleHit(player, cpu);
  handleHit(cpu, player);

  if (Math.abs(player.x - cpu.x) < 30 && Math.abs(player.y - cpu.y) < 50) {
      if (player.x < cpu.x) {
          player.x -= 2; cpu.x += 2;
      } else {
          player.x += 2; cpu.x -= 2;
      }
  }

  let winner = state.winner;
  let status: GameState['gameStatus'] = state.gameStatus;
  let endingTimer = state.endingTimer;

  // Function to shatter a fighter
  const shatterFighter = (f: Fighter, color: string) => {
      if (f.state !== PlayerState.DEAD) {
          f.state = PlayerState.DEAD;
          for(let i=0; i<100; i++) { // Increased particle count
              particles.push({
                  x: f.x + Math.random() * f.width,
                  y: f.y + Math.random() * f.height,
                  vx: (Math.random() - 0.5) * 30, // Faster explode
                  vy: (Math.random() - 1) * 30,
                  life: 80 + Math.random() * 40, // Longer life to ensure they go offscreen
                  color: color,
                  size: Math.random() * 8 + 4
              });
          }
      }
  };

  if (status === 'PLAYING') {
      if (player.hp <= 0) { 
          player.hp = 0; 
          shatterFighter(player, '#22d3ee');
          cpu.state = PlayerState.WIN; 
          winner = 'CPU'; 
          status = 'ENDING'; 
          endingTimer = 100; // Wait 100 frames (~1.6s)
      }
      else if (cpu.hp <= 0) { 
          cpu.hp = 0; 
          shatterFighter(cpu, '#f472b6');
          player.state = PlayerState.WIN; 
          winner = 'PLAYER'; 
          status = 'ENDING';
          endingTimer = 100;
      }
  }

  return {
    ...state,
    player,
    cpu,
    particles,
    floatingTexts,
    winner,
    gameStatus: status,
    endingTimer
  };
};