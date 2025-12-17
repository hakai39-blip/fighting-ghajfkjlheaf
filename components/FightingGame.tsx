import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, InputState, PlayerState, Fighter } from '../types';
import * as C from '../constants';
import { createInitialState, gameTick } from '../utils/engine';

const FightingGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const requestRef = useRef<number>(0);
  const stateRef = useRef<GameState>(createInitialState());
  const inputRef = useRef<InputState>({
    w: false, a: false, s: false, d: false, j: false, k: false, l: false, h: false
  });
  const timeRef = useRef<number>(Date.now());
  const matchTimerRef = useRef<number>(C.MATCH_TIME);
  const shakeRef = useRef<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Input Handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const map = inputRef.current;
    if (key === 'w') map.w = true;
    if (key === 'a') map.a = true;
    if (key === 's') map.s = true;
    if (key === 'd') map.d = true;
    if (key === 'j') map.j = true;
    if (key === 'k') map.k = true;
    if (key === 'l') map.l = true;
    if (key === 'h') map.h = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const map = inputRef.current;
    if (key === 'w') map.w = false;
    if (key === 'a') map.a = false;
    if (key === 's') map.s = false;
    if (key === 'd') map.d = false;
    if (key === 'j') map.j = false;
    if (key === 'k') map.k = false;
    if (key === 'l') map.l = false;
    if (key === 'h') map.h = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Effect to handle Victory Screen Shake Trigger
  useEffect(() => {
    if (gameState.gameStatus === 'GAME_OVER') {
      // The CSS animation is set to 0.8s (duration). We want the shake to happen at the end.
      const timer = setTimeout(() => {
        shakeRef.current = 20; // Big shake when character "lands" or stops
        setShowConfetti(true);
      }, 700); // Slightly before 0.8s to impact
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [gameState.gameStatus]);

  // Game Loop
  const tick = useCallback(() => {
    const now = Date.now();
    const dt = now - timeRef.current;
    
    if (dt >= 16) {
      timeRef.current = now;

      if (stateRef.current.gameStatus === 'PLAYING') {
        matchTimerRef.current -= dt / 1000;
        stateRef.current.timeRemaining = Math.ceil(matchTimerRef.current);

        if (stateRef.current.timeRemaining <= 0) {
           stateRef.current.gameStatus = 'GAME_OVER';
           if (stateRef.current.player.hp > stateRef.current.cpu.hp) stateRef.current.winner = 'PLAYER';
           else if (stateRef.current.cpu.hp > stateRef.current.player.hp) stateRef.current.winner = 'CPU';
           else stateRef.current.winner = 'DRAW';
        }
      }

      // Check for counter text to trigger shake
      if (stateRef.current.floatingTexts.some(t => t.text === "COUNTER!" && t.life > 38)) {
          shakeRef.current = 15; // Increased shake for counter
      }
      if (shakeRef.current > 0) shakeRef.current--;

      const nextState = gameTick(stateRef.current, inputRef.current);
      stateRef.current = nextState;

      draw(nextState, shakeRef.current);
      
      setGameState({...nextState}); 
    }
    
    requestRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  const draw = (state: GameState, shake: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (shake > 0) {
        const dx = (Math.random() - 0.5) * shake;
        const dy = (Math.random() - 0.5) * shake;
        ctx.translate(dx, dy);
    }

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e293b'); 
    gradient.addColorStop(1, '#0f172a'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floor
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, C.GROUND_Y, canvas.width, canvas.height - C.GROUND_Y);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, C.GROUND_Y);
    ctx.lineTo(canvas.width, C.GROUND_Y);
    ctx.stroke();

    // Draw Fighters
    drawFighter(ctx, state.player, '#22d3ee'); // Cyan
    drawFighter(ctx, state.cpu, '#f472b6'); // Pink

    // Particles
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Floating Texts
    state.floatingTexts.forEach(t => {
       ctx.save();
       ctx.font = `900 ${t.size}px Orbitron, sans-serif`;
       ctx.fillStyle = t.color;
       ctx.strokeStyle = 'white';
       ctx.lineWidth = 2;
       ctx.textAlign = 'center';
       ctx.globalAlpha = Math.min(1, t.life / 10);
       
       // Draw text with outline
       ctx.strokeText(t.text, t.x + C.PLAYER_WIDTH/2, t.y);
       ctx.fillText(t.text, t.x + C.PLAYER_WIDTH/2, t.y);
       ctx.restore();
    });

    ctx.restore();
  };

  const drawFighter = (ctx: CanvasRenderingContext2D, f: Fighter, color: string) => {
    // DO NOT DRAW IF DEAD (Shattered)
    if (f.state === PlayerState.DEAD) return;

    ctx.save();
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(f.x + f.width/2, C.GROUND_Y, f.width/1.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apply Shake for Hit state
    if (f.state === PlayerState.HIT) {
      ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5); 
    }

    const isAir = !f.isGrounded;

    // Blocking Visual
    if (f.isBlocking) {
      ctx.save();
      ctx.strokeStyle = '#60a5fa'; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (f.direction === 1) {
          ctx.arc(f.x + f.width/2, f.y + f.height/2, f.height/1.2, -Math.PI/4, Math.PI/4);
      } else {
          ctx.arc(f.x + f.width/2, f.y + f.height/2, f.height/1.2, Math.PI * 0.75, Math.PI * 1.25);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Body Color
    ctx.fillStyle = f.state === PlayerState.HIT ? (f.isBlocking ? '#93c5fd' : '#ef4444') : color; 
    
    // GRAB VISUAL EFFECT: Turn Body Yellowish during active frames
    if (f.state === PlayerState.ATTACK_GRAB) {
        ctx.fillStyle = C.GRAB_HIT_COLOR;
    }

    let drawX = f.x;
    let drawY = f.y;
    let drawW = f.width;
    let drawH = f.height;

    // AERIAL DIVE VISUAL
    if (isAir && f.state === PlayerState.ATTACK_DASH) {
       const cx = f.x + f.width/2;
       const cy = f.y + f.height/2;
       ctx.translate(cx, cy);
       const rotation = f.direction * (Math.PI / 4);
       ctx.rotate(rotation);
       ctx.fillRect(-f.width/2, -f.height/2, f.width, f.height);
       
       ctx.fillStyle = '#fff';
       ctx.fillRect(f.direction === 1 ? f.width/2 - 15 : -f.width/2 + 5, -f.height/2 + 10, 10, 10);
       
       ctx.fillStyle = 'rgba(255,255,255,0.3)';
       ctx.fillRect(-f.width/2 - 20, -f.height/2 + 10, 20, 5);
       ctx.fillRect(-f.width/2 - 30, -f.height/2 + 30, 30, 5);

       ctx.restore(); 
    } else {
       // NORMAL DRAWING
       ctx.fillRect(drawX, drawY, drawW, drawH);

       // Direction indicator (Eyes)
       ctx.fillStyle = '#fff';
       const eyeX = f.direction === 1 ? f.x + f.width - 15 : f.x + 5;
       const eyeY = f.y + 20;
       ctx.fillRect(eyeX, eyeY, 10, 10);

       // AERIAL KICK VISUAL
       if (isAir && f.state === PlayerState.ATTACK_KICK) {
          ctx.fillStyle = color;
          const legX = f.direction === 1 ? f.x + f.width - 10 : f.x - 20;
          ctx.fillRect(legX, f.y + f.height - 20, 30, 20);
       }
       // GROUND KICK VISUAL
       else if (!isAir && f.state === PlayerState.ATTACK_KICK) {
          ctx.fillStyle = color;
          // Longer visual for longer kick
          const legX = f.direction === 1 ? f.x + f.width : f.x - 50;
          ctx.fillRect(legX, f.y + f.height - 30, 50, 15);
       }
       // PUNCH VISUAL
       else if (f.state === PlayerState.ATTACK_PUNCH) {
          ctx.fillStyle = color;
          const armX = f.direction === 1 ? f.x + f.width : f.x - 30;
          const armY = isAir ? f.y + 40 : f.y + 25; 
          ctx.fillRect(armX, armY, 30, 15);
       }
       // GRAB VISUAL (Bear Hug Pose)
       else if (f.state === PlayerState.ATTACK_GRAB) {
           ctx.fillStyle = C.GRAB_HIT_COLOR;
           // Upper Arms Open Wide
           const armY = f.y + 30;
           // Back arm
           ctx.fillRect(f.x + (f.direction===1?-20:f.width), armY, 20, 10);
           // Front arm
           ctx.fillRect(f.x + (f.direction===1?f.width:-20), armY, 20, 10);
       }
    }

    // Debug: Active Hitbox
    if (f.activeHitbox) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(f.activeHitbox.x, f.activeHitbox.y, f.activeHitbox.w, f.activeHitbox.h);
    }

    ctx.restore();
  };

  const restartGame = () => {
    stateRef.current = createInitialState();
    stateRef.current.gameStatus = 'PLAYING';
    matchTimerRef.current = C.MATCH_TIME;
    setGameState(stateRef.current);
    setShowConfetti(false);
  };

  const renderVictoryScreen = () => {
      if (gameState.gameStatus !== 'GAME_OVER') return null;

      const isPlayerWin = gameState.winner === 'PLAYER';
      const isCpuWin = gameState.winner === 'CPU';
      const winnerColor = isPlayerWin ? 'bg-cyan-500' : (isCpuWin ? 'bg-pink-500' : 'bg-yellow-400');
      
      return (
        <div className="absolute inset-0 z-50 overflow-hidden flex flex-col pointer-events-auto">
            {/* Confetti - Improved Physics: Explode Up, then drift down */}
            {showConfetti && (
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-none z-50">
                   {[...Array(60)].map((_, i) => (
                       <div key={i} className="absolute w-4 h-4 rounded-sm animate-[confetti_3s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
                            style={{
                                '--vx': `${(Math.random() - 0.5) * 800}px`,
                                '--vy': `-${Math.random() * 400 + 150}px`,
                                '--rot': `${Math.random() * 720}deg`,
                                backgroundColor: ['#22d3ee', '#f472b6', '#fbbf24', '#ffffff'][Math.floor(Math.random() * 4)],
                                animationDelay: `${Math.random() * 0.1}s`
                            } as React.CSSProperties} 
                       />
                   ))}
               </div>
            )}

            {/* Top Section: Text & Buttons (30% height) */}
            <div className="h-[35%] w-full bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center border-b-4 border-slate-700 z-10 shadow-2xl space-y-4">
                <h2 className="text-6xl font-black text-white drop-shadow-lg">
                    {isPlayerWin ? <span className="text-cyan-400">YOU WIN!</span> : 
                     isCpuWin ? <span className="text-red-500">YOU LOSE</span> : 
                     <span className="text-yellow-400">DRAW</span>}
                </h2>
                <div className="flex gap-4">
                    <button 
                        onClick={restartGame}
                        className="px-8 py-3 bg-white hover:bg-slate-200 text-black font-bold text-xl rounded shadow-lg transition-all transform hover:scale-105 active:scale-95 border-b-4 border-slate-400 active:border-b-0 active:mt-1"
                    >
                        REMATCH
                    </button>
                </div>
            </div>

            {/* Bottom Section: Giant Character (65% height) */}
            <div className="flex-1 relative bg-slate-950/50 flex justify-center items-end overflow-hidden">
                {/* The Giant Character */}
                {gameState.winner !== 'DRAW' && (
                    <div className={`w-[60%] h-[95%] ${winnerColor} rounded-t-3xl relative shadow-[0_0_50px_rgba(0,0,0,0.8)] origin-bottom animate-[victoryPan_0.8s_cubic-bezier(0.22,1,0.36,1)_both]`}>
                         {/* Details to make it look like a character */}
                         {/* Eyes */}
                         <div className="absolute top-[15%] right-[20%] w-[12%] h-[6%] bg-white shadow-inner transform -skew-x-12"></div>
                         <div className="absolute top-[15%] left-[20%] w-[12%] h-[6%] bg-white shadow-inner transform skew-x-12"></div>
                         
                         {/* Decorative Armor/Lines */}
                         <div className="absolute top-[30%] w-full h-[5%] bg-black/10"></div>
                         <div className="absolute bottom-[20%] w-full h-[10%] bg-black/10"></div>

                         {/* Arms (Decorative) */}
                         <div className={`absolute top-[40%] -left-[10%] w-[15%] h-[40%] ${winnerColor} brightness-75 rounded-l-3xl shadow-lg transform rotate-6`}></div>
                         <div className={`absolute top-[40%] -right-[10%] w-[15%] h-[40%] ${winnerColor} brightness-75 rounded-r-3xl shadow-lg transform -rotate-6`}></div>
                    </div>
                )}
            </div>
            
            {/* Inject Custom CSS for this render */}
            <style>{`
               @keyframes victoryPan {
                   0% { transform: translateY(100%) scale(0.8); opacity: 0; }
                   100% { transform: translateY(0) scale(1); opacity: 1; }
               }
               @keyframes confetti {
                   0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                   25% { transform: translate(var(--vx), var(--vy)) rotate(90deg); opacity: 1; }
                   100% { transform: translate(calc(var(--vx) * 1.1), 600px) rotate(var(--rot)); opacity: 1; }
               }
            `}</style>
        </div>
      );
  };

  return (
    <div className="relative w-[800px] h-[450px] bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={450} 
        className="block w-full h-full"
      />

      {/* In-Game UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between">
        {/* Top HUD */}
        <div className="flex justify-between items-start w-full">
          {/* Player HP */}
          <div className="flex flex-col w-1/3 gap-1">
             <div className="flex justify-between text-cyan-400 font-bold text-sm">
                <span>PLAYER 1</span>
                <span>{Math.max(0, Math.ceil(gameState.player.hp))}%</span>
             </div>
             <div className="w-full h-4 bg-slate-800 rounded border border-slate-600 relative overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-100 ease-out" 
                  style={{ width: `${(gameState.player.hp / C.MAX_HP) * 100}%` }}
                />
             </div>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className={`text-4xl font-black ${gameState.timeRemaining < 10 ? 'text-red-500' : 'text-white'} drop-shadow-md`}>
              {gameState.timeRemaining}
            </div>
          </div>

          {/* CPU HP */}
          <div className="flex flex-col w-1/3 gap-1 items-end">
             <div className="flex justify-between w-full text-pink-400 font-bold text-sm">
                <span>{Math.max(0, Math.ceil(gameState.cpu.hp))}%</span>
                <span>CPU</span>
             </div>
             <div className="w-full h-4 bg-slate-800 rounded border border-slate-600 relative overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-100 ease-out absolute right-0" 
                  style={{ width: `${(gameState.cpu.hp / C.MAX_HP) * 100}%` }}
                />
             </div>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {gameState.gameStatus === 'MENU' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm pointer-events-auto">
              <h2 className="text-6xl font-black text-white mb-8 tracking-widest">READY?</h2>
              <button 
                onClick={restartGame}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xl rounded shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all transform hover:scale-105 active:scale-95"
              >
                START FIGHT
              </button>
        </div>
      )}

      {/* Game Over Screen */}
      {renderVictoryScreen()}

    </div>
  );
};

export default FightingGame;