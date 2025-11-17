
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
  // Mapeamento de classes estáticas para garantir que o Tailwind as detecte
  const deckColorClasses = {
    A: {
      border: 'border-blue-500',
      bg: 'bg-blue-500',
      statusPlaying: 'bg-blue-500 text-white',
    },
    B: {
      border: 'border-red-500',
      bg: 'bg-red-500',
      statusPlaying: 'bg-red-500 text-white',
    },
  };

  const selectedColors = deckColorClasses[deckId];

  const statusText = {
    playing: 'Tocando',
    paused: 'Pausado',
    standby: 'Próxima',
    empty: 'Vazio'
  };

  const statusColor = {
    playing: selectedColors.statusPlaying,
    paused: 'bg-yellow-500 text-black',
    standby: 'bg-gray-500 text-white',
    empty: 'bg-gray-700 text-gray-400'
  };

  return (
    <div className={`w-full md:w-[35%] flex flex-col gap-4 p-4 bg-gray-900 rounded-lg border-2 transition-colors duration-300 ${isActive ? selectedColors.border : 'border-transparent'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Deck {deckId}</h2>
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${statusColor[state.status]}`}>
          {statusText[state.status]}
        </span>
      </div>
      <p className="text-lg text-gray-300 truncate h-6" title={state.song?.name || 'Vazio'}>
        {state.song?.name || 'Vazio'}
      </p>
      
      {/* Vinyl Record */}
      <div className="aspect-square p-2 md:p-4 flex items-center justify-center">
        <div className={`relative w-full h-full bg-black rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 ${state.status === 'playing' ? 'vinyl-spinning' : ''}`}>
          {/* Grooves */}
          <div className="absolute w-[95%] h-[95%] border-2 border-gray-700/50 rounded-full"></div>
          <div className="absolute w-[85%] h-[85%] border border-gray-800/50 rounded-full"></div>
          <div className="absolute w-[65%] h-[65%] border-2 border-gray-700/50 rounded-full"></div>
          <div className="absolute w-[55%] h-[55%] border border-gray-800/50 rounded-full"></div>
          
          {/* Center Label */}
          <div className={`relative w-[34%] h-[34%] rounded-full ${selectedColors.bg} flex items-center justify-center shadow-lg border-2 border-gray-400`}>
              <p className="font-bold text-5xl text-white opacity-75 select-none">{deckId}</p>
              {/* Spindle hole */}
              <div className="absolute w-3 h-3 bg-gray-900 rounded-full border border-gray-600"></div>
          </div>
        </div>
      </div>


      <div className="space-y-1">
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className={`${selectedColors.bg} h-1.5 rounded-full`} style={{ width: `${state.progress}%` }}></div>
        </div>
        <div className="text-xs font-medium text-gray-400 text-center">
          {formatTime(state.currentTime)} / {formatTime(state.duration)}
        </div>
      </div>
    </div>
  );
};

export default Deck;