/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Power, Speaker, Volume2, VolumeX } from 'lucide-react';

interface GBAFrameProps {
  children: React.ReactNode;
  onDpadPress: (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null) => void;
  onButtonPress: (btn: 'A' | 'B' | 'START' | 'SELECT') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  powerOn: boolean;
}

export const GBAFrame: React.FC<GBAFrameProps> = ({
  children,
  onDpadPress,
  onButtonPress,
  isMuted,
  onToggleMute,
  powerOn
}) => {

  // Visual button states (held state for active feedbacks)
  const [activeKeys, setActiveKeys] = React.useState<Record<string, boolean>>({});
  const [scale, setScale] = React.useState(1);

  useEffect(() => {
    const handleResize = () => {
      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;
      
      const targetWidth = 580;
      const targetHeight = 740;
      
      const paddingX = 24; 
      const paddingY = 48;
      
      const widthScale = parentWidth < targetWidth + paddingX ? (parentWidth - paddingX) / targetWidth : 1;
      const heightScale = parentHeight < targetHeight + paddingY ? (parentHeight - paddingY) / targetHeight : 1;
      
      const bestScale = Math.max(0.4, Math.min(1, widthScale, heightScale));
      setScale(bestScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      let keyMapped = '';

      if (e.key === 'ArrowLeft' || lowerKey === 'a') {
        onDpadPress('LEFT');
        keyMapped = 'left';
      } else if (e.key === 'ArrowRight' || lowerKey === 'd') {
        onDpadPress('RIGHT');
        keyMapped = 'right';
      } else if (e.key === 'ArrowUp' || lowerKey === 'w') {
        onDpadPress('UP');
        keyMapped = 'up';
      } else if (e.key === 'ArrowDown' || lowerKey === 's') {
        onDpadPress('DOWN');
        keyMapped = 'down';
      } else if (lowerKey === 'm' || lowerKey === 'z' || lowerKey === 'e' || lowerKey === 'c' || lowerKey === 'f' || lowerKey === 'j' || e.key === 'Enter') {
        onButtonPress('A');
        keyMapped = 'A';
      } else if (lowerKey === 'x' || e.key === ' ' || lowerKey === 'b') {
        onButtonPress('B');
        keyMapped = 'B';
      }

      if (keyMapped) {
        setActiveKeys((prev) => ({ ...prev, [keyMapped]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      let keyMapped = '';

      if (e.key === 'ArrowLeft' || lowerKey === 'a') {
        onDpadPress(null);
        keyMapped = 'left';
      } else if (e.key === 'ArrowRight' || lowerKey === 'd') {
        onDpadPress(null);
        keyMapped = 'right';
      } else if (e.key === 'ArrowUp' || lowerKey === 'w') {
        onDpadPress(null);
        keyMapped = 'up';
      } else if (e.key === 'ArrowDown' || lowerKey === 's') {
        onDpadPress(null);
        keyMapped = 'down';
      } else if (lowerKey === 'm' || lowerKey === 'z' || lowerKey === 'e' || lowerKey === 'c' || lowerKey === 'f' || lowerKey === 'j' || e.key === 'Enter') {
        keyMapped = 'A';
      } else if (lowerKey === 'x' || e.key === ' ' || lowerKey === 'b') {
        keyMapped = 'B';
      }

      if (keyMapped) {
        setActiveKeys((prev) => ({ ...prev, [keyMapped]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onDpadPress, onButtonPress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-neutral-100 font-sans p-2 sm:p-4 user-select-none select-none overflow-hidden">
      
      {/* Precision Scaled Console Holder: aligns perfectly in center and fits any viewport */}
      <div 
        className="relative flex items-center justify-center transition-all duration-100 ease-out"
        style={{
          width: `${580 * scale}px`,
          height: `${740 * scale}px`,
          minWidth: `${580 * scale}px`,
          minHeight: `${740 * scale}px`,
        }}
      >
        {/* Sleek Outer GBA console shell container */}
        <div 
          id="gba-console" 
          className="w-[580px] h-[740px] bg-indigo-900 border-8 border-indigo-950 rounded-[40px] shadow-2xl p-6 relative flex flex-col items-center justify-between"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            flexShrink: 0,
          }}
        >
        
        {/* Dynamic glossy reflections on glass screen borders */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-white/10 rounded-t-[32px] pointer-events-none" />

        {/* Brand visual header */}
        <div className="flex items-center justify-between w-full px-6 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h1 className="text-xs font-mono font-bold tracking-wider text-orange-400">HAIKYUU GBA SPECIAL</h1>
          </div>
          
          {/* Retro Power Switch LED indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-tighter text-neutral-400">POWER</span>
            <div className={`w-3 h-3 rounded-full border-2 border-indigo-950 shadow-inner ${powerOn ? 'bg-emerald-500 shadow-emerald-400' : 'bg-neutral-800'}`} />
          </div>
        </div>

        {/* Inner Dark Bezel Screen housing */}
        <div id="gba-screen-housing" className="w-full bg-neutral-950 rounded-2xl border-4 border-indigo-950 p-4 shadow-inner flex flex-col items-center">
          
          {/* Glass glare line */}
          <div className="w-full text-center text-[10px] font-mono tracking-widest text-neutral-500 mb-1 flex items-center justify-center gap-2">
            <span className="h-px bg-neutral-800 flex-1" />
            <span>GAME BOY ADVANCE SPECIAL EDITION</span>
            <span className="h-px bg-neutral-800 flex-1" />
          </div>

          {/* Actual game canvas placement slot */}
          <div className="w-full aspect-[4/3] bg-neutral-800 rounded-lg overflow-hidden relative border-2 border-neutral-900">
            {children}
          </div>
          
          {/* App title logo line */}
          <div className="w-full flex justify-between items-center text-[9px] font-mono text-neutral-600 mt-2 px-1">
            <span>VOLLEYBALL RPG - HAIKYUU!!</span>
            <div className="flex gap-1 items-center">
              <span>SOUND</span>
              <button 
                id="toggle-mute-btn"
                onClick={onToggleMute} 
                className="hover:text-indigo-400 transition cursor-pointer p-0.5"
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? <VolumeX size={12} className="text-rose-400" /> : <Volume2 size={12} className="text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Lower console physical button hardware panels */}
        <div className="w-full grid grid-cols-12 gap-2 mt-6 px-2 relative">
          
          {/* 1. D-PAD Controller (L/R/U/D Arrows) */}
          <div className="col-span-5 flex items-center justify-center">
            <div className="relative w-28 h-28 bg-neutral-800 rounded-full border-4 border-indigo-950 shadow-md flex items-center justify-center p-2">
              
              {/* D-Pad cross design */}
              <div className="absolute w-20 h-7 bg-indigo-950 rounded-md" />
              <div className="absolute w-7 h-20 bg-indigo-950 rounded-md" />

              {/* D-Pad controls actions */}
              {/* UP BUTTON */}
              <button
                id="dpad-up-btn"
                onMouseDown={() => onDpadPress('UP')}
                onMouseUp={() => onDpadPress(null)}
                onTouchStart={(e) => { e.preventDefault(); onDpadPress('UP'); }}
                onTouchEnd={(e) => { e.preventDefault(); onDpadPress(null); }}
                className={`absolute top-1.5 left-[42px] w-7 h-7 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded-t-sm active:bg-neutral-500 flex items-center justify-center cursor-pointer transition-colors shadow-sm ${activeKeys['up'] ? 'bg-amber-500 hover:bg-amber-500' : ''}`}
              >
                <span className="block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-neutral-400" />
              </button>

              {/* DOWN BUTTON */}
              <button
                id="dpad-down-btn"
                onMouseDown={() => onDpadPress('DOWN')}
                onMouseUp={() => onDpadPress(null)}
                onTouchStart={(e) => { e.preventDefault(); onDpadPress('DOWN'); }}
                onTouchEnd={(e) => { e.preventDefault(); onDpadPress(null); }}
                className={`absolute bottom-1.5 left-[42px] w-7 h-7 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded-b-sm active:bg-neutral-500 flex items-center justify-center cursor-pointer transition-colors shadow-sm ${activeKeys['down'] ? 'bg-amber-500 hover:bg-amber-500' : ''}`}
              >
                <span className="block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-neutral-400" />
              </button>

              {/* LEFT BUTTON */}
              <button
                id="dpad-left-btn"
                onMouseDown={() => { onDpadPress('LEFT'); }}
                onMouseUp={() => { onDpadPress(null); }}
                onTouchStart={(e) => { e.preventDefault(); onDpadPress('LEFT'); }}
                onTouchEnd={(e) => { e.preventDefault(); onDpadPress(null); }}
                className={`absolute left-1.5 top-[42px] w-7 h-7 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded-l-sm active:bg-neutral-500 flex items-center justify-center cursor-pointer transition-colors shadow-sm ${activeKeys['left'] ? 'bg-amber-500 hover:bg-amber-500' : ''}`}
              >
                <span className="block w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-neutral-400" />
              </button>

              {/* RIGHT BUTTON */}
              <button
                id="dpad-right-btn"
                onMouseDown={() => { onDpadPress('RIGHT'); }}
                onMouseUp={() => { onDpadPress(null); }}
                onTouchStart={(e) => { e.preventDefault(); onDpadPress('RIGHT'); }}
                onTouchEnd={(e) => { e.preventDefault(); onDpadPress(null); }}
                className={`absolute right-1.5 top-[42px] w-7 h-7 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded-r-sm active:bg-neutral-500 flex items-center justify-center cursor-pointer transition-colors shadow-sm ${activeKeys['right'] ? 'bg-amber-500 hover:bg-amber-500' : ''}`}
              >
                <span className="block w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-neutral-400" />
              </button>

              {/* Target center pivot circle */}
              <div className="w-5 h-5 bg-neutral-900 rounded-full z-10 shadow-inner" />
            </div>
          </div>

          {/* 2. Middle Retro Speaker Grills & Select/Start buttons */}
          <div className="col-span-3 flex flex-col justify-between py-2 items-center">
            
            {/* Round dynamic speaker holes grid */}
            <div className="flex gap-1.5 justify-center py-1 opacity-70">
              <Speaker size={18} className="text-neutral-500" />
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-950 border border-indigo-950" />
                ))}
              </div>
            </div>

            {/* Menu options triggers */}
            <div className="flex gap-3 justify-center pt-3">
              <div className="flex flex-col items-center">
                <button
                  id="select-btn"
                  onClick={() => onButtonPress('SELECT')}
                  className="w-10 h-3.5 bg-neutral-700 hover:bg-neutral-600 rounded-full border border-neutral-500 active:bg-neutral-500 transform rotate-[-25deg] shadow-lg cursor-pointer"
                />
                <span className="text-[7.5px] font-mono mt-1 text-neutral-400">SELECT</span>
              </div>
              <div className="flex flex-col items-center">
                <button
                  id="start-btn"
                  onClick={() => onButtonPress('START')}
                  className="w-10 h-3.5 bg-neutral-700 hover:bg-neutral-600 rounded-full border border-neutral-500 active:bg-neutral-500 transform rotate-[-25deg] shadow-lg cursor-pointer"
                />
                <span className="text-[7.5px] font-mono mt-1 text-neutral-400">START</span>
              </div>
            </div>
          </div>

          {/* 3. High feedback A and B buttons */}
          <div className="col-span-4 flex items-center justify-end">
            <div className="relative w-28 h-18 bg-neutral-800 rounded-3xl border-4 border-indigo-950 px-2 flex items-center justify-around shadow-inner transform rotate-[-12deg]">
              
              {/* B Button (Action 2/Cancel) */}
              <div className="flex flex-col items-center">
                <button
                  id="action-b-btn"
                  onClick={() => onButtonPress('B')}
                  className={`w-10 h-10 rounded-full bg-rose-700 hover:bg-rose-600 active:bg-rose-500 border-2 border-rose-900 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md cursor-pointer transition-colors ${activeKeys['B'] ? 'bg-orange-500 hover:bg-orange-500 border-orange-700' : ''}`}
                >
                  B
                </button>
                <span className="text-[8px] font-mono mt-1 text-neutral-400 tracking-wider">CANCEL</span>
              </div>

              {/* A Button (Primary Save/Bump/Select) */}
              <div className="flex flex-col items-center">
                <button
                  id="action-a-btn"
                  onClick={() => onButtonPress('A')}
                  className={`w-10 h-10 rounded-full bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-500 border-2 border-emerald-900 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md cursor-pointer transition-colors ${activeKeys['A'] ? 'bg-amber-400 hover:bg-amber-400 border-amber-600 text-indigo-950' : ''}`}
                >
                  M
                </button>
                <span className="text-[8px] font-mono mt-1 text-neutral-400 tracking-wider">M / Z BTN</span>
              </div>

            </div>
          </div>
        </div>

        {/* Keyboard instruction labels footer */}
        <div className="w-full flex flex-col gap-1 mt-6 pt-3 border-t border-indigo-950 text-[10px] font-mono text-neutral-400 px-2">
          <div className="flex justify-between items-center w-full">
            <span>🎮 keyboard controls:</span>
            <span className="text-right font-medium text-amber-400">Moves: WASD / Arrows</span>
          </div>
          <div className="flex justify-between items-center w-full text-[9px]">
            <span>Jump (B): Spacebar / X</span>
            <span className="text-right text-amber-300">Receive / Story (A): M button</span>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
};
