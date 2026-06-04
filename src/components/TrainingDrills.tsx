/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, ArrowLeft, Award, Play } from 'lucide-react';
import { Team, MatchSetting } from '../types/football';
import { TEAMS } from '../game/SquadData';

interface TrainingDrillsProps {
  userTeam: Team;
  onKickoffTraining: (settings: MatchSetting) => void;
  onBack: () => void;
}

export const TrainingDrills: React.FC<TrainingDrillsProps> = ({ userTeam, onKickoffTraining, onBack }) => {

  const launchDribblePractice = () => {
    // Select an AI opponent to stand in formation (e.g. Manchester Blue) but user just warms up
    const mockOpponent = TEAMS.find(t => t.id !== userTeam.id) || TEAMS[1];
    onKickoffTraining({
      userTeam,
      aiTeam: mockOpponent,
      weather: 'sunny',
      difficulty: 'amateur', // very easy defense so user can practice freely
      matchLengthMinutes: 999, // infinite
      mode: 'training_free'
    });
  };

  const launchPenaltyPractice = () => {
    const mockOpponent = TEAMS.find(t => t.id !== userTeam.id) || TEAMS[1];
    onKickoffTraining({
      userTeam,
      aiTeam: mockOpponent,
      weather: 'night',
      difficulty: 'superstar', // high tier goalie diving
      matchLengthMinutes: 999, 
      mode: 'training_penalty'
    });
  };

  return (
    <div className="w-full h-full bg-slate-950 font-sans text-slate-200 flex flex-col p-6 overflow-y-auto" id="training_drills_viewport">
      {/* HEADER SECTION */}
      <div className="flex items-center space-x-4 border-b border-slate-800 pb-5 mb-8" id="training_header">
        <button onClick={onBack} className="p-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-300 transition" id="btn_back_training">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-widest text-white uppercase flex items-center space-x-2">
            <Target className="w-6 h-6 text-emerald-400 animate-pulse" />
            <span>TRAINING & ACADEMY</span>
          </h2>
          <p className="text-xs text-slate-400">Master physics controls, passing routines, and shooting angles without referee clocks</p>
        </div>
      </div>

      {/* DRILLS CONTENT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-4" id="drills_grid">
        {/* DRILL 1: FREE DRIBBLE & PASS drill */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl group hover:border-emerald-500/30 transition-all duration-300" id="drill_free_card">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black border border-emerald-500/20">
              01
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Free Pitch Dribbling</h3>
              <p className="text-xs text-slate-450 leading-relaxed mt-2">Practice passing, sprinting transitions, and overall positioning controls inside standard 3D dimensions. Perfect for getting fully accustomed to tactical angles.</p>
            </div>
            
            <ul className="text-[11px] text-slate-400 space-y-1 bg-slate-950/50 p-3 rounded-lg border border-slate-855 font-mono">
              <li>• Unlimited clock countdowns</li>
              <li>• Gentle AI defenders setup</li>
              <li>• Free movement across whole turf dimensions</li>
            </ul>
          </div>

          <button 
            onClick={launchDribblePractice}
            className="w-full py-3 bg-slate-800 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white rounded-xl font-bold text-xs tracking-wider uppercase border border-slate-750 transition-all mt-6"
            id="btn_launch_free_dribble"
          >
            START PRACTICE DRILL
          </button>
        </div>

        {/* DRILL 2: PENALTY & SHOOT drill */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl group hover:border-emerald-500/30 transition-all duration-300" id="drill_penalty_card">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 font-black border border-orange-500/20">
              02
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Striker Target shootouts</h3>
              <p className="text-xs text-slate-455 leading-relaxed mt-2">Position yourself on direct shooting marks and try to pass the ball past highly-responsive goalkeeper AI dive blocks. Train your shot curves for crucial matches.</p>
            </div>

            <ul className="text-[11px] text-slate-400 space-y-1 bg-slate-950/50 p-3 rounded-lg border border-slate-855 font-mono">
              <li>• Direct placement targets</li>
              <li>• Quick shoot command cycles</li>
              <li>• Pro active Gk dive dynamics</li>
            </ul>
          </div>

          <button 
            onClick={launchPenaltyPractice}
            className="w-full py-3 bg-slate-800 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white rounded-xl font-bold text-xs tracking-wider uppercase border border-slate-750 transition-all mt-6"
            id="btn_launch_penalty_drill"
          >
            START SHOOTOUT DRILL
          </button>
        </div>
      </div>
    </div>
  );
};
