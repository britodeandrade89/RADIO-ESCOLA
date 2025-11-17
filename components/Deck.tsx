
import React from 'react';
import type { DeckState, DeckId } from '../types';

interface DeckProps {
  deckId: DeckId;
  state: DeckState;
  isActive: boolean;
}

const formatTime = (time: number) => {
  if (isNaN(time) || time === 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const Deck: React.FC<DeckProps> = ({ deckId, state, isActive }) => {
  const deckColor = deckId === 'A' ? 'blue' : 'red';

  const statusText = {
    playing: 'Tocando',
    paused: 'Pausado',
    standby: 'Próxima',
    empty: 'Vazio'
  };

  const statusColor = {
    playing: `bg-${deckColor}-500 text-white`,
    paused: 'bg-yellow-500 text-black',
    standby: 'bg-gray-500 text-white',
    empty: 'bg-gray-700 text-gray-400'
  };

  return (
    <div className={`flex-1 flex flex-col gap-4 p-4 bg-gray-900 rounded-lg border-2 transition-colors duration-300 ${isActive ? `border-${deckColor}-500` : 'border-transparent'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Deck {deckId}</h2>
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${statusColor[state.status]}`}>
          {statusText[state.status]}
        </span>
      </div>
      <p className="text-lg text-gray-300 truncate h-6" title={state.song?.name || 'Vazio'}>
        {state.song?.name || 'Vazio'}
      </p>
      
      <div className="aspect-square flex items-center justify-center p-4 bg-gray-800 rounded-md shadow-inner">
        <i className={`ph-fill ph-music-notes text-8xl ${isActive && state.status === 'playing' ? `text-${deckColor}-400` : 'text-gray-600'}`}></i>
      </div>

      <div className="space-y-1">
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className={`bg-${deckColor}-500 h-1.5 rounded-full`} style={{ width: `${state.progress}%` }}></div>
        </div>
        <div className="text-xs font-medium text-gray-400 text-center">
          {formatTime(state.currentTime)} / {formatTime(state.duration)}
        </div>
      </div>
    </div>
  );
};

export default Deck;
