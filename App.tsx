import React from 'react';
import FightingGame from './components/FightingGame';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
      <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
        NEON FIGHTER
      </h1>
      <FightingGame />
      <div className="mt-8 text-slate-400 text-sm max-w-2xl text-center space-y-2">
        <p className="font-bold text-slate-200">CONTROLS</p>
        <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-cyan-400 font-bold">MOVEMENT</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">W</kbd> Jump</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">A</kbd> Left</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">D</kbd> Right</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">S</kbd> Crouch / Block (Hold Back)</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-purple-400 font-bold">ATTACKS</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">J</kbd> Punch (Fast)</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">K</kbd> Kick (Range)</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">L</kbd> Charge (Heavy)</span>
            <span><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">H</kbd> Grab (Beats Block)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;