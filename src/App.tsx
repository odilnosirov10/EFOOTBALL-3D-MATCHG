/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameMode, Team, MatchSetting, StandingsRow, MatchStats, Player, WeatherType, DifficultyType } from './types/football';
import { TEAMS, STAR_PLAYERS } from './game/SquadData';
import { GameCanvas } from './components/GameCanvas';
import { TransferMarket } from './components/TransferMarket';
import { TacticsManager } from './components/TacticsManager';
import { CareerModeDashboard } from './components/CareerModeDashboard';
import { OnlineLobby } from './components/OnlineLobby';
import { TrainingDrills } from './components/TrainingDrills';
import { soundManager } from './game/StadiumSoundManager';
import { Trophy, Users, ShieldAlert, Sparkles, UserCheck, Play, ArrowLeft, Volume2, VolumeX, Lightbulb, Gamepad2, Settings } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [userTeam, setUserTeam] = useState<Team>(() => {
    // Clone starting Madrid White as user default
    return JSON.parse(JSON.stringify(TEAMS[0]));
  });
  
  // Financial, Statistics & stand state
  const [coins, setCoins] = useState<number>(300); // startup coins budget
  const [matchesPlayed, setMatchesPlayed] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [standings, setStandings] = useState<StandingsRow[]>(() => {
    return TEAMS.map(t => ({
      teamName: t.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    }));
  });

  // Active match structures
  const [activeMatchSetting, setActiveMatchSetting] = useState<MatchSetting | null>(null);
  
  // Post match summary overlay state
  const [postMatchStats, setPostMatchStats] = useState<{
    userRating: number;
    userGoals: number;
    aiGoals: number;
    stats: MatchStats;
    coinsEarned: number;
  } | null>(null);

  // Friendly setup options
  const [friendlyOpponent, setFriendlyOpponent] = useState<Team>(TEAMS[1]); // MNR default friendly op
  const [friendlyWeather, setFriendlyWeather] = useState<WeatherType>('sunny');
  const [friendlyDifficulty, setFriendlyDifficulty] = useState<DifficultyType>('professional');

  // Mute configs
  const [isMuted, setIsMuted] = useState(false);

  // Sync with localStorage career data if present
  useEffect(() => {
    const saved = localStorage.getItem('pro_football_save_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.coins !== undefined) setCoins(parsed.coins);
        if (parsed.matchesPlayed !== undefined) setMatchesPlayed(parsed.matchesPlayed);
        if (parsed.currentRound !== undefined) setCurrentRound(parsed.currentRound);
        if (parsed.standings !== undefined) setStandings(parsed.standings);
        if (parsed.userTeam !== undefined) setUserTeam(parsed.userTeam);
      } catch (e) {
        console.error("Failed loading local career save:", e);
      }
    }
  }, []);

  const saveCareerProgress = (
    nextCoins: number, 
    nextMatches: number, 
    nextRound: number, 
    nextStandings: StandingsRow[], 
    nextTeam: Team
  ) => {
    try {
      const data = {
        coins: nextCoins,
        matchesPlayed: nextMatches,
        currentRound: nextRound,
        standings: nextStandings,
        userTeam: nextTeam
      };
      localStorage.setItem('pro_football_save_v1', JSON.stringify(data));
    } catch (e) {
      console.warn("Storage limits or error saving game:", e);
    }
  };

  const toggleSoundMute = () => {
    const nextM = !isMuted;
    setIsMuted(nextM);
    soundManager.setMute(nextM);
  };

  // Launch standard kickoff friendly match
  const handleStartFriendlyMatch = () => {
    setActiveMatchSetting({
      userTeam,
      aiTeam: friendlyOpponent,
      weather: friendlyWeather,
      difficulty: friendlyDifficulty,
      matchLengthMinutes: 5,
      mode: 'friendly'
    });
    setMode('match');
  };

  // Handle post match computations
  const receiveMatchFinishingStats = (userRating: number, userGoals: number, aiGoals: number, stats: MatchStats) => {
    // 1. Calculate Payouts
    const winBonus = userGoals > aiGoals ? 120 : (userGoals === aiGoals ? 50 : 25);
    const goalBonus = userGoals * 30;
    const totalAward = winBonus + goalBonus;
    
    const updatedCoins = coins + totalAward;
    setCoins(updatedCoins);

    const nextMatches = matchesPlayed + 1;
    setMatchesPlayed(nextMatches);

    // 2. Adjust standing rows if career mode triggered
    let nextRoundVal = currentRound;
    let nextStand = [...standings];

    if (activeMatchSetting?.mode === 'career_league') {
      nextRoundVal = currentRound + 1;
      setCurrentRound(nextRoundVal);

      // Mutate league standings
      nextStand = standings.map(row => {
        // User club update
        if (row.teamName === userTeam.name) {
          const played = row.played + 1;
          const won = row.won + (userGoals > aiGoals ? 1 : 0);
          const drawn = row.drawn + (userGoals === aiGoals ? 1 : 0);
          const lost = row.lost + (userGoals < aiGoals ? 1 : 0);
          const points = row.points + (userGoals > aiGoals ? 3 : (userGoals === aiGoals ? 1 : 0));
          const gf = row.gf + userGoals;
          const ga = row.ga + aiGoals;
          const gd = gf - ga;
          return { teamName: row.teamName, played, won, drawn, lost, gf, ga, gd, points };
        }
        // AI match opposition update
        if (row.teamName === activeMatchSetting.aiTeam.name) {
          const played = row.played + 1;
          const won = row.won + (aiGoals > userGoals ? 1 : 0);
          const drawn = row.drawn + (aiGoals === userGoals ? 1 : 0);
          const lost = row.lost + (aiGoals < userGoals ? 1 : 0);
          const points = row.points + (aiGoals > userGoals ? 3 : (aiGoals === userGoals ? 1 : 0));
          const gf = row.gf + aiGoals;
          const ga = row.ga + userGoals;
          const gd = gf - ga;
          return { teamName: row.teamName, played, won, drawn, lost, gf, ga, gd, points };
        }

        // Simulate other neutral teams matches (semi random)
        const simPlayed = row.played + 1;
        const roll = Math.random();
        let won = row.won;
        let drawn = row.drawn;
        let lost = row.lost;
        let pts = row.points;
        let simGf = row.gf + Math.floor(Math.random() * 3);
        let simGa = row.ga + Math.floor(Math.random() * 3);

        if (roll < 0.45) {
          won++;
          pts += 3;
        } else if (roll < 0.75) {
          drawn++;
          pts += 1;
        } else {
          lost++;
        }
        return { 
          teamName: row.teamName, 
          played: simPlayed, 
          won, drawn, lost, 
          gf: simGf, ga: simGa, 
          gd: simGf - simGa, 
          points: pts 
        };
      });

      // Maintain dynamic sorted leaderboard structure
      nextStand.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
      setStandings(nextStand);
    }

    // Save persistently to memory
    saveCareerProgress(updatedCoins, nextMatches, nextRoundVal, nextStand, userTeam);

    setPostMatchStats({
      userRating,
      userGoals,
      aiGoals,
      stats,
      coinsEarned: totalAward
    });

    setMode('post_match');
  };

  // Transfer sign purchase handles
  const handleBuyPlayer = (p: Player) => {
    const updatedPlayers = [...userTeam.players, { ...p, isSquadMember: true }];
    const nextCoins = coins - p.marketValue;
    
    const updatedTeam = {
      ...userTeam,
      players: updatedPlayers
    };

    setUserTeam(updatedTeam);
    setCoins(nextCoins);
    saveCareerProgress(nextCoins, matchesPlayed, currentRound, standings, updatedTeam);
  };

  // Transfer sell triggers
  const handleSellPlayer = (playerId: string, refundValue: number) => {
    const updatedPlayers = userTeam.players.filter(p => p.id !== playerId);
    const nextCoins = coins + refundValue;

    const updatedTeam = {
      ...userTeam,
      players: updatedPlayers
    };

    setUserTeam(updatedTeam);
    setCoins(nextCoins);
    saveCareerProgress(nextCoins, matchesPlayed, currentRound, standings, updatedTeam);
  };

  // Manage tactical changes details
  const handleUpdateTactics = (t: any, m: any) => {
    const updatedTeam = {
      ...userTeam,
      tactic: t,
      mentality: m
    };
    setUserTeam(updatedTeam);
    saveCareerProgress(coins, matchesPlayed, currentRound, standings, updatedTeam);
  };

  // Reset Career progress handler
  const handleResetCareer = () => {
    const confirm = window.confirm("Are you sure you want to reset your Club Career? ALL stars, signings, coins, and standing standings will be fully wiped.");
    if (confirm) {
      localStorage.removeItem('pro_football_save_v1');
      setUserTeam(JSON.parse(JSON.stringify(TEAMS[0])));
      setCoins(300);
      setMatchesPlayed(0);
      setCurrentRound(0);
      setStandings(TEAMS.map(t => ({
        teamName: t.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0
      })));
      alert("Career reset completed successfully.");
    }
  };

  return (
    <div className="w-screen h-screen bg-[#070b13] flex flex-col overflow-hidden text-slate-100 font-sans" id="app_frame">
      {/* GLOBAL BACKGROUND GLOW GRADIENTS */}
      <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/5 blur-[140px] pointer-events-none" />

      {/* CORE ROUTING SWITCHBOARD VIEWS */}

      {/* VIEW: MAIN HOME MENU */}
      {mode === 'menu' && (
        <div className="flex-grow flex flex-col p-6 overflow-y-auto" id="main_menu_scene">
          {/* TOP BAR BRAND */}
          <div className="flex justify-between items-center border-b border-slate-900 pb-5 mb-8" id="menu_top_bar">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 text-white font-black px-3 py-1.5 rounded-lg text-sm tracking-widest shadow-lg shadow-emerald-900/30">
                APEX
              </div>
              <h1 className="text-xl font-black tracking-[0.16em] uppercase text-white">eFootball 3D Match</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sound toggle button */}
              <button 
                onClick={toggleSoundMute} 
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-350 transition-colors"
                id="btn_g_mute"
              >
                {isMuted ? <VolumeX className="w-4.5 h-4.5 text-rose-400 animate-pulse" /> : <Volume2 className="w-4.5 h-4.5 text-emerald-400" />}
              </button>
              
              <button 
                onClick={handleResetCareer}
                className="text-[10px] text-slate-500 hover:text-rose-400 font-mono tracking-wider transition uppercase"
                id="btn_wipe_save_g"
              >
                Reset Career Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full flex-grow items-start pb-8" id="menu_bento_grid">
            {/* LEFT COLUMN: HERO GAME LAUNCHERS */}
            <div className="lg:col-span-2 space-y-6" id="menu_launchers_col">
              
              {/* STAGE HERO CONTAINER BANNER */}
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden shadow-2xl flex flex-col justify-between min-h-60" id="hero_pitch_banner">
                <div className="absolute top-0 right-0 w-[55%] h-full opacity-10 pointer-events-none">
                  {/* Procedural lines representing football goal vector */}
                  <div className="w-full h-full border-r-4 border-t-4 border-emerald-500/40 rounded-tr-3xl rotate-12 transform scale-125 translate-x-12 translate-y-6"></div>
                </div>

                <div className="space-y-3 z-10">
                  <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">Active Season Engine</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white max-w-lg leading-none">
                    LEAD YOUR CLUB SQUAD TO CRITICAL CONQUESTS
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Test your tactical lineups inside immersive 3D arenas. Experience ball physics, procedural dynamic commentators, and transfer real stars.
                  </p>
                </div>

                <div className="pt-6 z-10 flex flex-wrap gap-3">
                  <button 
                    onClick={() => setMode('career')}
                    className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs tracking-widest uppercase rounded-xl transition active:scale-[0.98] shadow-lg shadow-emerald-950/40 flex items-center space-x-2"
                    id="btn_hero_career"
                  >
                    <Trophy className="w-4 h-4 text-emerald-100" />
                    <span>LAUNCH CAREER MODE</span>
                  </button>
                  <button 
                    onClick={() => setMode('online_lobby')}
                    className="py-3 px-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 font-black text-xs tracking-widest uppercase rounded-xl transition"
                    id="btn_hero_online"
                  >
                    ONLINE LOBBIES
                  </button>
                </div>
              </div>

              {/* FRIENDLY DIRECT KICKOFF WORKFLOW */}
              <div className="bg-slate-900/40 border border-slate-900/80 rounded-2xl p-6 space-y-5 shadow-lg" id="friendly_setup_box">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Quickmatch friendly Setup</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="friendly_setup_grid">
                  {/* Select Opponent Team */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Select Opponent</label>
                    <select 
                      value={friendlyOpponent.id}
                      onChange={(e) => {
                        const selected = TEAMS.find(t => t.id === e.target.value);
                        if (selected) setFriendlyOpponent(selected);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 transition-colors"
                      id="opt_friendly_opp"
                    >
                      {TEAMS.filter(t => t.id !== userTeam.id).map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Atmospheric Weather */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Weather environment</label>
                    <select 
                      value={friendlyWeather}
                      onChange={(e) => setFriendlyWeather(e.target.value as WeatherType)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 transition-colors"
                      id="opt_friendly_weather"
                    >
                      <option value="sunny">Sunny day Match</option>
                      <option value="rainy">Rainy slippery turf</option>
                      <option value="night">Floodlit night arena</option>
                    </select>
                  </div>

                  {/* Select Difficulty Level */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Difficulty strength</label>
                    <select 
                      value={friendlyDifficulty}
                      onChange={(e) => setFriendlyDifficulty(e.target.value as DifficultyType)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 transition-colors"
                      id="opt_friendly_diff"
                    >
                      <option value="amateur">Amateur (Warmup)</option>
                      <option value="professional">Professional (Standard)</option>
                      <option value="superstar">Superstar (Intense AI)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleStartFriendlyMatch}
                  className="w-full py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black tracking-widest text-[#10b981] hover:bg-emerald-950/20 hover:border-emerald-500/40 transition active:scale-[0.98]"
                  id="btn_kick_friendly"
                >
                  START QUICKMATCH FRIENDLY
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: RECT SQUAD STATS SUMMARY CARD */}
            <div className="space-y-6" id="menu_squad_col">
              {/* CURRENT CLUB SQUAD SUMMARY CARD */}
              <div className="bg-gradient-to-b from-slate-905 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[340px]" id="squad_summary_sidepanel">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">SQUAD OVERLOAD</h3>
                    <span className="font-mono text-xs bg-slate-900 text-amber-500 px-2 py-0.5 rounded font-bold">{userTeam.players.length} Players</span>
                  </div>

                  {/* Team details stats representation */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2.5 shadow-inner" id="my_club_metrics">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-450 uppercase tracking-wider font-semibold">CLUB NAME:</span>
                      <span className="text-white font-bold">{userTeam.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                      <span className="text-slate-450 uppercase tracking-wider font-semibold">FORMATIONS SHEP:</span>
                      <span className="text-slate-200 font-bold">{userTeam.tactic}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                      <span className="text-slate-450 uppercase tracking-wider font-semibold">TREASURY COINS:</span>
                      <span className="text-emerald-400 font-mono font-extrabold">{coins} units</span>
                    </div>
                  </div>

                  {/* Short squad list review scroll box */}
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {userTeam.players.slice(0, 5).map(sq => (
                      <div key={sq.id} className="flex justify-between items-center bg-slate-900/60 pin-4 px-3 py-2 rounded-lg text-xs hover:bg-slate-900 transition-colors">
                        <span className="font-medium text-slate-200">{sq.name}</span>
                        <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">{sq.role} ({sq.stats.overall})</span>
                      </div>
                    ))}
                    {userTeam.players.length > 5 && (
                      <p className="text-center text-[10px] text-slate-500 font-mono italic">Plus {userTeam.players.length - 5} more squad footballers</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900">
                  <button 
                    onClick={() => {
                      soundManager.startCrowd();
                      setMode('management');
                    }}
                    className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-[10.5px] uppercase tracking-widest rounded-xl transition border border-slate-800"
                    id="btn_g_manage"
                  >
                    Tactics
                  </button>
                  <button 
                    onClick={() => {
                      soundManager.startCrowd();
                      setMode('transfer_market');
                    }}
                    className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-[10.5px] uppercase tracking-widest rounded-xl transition border border-slate-800"
                    id="btn_g_transfers"
                  >
                    Transfer
                  </button>
                </div>
              </div>

              {/* Academy Card */}
              <button 
                onClick={() => setMode('training')}
                className="w-full bg-slate-900/40 hover:bg-slate-900 border border-slate-900/80 hover:border-emerald-500/20 p-5 rounded-2xl block text-left group transition-all"
                id="btn_menu_training_jump"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">DRILLS CENTER</h3>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition">ACADEMY & DRILLS PRACTICE</h4>
                    <p className="text-[10px] text-slate-500">Practice shot elevations dynamically</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: GAME ACTIVE PLAYGROUND BOX */}
      {mode === 'match' && activeMatchSetting && (
        <div className="w-full h-full pb-1" id="active_match_frame">
          <GameCanvas 
            settings={activeMatchSetting}
            onMatchFinished={receiveMatchFinishingStats}
            onQuit={() => {
              setMode('menu');
              setActiveMatchSetting(null);
            }}
          />
        </div>
      )}

      {/* VIEW: POST MATCH SUMMARY REPORT VIEW */}
      {mode === 'post_match' && postMatchStats && (
        <div className="flex-grow flex flex-col justify-center items-center p-6 bg-slate-950/95 overflow-y-auto select-none" id="post_match_overlay_viewport">
          <div className="bg-slate-900/90 border border-slate-800 max-w-xl w-full rounded-3xl p-8 shadow-2xl space-y-6 animate-fadeIn" id="summary_receipt_box">
            
            {/* Header Branding */}
            <div className="text-center space-y-2 border-b border-slate-800 pb-5">
              <h2 className="text-3xl font-black tracking-widest bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">FINAL MATCH REPORT</h2>
              <p className="text-xs text-slate-450 tracking-wider uppercase font-semibold">Stadium Referee Whistle blows Full-Time</p>
            </div>

            {/* Score box */}
            <div className="flex justify-around items-center bg-slate-950/60 border border-slate-900 py-6 px-4 rounded-2xl font-mono" id="summary_score">
              <div className="text-center">
                <span className="text-white font-black text-2xl tracking-wide">{activeMatchSetting?.userTeam.shortName || 'USR'}</span>
                <span className="text-[10px] text-slate-500 block mt-1 uppercase">User Class</span>
              </div>

              <div className="text-white font-black text-4xl text-emerald-400 tracking-wider">
                {postMatchStats.userGoals} - {postMatchStats.aiGoals}
              </div>

              <div className="text-center">
                <span className="text-slate-300 font-extrabold text-2xl tracking-wide">{activeMatchSetting?.aiTeam.shortName || 'OPP'}</span>
                <span className="text-[10px] text-slate-500 block mt-1 uppercase">Opposition AI</span>
              </div>
            </div>

            {/* Stats list card layout */}
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-855" id="summary_match_table">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Ball Possession percentage:</span>
                <span className="text-white font-mono font-bold">{postMatchStats.stats.possession}% vs {100 - postMatchStats.stats.possession}%</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2.5">
                <span className="text-slate-400 font-medium font-medium">Goalmouth Shots triggers:</span>
                <span className="text-slate-200 font-mono font-bold">{postMatchStats.stats.shots} shots</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2.5">
                <span className="text-slate-400 font-medium">Completed intercept Tackles:</span>
                <span className="text-slate-200 font-mono font-bold">{postMatchStats.stats.tackles} slide tackles</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2.5 font-bold text-emerald-400">
                <span>Match rewards coins payout:</span>
                <span className="font-mono text-sm font-black">+{postMatchStats.coinsEarned} Coins</span>
              </div>
            </div>

            {/* Dynamic star overall comment */}
            <p className="text-center text-xs text-slate-400 leading-normal italic px-4" id="commentary_post_quote">
              {postMatchStats.userGoals > postMatchStats.aiGoals 
                ? "Board of Directors: Magnificent! A glorious performance matching tactical directions completely on field."
                : (postMatchStats.userGoals === postMatchStats.aiGoals 
                   ? "Board of Directors: A solid point secured. Good physical struggle but we need sharper shot conversions in the next fixtures."
                   : "Board of Directors: Unacceptable drop in quality. We need to upgrade training drills and adjust squad rosters before next week's kickoff.")
              }
            </p>

            {/* Footer Buttons back navigation */}
            <button 
              onClick={() => {
                setPostMatchStats(null);
                // Return to whatever mode match came from
                if (activeMatchSetting?.mode === 'career_league') {
                  setMode('career');
                } else {
                  setMode('menu');
                }
                setActiveMatchSetting(null);
              }}
              className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-lg transition active:scale-[0.98]"
              id="btn_post_match_continue"
            >
              PROCEED TO CLUB HQ
            </button>
          </div>
        </div>
      )}

      {/* VIEW: ONLINE MATCHMAKING LOBBIES */}
      {mode === 'online_lobby' && (
        <div className="flex-grow flex flex-col" id="online_lobby_viewport">
          <OnlineLobby 
            userTeam={userTeam}
            onKickoffOnlineMatch={(setts) => {
              setActiveMatchSetting(setts);
              setMode('match');
            }}
            onBack={() => setMode('menu')}
          />
        </div>
      )}

      {/* VIEW: DRILLS ACADEMY MODE */}
      {mode === 'training' && (
        <div className="flex-grow flex flex-col" id="training_viewport">
          <TrainingDrills 
            userTeam={userTeam}
            onKickoffTraining={(setts) => {
              setActiveMatchSetting(setts);
              setMode('match');
            }}
            onBack={() => setMode('menu')}
          />
        </div>
      )}

      {/* VIEW: TRANSFER MANAGER SCREEN */}
      {mode === 'transfer_market' && (
        <div className="flex-grow flex flex-col" id="transfer_viewport">
          <TransferMarket 
            userTeam={userTeam}
            coins={coins}
            onBuyPlayer={handleBuyPlayer}
            onSellPlayer={handleSellPlayer}
            onBack={() => setMode('menu')}
          />
        </div>
      )}

      {/* VIEW: TACTICS MANAGEMENT SCREEN */}
      {mode === 'management' && (
        <div className="flex-grow flex flex-col" id="management_viewport">
          <TacticsManager 
            userTeam={userTeam}
            onUpdateTactics={handleUpdateTactics}
            onBack={() => setMode('menu')}
          />
        </div>
      )}

      {/* VIEW: CAREER MASTER DASHBOARD */}
      {mode === 'career' && (
        <div className="flex-grow flex flex-col" id="career_viewport">
          <CareerModeDashboard 
            userTeam={userTeam}
            coins={coins}
            matchesPlayed={matchesPlayed}
            standings={standings}
            currentRound={currentRound}
            onKickoffMatch={(setts) => {
              setActiveMatchSetting(setts);
              setMode('match');
            }}
            onNavigateToTransfers={() => setMode('transfer_market')}
            onNavigateToTactics={() => setMode('management')}
            onNavigateToTraining={() => setMode('training')}
            onBackToMenu={() => setMode('menu')}
          />
        </div>
      )}
    </div>
  );
}
