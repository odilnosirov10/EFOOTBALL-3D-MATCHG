/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OnlineLobbyMatch, MatchSetting, Team } from '../types/football';
import { STAR_PLAYERS, TEAMS } from '../game/SquadData';
import { ArrowLeft, Globe, Wifi, ShieldCheck, UserPlus, Play } from 'lucide-react';

interface OnlineLobbyProps {
  userTeam: Team;
  onKickoffOnlineMatch: (settings: MatchSetting) => void;
  onBack: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ userTeam, onKickoffOnlineMatch, onBack }) => {
  const [lobbies, setLobbies] = useState<OnlineLobbyMatch[]>([
    { id: 'lob_1', hostName: 'GamerX_88', teamName: 'Madrid White', ping: 24, status: 'Waiting' },
    { id: 'lob_2', hostName: 'Tikitaka_M', teamName: 'Barcelona Blaugrana', ping: 42, status: 'Waiting' },
    { id: 'lob_3', hostName: 'Stryker00', teamName: 'Munich Red', ping: 18, status: 'Waiting' },
    { id: 'lob_4', hostName: 'PSG_Master', teamName: 'Paris Blue', ping: 95, status: 'Playing' }
  ]);
  const [matchmakingText, setMatchmakingText] = useState<string | null>(null);

  const startMatchmakingSimulation = () => {
    setMatchmakingText("Searching for high-speed online servers...");
    
    // Step-by-step trigger simulator ticks
    setTimeout(() => {
      setMatchmakingText("Matching with peer GamerX_88 (Ping: 24ms)...");
    }, 1500);

    setTimeout(() => {
      setMatchmakingText("Synchronizing networking netcode structures...");
    }, 3000);

    setTimeout(() => {
      setMatchmakingText(null);
      // Pick a random opponent
      const opponent = TEAMS.find(t => t.id !== userTeam.id) || TEAMS[1];
      onKickoffOnlineMatch({
        userTeam,
        aiTeam: opponent,
        weather: 'sunny',
        difficulty: 'professional',
        matchLengthMinutes: 5,
        mode: 'friendly'
      });
    }, 4200);
  };

  const handleJoinLobby = (l: OnlineLobbyMatch) => {
    if (l.status === 'Playing') return;
    setMatchmakingText(`Connecting to host ${l.hostName} (Ping: ${l.ping}ms)...`);
    setTimeout(() => {
      setMatchmakingText(null);
      const opponent = TEAMS.find(t => t.name === l.teamName) || TEAMS[1];
      onKickoffOnlineMatch({
        userTeam,
        aiTeam: opponent,
        weather: 'night',
        difficulty: 'superstar',
        matchLengthMinutes: 5,
        mode: 'friendly'
      });
    }, 1800);
  };

  return (
    <div className="w-full h-full bg-slate-950 font-sans text-slate-200 flex flex-col p-6 overflow-y-auto" id="online_lobby_viewport">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5 mb-6" id="online_lobby_header">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl transition" id="btn_back_online">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-widest text-white uppercase flex items-center space-x-2.5">
              <Globe className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>MULTIPLAYER LOBBY (P2P NET READY)</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">Real-time matchmaking system with optimized network tickrates</p>
          </div>
        </div>
      </div>

      {matchmakingText ? (
        /* MATCHMAKING ANIMATION */
        <div className="flex-grow flex flex-col items-center justify-center space-y-5 py-12" id="matchmaking_wait_panel">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
            <Globe className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-sm font-medium font-mono text-emerald-400 tracking-wider animate-pulse">{matchmakingText}</p>
        </div>
      ) : (
        /* STANDARD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="online_sections_grid">
          {/* LOBBIES LISTINGS */}
          <div className="lg:col-span-2 space-y-4" id="peer_lobbies_panel">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Available Peer Matches</h3>
            
            <div className="space-y-3">
              {lobbies.map(l => (
                <div 
                  key={l.id} 
                  className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center space-x-5">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <Globe className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-slate-100">{l.hostName}</h4>
                        <span className="text-[10px] bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded uppercase font-mono">{l.teamName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400 font-mono">
                        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Ping: {l.ping} ms (Tickrate 60Hz)</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleJoinLobby(l)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition ${l.status === 'Waiting' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                  >
                    {l.status === 'Waiting' ? "Connect Peer" : "In Progress"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ONLINE STATS & HOSTER */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between" id="matchmaker_sidebar">
            <div className="space-y-6">
              <div className="border-b border-slate-850 pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Global matchmaking</h3>
                <p className="text-xs text-slate-400 mt-1">Directly search active online trainers globally</p>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3" id="hud_network_stats">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Netcode System</span>
                  <span className="text-emerald-400 font-mono font-bold uppercase flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-500" />
                    ROLLBACK net
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2.5">
                  <span className="text-slate-400">Your Base Ping</span>
                  <span className="text-slate-200 font-mono font-bold">12 ms</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2.5">
                  <span className="text-slate-400">Active Trainers</span>
                  <span className="text-slate-200 font-mono font-bold">1,104 Online</span>
                </div>
              </div>
            </div>

            <button 
              onClick={startMatchmakingSimulation}
              className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-lg shadow-emerald-950/40 transition active:scale-[0.98] mt-6 flex items-center justify-center space-x-2"
              id="btn_start_matchmaking"
            >
              <UserPlus className="w-4 h-4" />
              <span>SEARCH ACTIVE MATCH</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
