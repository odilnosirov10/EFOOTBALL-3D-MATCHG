/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { MatchEngine } from '../game/MatchEngine';
import { MatchSetting, MatchStats } from '../types/football';
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft, Joystick, HelpCircle } from 'lucide-react';
import { soundManager } from '../game/StadiumSoundManager';

interface GameCanvasProps {
  settings: MatchSetting;
  onMatchFinished: (userRating: number, userGoals: number, aiGoals: number, stats: MatchStats) => void;
  onQuit: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ settings, onMatchFinished, onQuit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const matchEngineRef = useRef<MatchEngine | null>(null);

  // Score Stats
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Game Commentary state
  const [commentary, setCommentary] = useState<string[]>(["Welcome to the Arena. Kickoff initiated!"]);
  
  // High-frequency live stats ref to avoid 60fps re-renders of the entire HUD card component
  const liveStatsRef = useRef<MatchStats>({
    possession: 50, shots: 0, shotsOnTarget: 0, passes: 0, completedPasses: 0, tackles: 0, fouls: 0, goals: 0
  });

  // Sound triggers state
  const [muted, setMuted] = useState(false);

  // Touch Virtual Joystick properties
  const joystickOuterRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isHoldingJoystick = useRef(false);

  // Game loop tracking
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const matchTimerRef = useRef<number>(0); // total elapsed match seconds

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize MatchEngine
    const matchEngine = new MatchEngine(containerRef.current, {
      userTeam: settings.userTeam,
      aiTeam: settings.aiTeam,
      weather: settings.weather,
      difficulty: settings.difficulty
    });

    matchEngine.registerCallbacks({
      onGoal: (scorer, uScore, aScore) => {
        setUserScore(uScore);
        setAiScore(aScore);
      },
      onCommentary: (text) => {
        setCommentary(prev => [text, ...prev.slice(0, 15)]);
      },
      onStats: (stats) => {
        liveStatsRef.current = { ...stats };
      },
      onSelectPlayer: (name, stam) => {
        // Fast direct DOM update to instantly display newly selected player name & stamina on selector change
        const nameNode = document.getElementById('card_player_name');
        const stamTextNode = document.getElementById('card_player_stamina_text');
        const stamBarNode = document.getElementById('card_player_stamina_bar');
        if (nameNode) nameNode.textContent = name;
        const rounded = Math.round(stam);
        if (stamTextNode) stamTextNode.textContent = `${rounded}% Stam`;
        if (stamBarNode) stamBarNode.style.width = `${rounded}%`;
      }
    });

    matchEngineRef.current = matchEngine;

    // Listeners for Desktop Keyboard Control
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      const key = e.key.toLowerCase();
      
      // Sprint
      if (e.key === 'Shift') {
        matchEngine.handleSprint(true);
      }
      // Pass / Slide Tackle
      if (key === ' ' || key === 'd' || key === 'j') {
        matchEngine.handlePass();
      }
      // Shoot
      if (key === 'f' || key === 'k') {
        matchEngine.handleShoot();
      }
      // Through pass
      if (key === 'g' || key === 'i') {
        matchEngine.handleThroughBall();
      }
      // Switch player manual
      if (key === 'q' || key === 'c') {
        matchEngine.manualSwitch();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        matchEngine.handleSprint(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Keyboard Continuous Movement poll (WASD / Arrows)
    const activeKeys = new Set<string>();
    const handleMoveKeyDown = (e: KeyboardEvent) => {
      activeKeys.add(e.key.toLowerCase());
      updateMovementFromKeys();
    };
    const handleMoveKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key.toLowerCase());
      updateMovementFromKeys();
    };

    const updateMovementFromKeys = () => {
      let dx = 0;
      let dz = 0;
      if (activeKeys.has('w') || activeKeys.has('arrowup')) dz = -1.0;
      if (activeKeys.has('s') || activeKeys.has('arrowdown')) dz = 1.0;
      if (activeKeys.has('a') || activeKeys.has('arrowleft')) dx = -1.0;
      if (activeKeys.has('d') || activeKeys.has('arrowright')) dx = 1.0;

      // Normalize direction vector
      if (dx !== 0 && dz !== 0) {
        const length = Math.sqrt(dx*dx + dz*dz);
        dx /= length;
        dz /= length;
      }
      
      // Pass direction to physics engine
      matchEngine.handleMove(dx, dz);
    };

    window.addEventListener('keydown', handleMoveKeyDown);
    window.addEventListener('keyup', handleMoveKeyUp);

    // Game loop tick and timer progress
    const gameLoop = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const delta = Math.min((time - previousTimeRef.current) / 1000, 0.1); // cap physics step to 100ms
        
