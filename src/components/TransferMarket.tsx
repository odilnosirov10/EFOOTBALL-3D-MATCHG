/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, Team } from '../types/football';
import { STAR_PLAYERS } from '../game/SquadData';
import { DollarSign, ArrowLeft, Plus, Check, ShoppingBag } from 'lucide-react';

interface TransferMarketProps {
  userTeam: Team;
  coins: number;
  onBuyPlayer: (player: Player) => void;
  onSellPlayer: (playerId: string, refundValue: number) => void;
  onBack: () => void;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({
  userTeam,
  coins,
  onBuyPlayer,
  onSellPlayer,
  onBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'buy' | 'sell'>('buy');
  const [message, setMessage] = useState<string | null>(null);

  const handlePurchase = (p: Player) => {
    // Check if duplicate already in user squad
    const exists = userTeam.players.some(sq => sq.name === p.name);
    if (exists) {
      triggerNotification(`${p.name} is already a member of your prestigious squad!`);
      return;
    }

    if (coins >= p.marketValue) {
      onBuyPlayer(p);
      triggerNotification(`Successfully signed ${p.name}! Contract registered.`);
    } else {
      triggerNotification("Insufficient funds! Win more matches to accumulate cash.");
    }
  };

  const handleSale = (p: Player) => {
    // Cannot sell default squad below 11 players
    if (userTeam.players.length <= 11) {
      triggerNotification("Cannot sell! Squad size must maintain a baseline of at least 11 players.");
      return;
    }

    const salePrice = Math.floor(p.marketValue * 0.72); // depreciation value refund
    onSellPlayer(p.id, salePrice);
    triggerNotification(`Transferred ${p.name} for ${salePrice} coins. Board approved.`);
  };

  const triggerNotification = (txt: string) => {
    setMessage(txt);
    setTimeout(() => setMessage(null), 3500);
  };

  // Filter out stars already bought
  const availableStars = STAR_PLAYERS.filter(
    star => !userTeam.players.some(sq => sq.name === star.name)
  );

  return (
    <div className="w-full h-full bg-slate-950 font-sans text-slate-200 flex flex-col p-6 overflow-y-auto" id="transfer_market_container">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5 mb-6" id="transfer_header">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl transition" id="btn_back_transfer">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-widest text-white uppercase">TRANSFER MARKET</h2>
            <p className="text-xs text-slate-400">Upgrade your starting squads with worldwide football stars</p>
          </div>
        </div>

        {/* Currency balance display */}
        <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-emerald-400 shadow-lg" id="transfer_coins_pouch">
          <DollarSign className="w-5 h-5 animate-pulse" />
          <span className="font-mono text-xl font-black">{coins}</span>
          <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Club Coins</span>
        </div>
      </div>

      {/* FEEDBACK PROMPTS */}
      {message && (
        <div className="bg-slate-900 border-l-4 border-emerald-500 text-emerald-400 text-xs px-4 py-3 rounded-lg shadow-md mb-5 animate-fadeIn" id="transfer_notification">
          {message}
        </div>
      )}

      {/* SUB MENU CATEGORIES SWITCH */}
      <div className="flex bg-slate-900/40 border border-slate-900 rounded-xl p-1.5 mb-6" id="transfer_tabs_switch">
        <button 
          onClick={() => setSelectedCategory('buy')} 
          className={`flex-1 py-3 text-center rounded-lg font-black text-xs tracking-widest uppercase transition-all duration-300 ${selectedCategory === 'buy' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          SIGN GLOBE TALENTS (BUY)
        </button>
        <button 
          onClick={() => setSelectedCategory('sell')} 
          className={`flex-1 py-3 text-center rounded-lg font-black text-xs tracking-widest uppercase transition-all duration-300 ${selectedCategory === 'sell' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          SQUAD LIQUIDATION (SELL)
        </button>
      </div>

      {/* PLAYER CARDS LISTINGS GRID CONTAINER */}
      {selectedCategory === 'buy' ? (
        <div id="transfer_buy_grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableStars.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-medium">
              You signed all superstar target draft slots! Masterful academy collection.
            </div>
          ) : (
            availableStars.map(star => (
              <div 
                key={star.id} 
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-[10px] bg-slate-800 text-emerald-400 px-2 py-1 rounded font-extrabold uppercase">{star.role}</span>
                    <span className="font-mono font-black text-2xl text-emerald-400">{star.stats.overall} OVR</span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-white mb-2 tracking-wide">{star.name}</h3>

                  {/* MINI STATS BAR GRAPH */}
                  <div className="space-y-1.5 border-t border-slate-850 pt-2 mb-4">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Speed</span>
                      <span className="font-bold text-slate-200">{star.stats.speed}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Shooting</span>
                      <span className="font-bold text-slate-200">{star.stats.shooting}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Passing</span>
                      <span className="font-bold text-slate-200">{star.stats.passing}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Defending</span>
                      <span className="font-bold text-slate-200">{star.stats.defending}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handlePurchase(star)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex justify-center items-center space-x-2 border transition ${coins >= star.marketValue ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-950/20' : 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'}`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>SIGN FOR {star.marketValue} COINS</span>
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div id="transfer_sell_grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {userTeam.players.map(p => (
            <div 
              key={p.id} 
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-rose-500/30 hover:bg-slate-900/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-slate-800 pb-2">
                  <span className="font-mono text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-extrabold uppercase">#{p.number} {p.role}</span>
                  <span className="font-mono font-bold text-sm text-slate-300">{p.stats.overall} OVR</span>
                </div>
                
                <h3 className="font-extrabold text-base text-slate-100 mb-4">{p.name}</h3>
              </div>

              <div className="border-t border-slate-850 pt-3">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                  <span>Transfer Return:</span>
                  <span className="font-mono font-bold text-emerald-400">+{Math.floor(p.marketValue * 0.72)} coins</span>
                </div>
                
                <button 
                  onClick={() => handleSale(p)}
                  className="w-full py-2 bg-rose-950/30 hover:bg-rose-900/40 active:scale-[0.98] text-rose-400 border border-rose-900/50 hover:border-rose-700 rounded-xl font-bold text-xs transition"
                >
                  RELEASE / LIQUIDATE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
