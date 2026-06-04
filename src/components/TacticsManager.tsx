/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Team, TacticType, MentalityType } from '../types/football';
import { ArrowLeft, Sliders, Shield, Award, Sparkles } from 'lucide-react';

interface TacticsManagerProps {
  userTeam: Team;
  onUpdateTactics: (t: TacticType, m: MentalityType) => void;
  onBack: () => void;
}

export const TacticsManager: React.FC<TacticsManagerProps> = ({
  userTeam,
  onUpdateTactics,
  onBack
}) => {
  const handleTacticChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateTactics(e.target.value as TacticType, userTeam.mentality);
  };

  const handleMentalityChange = (mental: MentalityType) => {
    onUpdateTactics(userTeam.tactic, mental);
  };

  return (
    <div className="w-full h-full bg-slate-950 text-slate-200 p-6 flex flex-col overflow-y-auto font-sans" id="tactics_manager_container">
      {/* HEADER BAR */}
      <div className="flex items-center space-x-4 border-b border-slate-800 pb-5 mb-6" id="tactics_header">
        <button onClick={onBack} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-300 transition" id="btn_back_tactics">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-widest text-white uppercase flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <span>TEAM MANAGEMENT & TACTICS</span>
          </h2>
          <p className="text-xs text-slate-400">Establish formational structures and mentalities for upcoming match fixtures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="tactics_main_grid">
        {/* LEFT COLUMN - SETTINGS CONFIGURATION */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col space-y-6" id="tactics_settings_col">
          <h3 className="text-lg font-black text-white uppercase tracking-wider border-b border-slate-850 pb-2 mb-4">Tactical Blueprint</h3>

          {/* Formation Dropdown */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-400">Active Formation</label>
            <select 
              value={userTeam.tactic} 
              onChange={handleTacticChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              id="select_tactics_formation"
            >
              <option value="4-3-3">4-3-3 (Offensive Wingplay)</option>
              <option value="4-4-2">4-4-2 (Balanced Classic Block)</option>
              <option value="3-5-2">3-5-2 (Dominant Midfield Overload)</option>
            </select>
          </div>

          {/* Team Mentality selection bars */}
          <div className="flex flex-col space-y-3 pt-2">
            <label className="text-xs font-extrabold uppercase text-slate-400">Team Mindset Mentality</label>
            
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => handleMentalityChange('defensive')}
                className={`w-full py-3.5 px-4 rounded-xl text-left border flex items-center justify-between transition-all duration-300 ${userTeam.mentality === 'defensive' ? 'bg-indigo-950/40 border-indigo-500 text-indigo-450 shadow-lg' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'}`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <span className="font-extrabold text-xs uppercase tracking-widest">Defensive (Deep Counter)</span>
                </div>
                {userTeam.mentality === 'defensive' && <span className="text-[10px] bg-indigo-500 text-white font-extrabold px-2 py-0.5 rounded uppercase">ACTIVE</span>}
              </button>

              <button 
                onClick={() => handleMentalityChange('balanced')}
                className={`w-full py-3.5 px-4 rounded-xl text-left border flex items-center justify-between transition-all duration-300 ${userTeam.mentality === 'balanced' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-450 shadow-lg' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'}`}
              >
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-xs uppercase tracking-widest">Balanced (Flexible Shape)</span>
                </div>
                {userTeam.mentality === 'balanced' && <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded uppercase">ACTIVE</span>}
              </button>

              <button 
                onClick={() => handleMentalityChange('attacking')}
                className={`w-full py-3.5 px-4 rounded-xl text-left border flex items-center justify-between transition-all duration-300 ${userTeam.mentality === 'attacking' ? 'bg-rose-950/40 border-rose-500 text-rose-450 shadow-lg' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'}`}
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  <span className="font-extrabold text-xs uppercase tracking-widest">Attacking (Gegenpress Wave)</span>
                </div>
                {userTeam.mentality === 'attacking' && <span className="text-[10px] bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded uppercase">ACTIVE</span>}
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN - FIELD RADAR DEMONSTRATOR */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-80" id="tactics_field_col">
          <h3 className="text-sm font-extrabold uppercase text-slate-400 mb-6 tracking-widest">Formational Layout Visualization</h3>
          
          {/* Mock Field Representation */}
          <div className="w-full max-w-sm aspect-[3/4] bg-[#14532d] rounded-2xl border-2 border-emerald-500/35 relative p-4 overflow-hidden shadow-inner flex flex-col justify-between">
            {/* Field Lines marking overlays */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/20"></div>
            <div className="absolute inset-x-0 top-0 h-10 border-b border-white/20 rounded-b-2xl"></div>
            <div className="absolute inset-x-0 bottom-0 h-10 border-t border-white/20 rounded-t-2xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/25 rounded-full"></div>

            {/* Simulated Dot layouts representation depending on current tactics */}
            {userTeam.tactic === '4-3-3' && (
              <>
                {/* Forwards */}
                <div className="flex justify-around items-center w-full mt-6 z-10">
                  <span className="w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-rose-950">FW</span>
                  <span className="w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-rose-950">FW</span>
                  <span className="w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-rose-950">FW</span>
                </div>
                {/* Midfielders */}
                <div className="flex justify-around items-center w-full mt-4 z-10">
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                </div>
                {/* Defenders */}
                <div className="flex justify-around items-center w-full mt-4 z-10">
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                </div>
              </>
            )}

            {userTeam.tactic === '3-5-2' && (
              <>
                {/* Forwards */}
                <div className="flex justify-center items-center w-full mt-8 gap-14 z-10">
                  <span className="w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-rose-950">FW</span>
                  <span className="w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-rose-950">FW</span>
                </div>
                {/* Midfielders */}
                <div className="flex justify-around items-center w-full mt-2 z-10 px-4">
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                </div>
                {/* Defenders */}
                <div className="flex justify-around items-center w-full mt-4 z-10 px-8">
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                </div>
              </>
            )}

            {userTeam.tactic === '4-4-2' && (
              <>
                {/* Forwards */}
                <div className="flex justify-center items-center w-full mt-8 gap-14 z-10">
                  <span className="w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-rose-950">FW</span>
                  <span className="w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-rose-950">FW</span>
                </div>
                {/* Midfielders */}
                <div className="flex justify-around items-center w-full mt-3 z-10">
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                  <span className="w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-emerald-950">MF</span>
                </div>
                {/* Defenders */}
                <div className="flex justify-around items-center w-full mt-4 z-10">
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                  <span className="w-4.5 h-4.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white shadow shadow-indigo-950">DF</span>
                </div>
              </>
            )}

            {/* Goal Keeper */}
            <div className="flex justify-center w-full mb-2 z-10">
              <span className="w-4.5 h-4.5 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center font-mono text-[9px] font-black text-slate-900 shadow shadow-amber-950">GK</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SQUAD STARTERS LIST */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 overflow-y-auto max-h-120" id="tactics_roster_col">
          <h3 className="text-lg font-black text-white uppercase tracking-wider border-b border-slate-850 pb-2 mb-4">Starting Squad Starters</h3>

          <div className="space-y-2.5">
            {userTeam.players.map((p, index) => (
              <div key={p.id} className="bg-slate-950/60 border border-slate-855 rounded-xl px-4 py-3 flex justify-between items-center hover:bg-slate-950 transition-colors">
                <div className="flex items-center space-x-3.5">
                  <span className="font-mono text-xs text-slate-500 font-extrabold">#{p.number}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{p.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{p.role} Starter</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm font-extrabold text-emerald-400">{p.stats.overall} OVR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
