import React from 'react';
import type { DeckId, EffectType, EffectParams, EffectTargets } from '../types';

interface EffectsPanelProps {
  activeEffect: EffectType;
  onEffectChange: (effect: EffectType) => void;
  effectParams: EffectParams;
  onParamsChange: (effect: EffectType, param: keyof any, value: number) => void;
  effectTargets: EffectTargets;
  onTargetChange: (deckId: DeckId) => void;
  disabled: boolean;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  activeEffect, onEffectChange, effectParams, onParamsChange, effectTargets, onTargetChange, disabled
}) => {
  const renderParams = () => {
    switch (activeEffect) {
      case 'echo':
        return (
          <>
            <ParamSlider label="Tempo" min={0.01} max={1} step={0.01} value={effectParams.echo.time} onChange={v => onParamsChange('echo', 'time', v)} />
            <ParamSlider label="Feedback" min={0} max={0.95} step={0.01} value={effectParams.echo.feedback} onChange={v => onParamsChange('echo', 'feedback', v)} />
          </>
        );
      case 'flanger':
        return (
          <>
            <ParamSlider label="Velocidade" min={0.1} max={10} step={0.1} value={effectParams.flanger.speed} onChange={v => onParamsChange('flanger', 'speed', v)} />
            <ParamSlider label="Profundidade" min={0.001} max={0.02} step={0.001} value={effectParams.flanger.depth} onChange={v => onParamsChange('flanger', 'depth', v)} />
          </>
        );
      case 'reverb':
        return (
            <ParamSlider label="Mix" min={0} max={1} step={0.01} value={effectParams.reverb.mix} onChange={v => onParamsChange('reverb', 'mix', v)} />
        );
      default:
        return <p className="text-sm text-gray-500 text-center col-span-2 h-[88px] flex items-center justify-center">Nenhum efeito selecionado</p>;
    }
  };

  return (
    <div className={`mt-2 space-y-3 p-3 bg-gray-800 rounded-lg transition-opacity ${disabled ? 'opacity-50' : ''}`}>
      <fieldset disabled={disabled}>
        <label className="text-sm font-medium text-gray-400 text-center block mb-2">DJ EFFECTS</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['none', 'echo', 'flanger', 'reverb'] as EffectType[]).map(effect => (
            <button key={effect} onClick={() => onEffectChange(effect)} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${activeEffect === effect ? 'bg-indigo-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
              {effect.charAt(0).toUpperCase() + effect.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
            {renderParams()}
        </div>
        <div className="flex justify-center items-center gap-4">
          <TargetToggle deckId="A" isActive={effectTargets.A} onChange={() => onTargetChange('A')} />
          <TargetToggle deckId="B" isActive={effectTargets.B} onChange={() => onTargetChange('B')} />
        </div>
      </fieldset>
    </div>
  );
};

const ParamSlider: React.FC<{ label: string, min: number, max: number, step: number, value: number, onChange: (value: number) => void }> = ({ label, min, max, step, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-xs text-gray-400">{label}</label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
  </div>
);

const TargetToggle: React.FC<{ deckId: DeckId, isActive: boolean, onChange: () => void }> = ({ deckId, isActive, onChange }) => (
  <button onClick={onChange} className={`w-12 h-12 flex items-center justify-center rounded-full font-bold border-2 transition-all ${isActive ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-400'}`}>
    {deckId}
  </button>
);

export default EffectsPanel;