        if (!isPaused) {
          // Progress Virtual Match Timer (Accelerated)
          // 45 virtual minutes per half = ~1 min real-time.
          matchTimerRef.current += delta;
          const totalVirtualMinutes = Math.floor(matchTimerRef.current * 1.8);
          
          if (totalVirtualMinutes >= 90) {
            // Full time blown!
            soundManager.playWhistle(true);
            soundManager.playWhistle(true);
            cleanupMatchAndFinish();
            return;
          }

          // Direct DOM updates for timer clock elements (skips React state/renders for 60fps clock ticks)
          const minsNode = document.getElementById('score_time_mins');
          const secsNode = document.getElementById('score_time_secs');
          if (minsNode) {
            const minsStr = (totalVirtualMinutes % 90).toString().padStart(2, '0');
            if (minsNode.textContent !== minsStr) minsNode.textContent = minsStr;
          }
          if (secsNode) {
            const secsStr = Math.floor((matchTimerRef.current * 60) % 60).toString().padStart(2, '0');
            if (secsNode.textContent !== secsStr) secsNode.textContent = secsStr;
          }

          // Physical engine update tick
          matchEngine.tick(delta);

          // Direct DOM updates for active footballer stamina & name (skips React state updates during sprint/runs)
          const activePl = matchEngine.getActivePlayer();
          if (activePl) {
            const nameNode = document.getElementById('card_player_name');
            const stamTextNode = document.getElementById('card_player_stamina_text');
            const stamBarNode = document.getElementById('card_player_stamina_bar');
            
            if (nameNode && nameNode.textContent !== activePl.name) {
              nameNode.textContent = activePl.name;
            }
            const roundedStamina = Math.round(activePl.stamina);
            if (stamTextNode) {
              const stamStr = `${roundedStamina}% Stam`;
              if (stamTextNode.textContent !== stamStr) stamTextNode.textContent = stamStr;
            }
            if (stamBarNode) {
              stamBarNode.style.width = `${roundedStamina}%`;
            }
          }

          // Draw radar map
          drawRadarMap(matchEngine);
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    // Handle container resize
    const handleResize = () => {
      if (containerRef.current && matchEngine) {
        matchEngine.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Final cleanups
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleMoveKeyDown);
      window.removeEventListener('keyup', handleMoveKeyUp);
      window.removeEventListener('resize', handleResize);
      matchEngine.cleanup();
    };
  }, [settings, isPaused]);

  // Clean finish triggers when match completes ninety minutes limit
  const cleanupMatchAndFinish = () => {
    cancelAnimationFrame(requestRef.current);
    const rating = Math.min(10, Math.round(5.5 + userScore * 1.5 - aiScore * 0.5));
    onMatchFinished(rating, userScore, aiScore, liveStatsRef.current);
  };

  const toggleSound = () => {
    const isMuted = !muted;
    setMuted(isMuted);
    soundManager.setMute(isMuted);
  };

  // Draw HUD 2D radar overlay coordinates
  const drawRadarMap = (engine: MatchEngine) => {
    const canvas = radarRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw field background bounds outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    
    // Draw center dividing circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 14, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 3);
    ctx.lineTo(canvas.width / 2, canvas.height - 3);
    ctx.stroke();

    // Map Coordinates multipliers
    // Field ranges: X is width (-this.FIELD_H/2 to this.FIELD_H/2), Z is depth (-this.GOAL_Z to this.GOAL_Z)
    // Radar margins: X coordinates mapped to radar height, Z coordinates mapped to radar width
    const mapZToX = (z: number) => {
      const normZ = (z + 38.0) / 76.0; // scale 0-1
      return 4 + normZ * (canvas.width - 8);
    };

    const mapXToY = (x: number) => {
      const normX = (x + 23.0) / 46.0; // scale 0-1
      return 4 + normX * (canvas.height - 8);
    };

    // Draw footballers dots
    const players = engine.getPlayersList();
    const activePl = engine.getActivePlayer();
    const activePlName = activePl ? activePl.name : '';
    players.forEach(p => {
      const px = mapZToX(p.z);
      const py = mapXToY(p.x);

      ctx.beginPath();
      ctx.arc(px, py, p.teamId === 'user' ? 3.2 : 3.0, 0, Math.PI * 2);
      ctx.fillStyle = p.teamId === 'user' ? (p.isGoalkeeper ? '#eab308' : '#10b981') : '#ec4899';
      ctx.fill();
      
      // Highlight active with a small outer halo stroke
      if (p.teamId === 'user' && p.name === activePlName) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    });

    // Draw physical soccer ball dot
    const ball = engine.getBallPhys();
    const bx = mapZToX(ball.z);
    const by = mapXToY(ball.x);

    ctx.beginPath();
    ctx.arc(bx, by, 3.6, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  };

  // Virtual analog stick drag handling for mobile screen actions
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!joystickOuterRef.current) return;
    isHoldingJoystick.current = true;
    const rect = joystickOuterRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Anchor center coords
    touchStartPos.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isHoldingJoystick.current || !matchEngineRef.current) return;
    const touch = e.touches[0];

    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxRadius = 32;

    const angle = Math.atan2(dy, dx);
    const clampDist = Math.min(dist, maxRadius);

    // Position knob element visually
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${Math.cos(angle) * clampDist}px, ${Math.sin(angle) * clampDist}px)`;
    }

    // Map to normalized physical direction (note: screen Y is opposite of absolute math depth coordinates)
    const normX = Math.cos(angle) * (clampDist / maxRadius);
    const normY = Math.sin(angle) * (clampDist / maxRadius);
    
    // We map joystick X to match fields X drift, Y to matches fields Z depth drift
    matchEngineRef.current.handleMove(normX, normY);
  };

  const handleTouchEnd = () => {
    isHoldingJoystick.current = false;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = 'translate(0px, 0px)';
    }
    if (matchEngineRef.current) {
      matchEngineRef.current.handleMove(0, 0);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans" id="match_screen_frame">
      {/* SCORES HUD STATUS BAR */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-slate-900/85 backdrop-blur-md rounded-xl py-3 px-6 border border-slate-800 shadow-xl" id="hud_score_bar">
        {/* Teams and Main Score */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: settings.userTeam.primaryColor }}></span>
            <span className="text-white font-bold text-lg tracking-wider" id="score_home_team">{settings.userTeam.shortName}</span>
          </div>

          <div className="bg-slate-950 font-mono font-bold text-xl px-4 py-1.5 rounded-lg text-emerald-400 tracking-widest border border-slate-800" id="score_digits">
            {userScore} - {aiScore}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-200 font-bold text-lg tracking-wider" id="score_away_team">{settings.aiTeam.shortName}</span>
            <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: settings.aiTeam.primaryColor }}></span>
          </div>
        </div>

        {/* Dynamic Match Clock timer & weather indicator */}
        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 font-mono tracking-widest text-emerald-400 font-bold" id="score_time">
            <span id="score_time_mins">00</span>
            <span className="animate-pulse">:</span>
            <span id="score_time_secs">00</span>
          </div>
          
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-slate-400 capitalize font-medium">{settings.weather} Stadium</span>
            <span className="text-[10px] text-emerald-500 font-mono font-semibold uppercase">{settings.difficulty}</span>
          </div>

          {/* Sound Controls Button */}
          <button onClick={toggleSound} className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-300 transition-colors" id="btn_toggle_hud_snd">
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          
          {/* Pause Trigger Button */}
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="px-3.5 py-1.5 font-bold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 transition" 
            id="btn_pause_match"
          >
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </div>

      {/* THREE.JS CONTAINER BOX */}
      <div 
        ref={containerRef} 
        className="w-full flex-grow relative overflow-hidden" 
        style={{ height: 'calc(100% - 140px)' }}
        id="renderer_viewport"
      />

      {/* RADAR MAP OVERLAY PANEL */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-slate-800/80 shadow-2xl flex flex-col items-center" id="hud_radar_panel">
        <canvas ref={radarRef} width={180} height={110} className="rounded bg-slate-950 border border-slate-900 shadow-inner" />
        <span className="text-[10px] text-slate-500 font-mono font-semibold uppercase mt-2 tracking-widest">Tactical 2D Radar</span>
      </div>

      {/* REAL-TIME TEXT DIRECT COMMENTARY FEED */}
      <div className="absolute top-20 right-6 z-10 w-80 max-h-48 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-xl overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 text-xs text-slate-300 flex flex-col space-y-2 select-none" id="hud_commentary_hub">
        <div className="text-[10.5px] font-bold text-emerald-400 tracking-wider uppercase border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>Live Broadcast Commentary</span>
          <span className="animate-ping w-2 h-2 rounded-full bg-rose-500"></span>
        </div>
        <div className="flex flex-col space-y-2 h-full justify-start mt-2">
          {commentary.map((comm, idx) => (
            <p key={idx} className={`leading-relaxed py-1 px-2 rounded-md ${idx === 0 ? 'bg-emerald-950/45 text-slate-100 font-medium border-l-2 border-emerald-500 animate-fadeIn' : 'text-slate-400 opacity-75'}`}>
              {comm}
            </p>
          ))}
        </div>
      </div>

      {/* CURRENT FOOTBALLER STAMINA CARD */}
      <div className="absolute bottom-6 right-6 z-10 min-w-56 bg-gradient-to-r from-slate-900 to-slate-950 backdrop-blur-md rounded-xl p-4 border border-slate-800/80 shadow-2xl flex flex-col space-y-2" id="hud_active_card">
        <div className="flex justify-between items-center font-bold text-sm">
          <span className="text-white hover:text-emerald-400 transition tracking-wide text-ellipsis overflow-hidden" id="card_player_name">L. Messi</span>
          <span className="text-emerald-400 font-mono text-xs" id="card_player_stamina_text">100% Stam</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/50">
          <div 
            id="card_player_stamina_bar"
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full" 
            style={{ width: `100%` }} 
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
          <span className="font-mono uppercase tracking-widest font-semibold flex items-center text-emerald-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            User Control Active
          </span>
          <button 
            onClick={() => setShowHelp(true)} 
            className="flex items-center space-x-1 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 py-1 px-2 rounded border border-slate-800 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-0.5 text-slate-300" />
            <span>Controls</span>
          </button>
        </div>
      </div>

      {/* PAUSE BLOCK OVERLAY SCREEN */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg z-30 flex flex-col justify-center items-center select-none" id="pause_lock_overlay">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center max-w-sm shadow-2xl space-y-6">
            <h3 className="text-2xl font-black text-white tracking-widest">MATCH PAUSED</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Adjust your team strategy mentally or resume when you are fully focused.</p>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => setIsPaused(false)} 
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all"
                id="btn_resume_match_overlay"
              >
                RESUME PLAY
              </button>
              
              <button 
                onClick={onQuit} 
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all"
                id="btn_forfeit_match_overlay"
              >
                FORFEIT & QUIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS GUIDE OVERLAY MODAL */}
      {showHelp && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex flex-col justify-center items-center p-4" id="controls_guide_overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Controls Reference Sheet</h3>
            
            <div className="space-y-4 text-slate-300 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/50 font-mono">
                <div>
                  <h4 className="text-emerald-400 font-bold mb-2">PC KEYBOARD</h4>
                  <p className="mb-1"><span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">WASD</span> / <span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Arrows</span>: Move</p>
                  <p className="mb-1"><span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Shift</span>: Sprint</p>
                  <p className="mb-1"><span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Space</span> / <span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">D</span>: Pass</p>
                  <p className="mb-1"><span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">F</span>: Shoot</p>
                  <p className="mb-1"><span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">G</span>: Through Ball</p>
                  <p className="mb-1"><span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Q</span> / <span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">C</span>: Switch active cursor</p>
                </div>
                <div>
                  <h4 className="text-rose-400 font-bold mb-2">MOBILE TOUCH</h4>
                  <p className="mb-1">Virtual joystick (bottom-right) to run.</p>
                  <p className="mb-1">Tap buttons contextual keys on HUD footer layout.</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed italic text-center">Tips: Goalkeeper dives automatically depending on shot lines. Stay close to ball carriers to clean tackle them!</p>
            </div>

            <button 
              onClick={() => setShowHelp(false)} 
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-bold text-white rounded-xl transition"
            >
              CLOSE GUIDE
            </button>
          </div>
        </div>
      )}

      {/* MOBILE HUD ACTIONS BAR (Only visible on responsive layout bounds) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex space-x-3 bg-slate-900/75 backdrop-blur-md rounded-2xl p-2.5 border border-slate-800 shadow-xl max-w-sm w-fit" id="mobile_hud_actions_bar">
        <button 
          onClick={() => matchEngineRef.current?.handlePass()} 
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow border border-emerald-500/30 transition-all"
        >
          PASS
        </button>
        <button 
          onClick={() => matchEngineRef.current?.handleShoot()} 
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow border border-rose-500/30 transition-all"
        >
          SHOOT
        </button>
        <button 
          onClick={() => matchEngineRef.current?.handleThroughBall()} 
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow border border-teal-500/30 transition-all"
        >
          THRU
        </button>
        <button 
          onMouseDown={() => matchEngineRef.current?.handleSprint(true)}
          onMouseUp={() => matchEngineRef.current?.handleSprint(false)}
          onTouchStart={() => matchEngineRef.current?.handleSprint(true)}
          onTouchEnd={() => matchEngineRef.current?.handleSprint(false)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow border border-sky-500/30 transition-all select-none"
        >
          SPRINT
        </button>
        <button 
          onClick={() => matchEngineRef.current?.manualSwitch()} 
          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-extrabold text-xs rounded-xl shadow-inner transition-all"
        >
          SWITCH
        </button>
      </div>

      {/* MOBILE FLOATING INTERACTIVE JOYSTICK (Bottom Right corner absolute wrapper) */}
      <div className="absolute md:hidden bottom-24 right-6 z-10 w-24 h-24 bg-slate-900/50 backdrop-blur rounded-full border border-slate-800/80 shadow-2xl flex items-center justify-center pointer-events-auto" id="hud_floating_joystick">
        <div 
          ref={joystickOuterRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-20 h-20 bg-slate-950/80 rounded-full border border-slate-800 flex items-center justify-center cursor-pointer relative"
        >
          <div 
            ref={joystickKnobRef}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border border-teal-300 shadow-md transition-transform duration-75 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
