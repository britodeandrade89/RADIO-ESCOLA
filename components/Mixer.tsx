
import React from 'react';
import type { DeckId, VoiceOption, EffectType, EffectParams, EffectTargets } from '../types';
import { voiceOptions } from '../types';
import EffectsPanel from './EffectsPanel';

interface MixerProps {
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  isPlaying: boolean;
  isPlaylistEmpty: boolean;
  activeDeckId: DeckId;
  onGenerateText: () => void;
  onGenerateAudio: () => void;
  isGenerating: boolean;
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  // --- New Effect Props ---
  activeEffect: EffectType;
  onEffectChange: (effect: EffectType) => void;
  effectParams: EffectParams;
  onParamsChange: (effect: EffectType, param: keyof any, value: number) => void;
  effectTargets: EffectTargets;
  onTargetChange: (deckId: DeckId) => void;
}

const Mixer: React.FC<MixerProps> = ({
  onPlayPause,
  onNext,
  onPrev,
  isPlaying,
  isPlaylistEmpty,
  activeDeckId,
  onGenerateText,
  onGenerateAudio,
  isGenerating,
  selectedVoice,
  onVoiceChange,
  activeEffect,
  onEffectChange,
  effectParams,
  onParamsChange,
  effectTargets,
  onTargetChange,
}) => {
  const crossfaderTransform = activeDeckId === 'A' ? 'translateX(0%)' : 'translateX(100%)';
  const controlDisabled = isPlaylistEmpty;

  return (
    <div className="w-full md:w-[30%] flex flex-col justify-between p-4 bg-gray-900 rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-center text-white">RADIO ESCOLA JOANA</h2>
      
      <div className="flex items-center justify-center space-x-6">
        <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50" disabled={controlDisabled}>
          <i className="ph-fill ph-skip-back text-4xl"></i>
        </button>
        <button onClick={onPlayPause} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all duration-200 disabled:opacity-50" disabled={controlDisabled}>
          {isPlaying ? <i className="ph-fill ph-pause text-3xl"></i> : <i className="ph-fill ph-play text-3xl ml-1"></i>}
        </button>
        <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50" disabled={controlDisabled}>
          <i className="ph-fill ph-skip-forward text-4xl"></i>
        </button>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400 text-center block">CROSSFADER</label>
        <div className="w-full h-4 bg-gray-700 rounded-full flex items-center p-0.5">
          <div className="w-1/2 h-3 bg-gray-400 rounded-full transition-transform duration-300" style={{ transform: crossfaderTransform }}></div>
        </div>
        <div className="flex justify-between text-xs font-bold text-white">
          <span>A</span>
          <span>B</span>
        </div>
      </div>
      
      {/* --- Effects Panel --- */}
      <EffectsPanel
        activeEffect={activeEffect}
        onEffectChange={onEffectChange}
        effectParams={effectParams}
        onParamsChange={onParamsChange}
        effectTargets={effectTargets}
        onTargetChange={onTargetChange}
        disabled={controlDisabled}
      />


      <div className="space-y-3">
        <button onClick={onGenerateText} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg text-center cursor-pointer transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2" disabled={controlDisabled || isGenerating}>
          <i className="ph-fill ph-sparkle text-xl"></i>
          <span>Gerar Texto (Locutor)</span>
        </button>
        
        <button onClick={onGenerateAudio} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-lg text-center cursor-pointer transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2" disabled={controlDisabled || isGenerating}>
          <i className="ph-fill ph-microphone text-xl"></i>
          <span>Gerar Áudio (IA)</span>
        </button>

        <div className="space-y-1">
          <label htmlFor="voice-select" className="text-sm font-medium text-gray-400 text-center block">Voz da IA</label>
          <select 
            id="voice-select" 
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value as VoiceOption)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            disabled={controlDisabled}
          >
            {Object.entries(voiceOptions).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Mixer;