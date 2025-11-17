import type { DeckId, EffectType, EffectParams, EffectTargets } from '../types';

let audioContext: AudioContext | null = null;
let sources: Record<DeckId, MediaElementAudioSourceNode | null> = { A: null, B: null };

// Nodes do Roteamento Principal
let effectInput: GainNode; // Ponto de entrada para todos os efeitos
let dryGain: GainNode;     // Controla o sinal original (sem efeito)
let wetGain: GainNode;     // Controla o sinal processado (com efeito)

// Nodes de Efeitos
let echoDelay: DelayNode, echoFeedback: GainNode;
let flangerDelay: DelayNode, flangerFeedback: GainNode, flangerLFO: OscillatorNode, flangerDepth: GainNode;
let reverbNode: ConvolverNode;

let activeEffectChainInput: AudioNode | null = null;

export const initAudioEffects = (audioElA: HTMLAudioElement, audioElB: HTMLAudioElement) => {
    if (audioContext) return;
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Cria as fontes de áudio a partir dos elementos HTML
    sources.A = audioContext.createMediaElementSource(audioElA);
    sources.B = audioContext.createMediaElementSource(audioElB);

    // Cria os caminhos de sinal principais: um para efeitos (wet) e um para o sinal original (dry)
    effectInput = audioContext.createGain();
    dryGain = audioContext.createGain();
    wetGain = audioContext.createGain();

    // --- Constrói a Cadeia de Efeito Echo ---
    // A saída desta cadeia se conecta ao 'wetGain'
    echoDelay = audioContext.createDelay(1.0);
    echoFeedback = audioContext.createGain();
    echoDelay.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoDelay.connect(wetGain);

    // --- Constrói a Cadeia de Efeito Flanger ---
    // A saída desta cadeia se conecta ao 'wetGain'
    flangerLFO = audioContext.createOscillator();
    flangerDepth = audioContext.createGain();
    flangerDelay = audioContext.createDelay(0.1);
    flangerFeedback = audioContext.createGain();
    flangerLFO.type = 'sine';
    flangerLFO.connect(flangerDepth);
    flangerDepth.connect(flangerDelay.delayTime);
    flangerDelay.connect(flangerFeedback);
    flangerFeedback.connect(flangerDelay);
    flangerDelay.connect(wetGain);
    flangerLFO.start();

    // --- Constrói o Efeito Reverb ---
    // Usa um reverb de convolução com uma resposta de impulso gerada
    // A saída desta cadeia se conecta ao 'wetGain'
    const sampleRate = audioContext.sampleRate;
    const duration = 2;
    const decay = 2;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow((length - i) / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow((length - i) / length, decay);
    }
    reverbNode = audioContext.createConvolver();
    reverbNode.buffer = impulse;
    reverbNode.connect(wetGain);

    // Inicialmente, conecta as fontes apenas ao caminho 'dry'
    sources.A.connect(dryGain);
    sources.B.connect(dryGain);
    
    // Combina os sinais 'dry' e 'wet' no destino final
    dryGain.connect(audioContext.destination);
    wetGain.connect(audioContext.destination);

    // Define os ganhos iniciais: 100% dry, 0% wet
    wetGain.gain.value = 0.0;
    dryGain.gain.value = 1.0;
};


export const applyEffect = (effect: EffectType, params: EffectParams, targets: EffectTargets) => {
    if (!audioContext) return;

    // 1. Desconecta o 'effectInput' de qualquer cadeia de efeito anterior
    if (activeEffectChainInput) {
        effectInput.disconnect(activeEffectChainInput);
        activeEffectChainInput = null;
    }

    // 2. Redefine os ganhos de wet/dry para o padrão antes de aplicar novos parâmetros
    wetGain.gain.setValueAtTime(1.0, audioContext.currentTime);
    dryGain.gain.setValueAtTime(1.0, audioContext.currentTime);

    // 3. Seleciona e configura a nova cadeia de efeito
    switch (effect) {
        case 'echo':
            activeEffectChainInput = echoDelay;
            echoDelay.delayTime.setValueAtTime(params.echo.time, audioContext.currentTime);
            echoFeedback.gain.setValueAtTime(params.echo.feedback, audioContext.currentTime);
            break;
        case 'flanger':
            activeEffectChainInput = flangerDelay;
            flangerDelay.delayTime.setValueAtTime(params.flanger.time, audioContext.currentTime);
            flangerFeedback.gain.setValueAtTime(params.flanger.feedback, audioContext.currentTime);
            flangerLFO.frequency.setValueAtTime(params.flanger.speed, audioContext.currentTime);
            flangerDepth.gain.setValueAtTime(params.flanger.depth, audioContext.currentTime);
            break;
        case 'reverb':
            activeEffectChainInput = reverbNode;
            // Ajusta wet/dry especificamente para o parâmetro 'mix' do reverb
            wetGain.gain.setValueAtTime(params.reverb.mix, audioContext.currentTime);
            dryGain.gain.setValueAtTime(1 - params.reverb.mix, audioContext.currentTime);
            break;
        case 'none':
        default:
            // Nenhum efeito ativo, então o ganho 'wet' será zero
            wetGain.gain.setValueAtTime(0.0, audioContext.currentTime);
            break;
    }

    // 4. Conecta o 'effectInput' à cadeia de efeito escolhida
    if (activeEffectChainInput) {
        effectInput.connect(activeEffectChainInput);
    }

    // 5. Roteia as fontes de áudio (decks) com base nos alvos selecionados
    Object.entries(sources).forEach(([deckId, sourceNode]) => {
        if (sourceNode) {
            sourceNode.disconnect(); // Desconecta do roteamento anterior
            
            // Por padrão, toda fonte se conecta ao caminho 'dry'
            sourceNode.connect(dryGain);

            // Se o deck for um alvo e um efeito estiver ativo, conecta também ao caminho 'wet'
            if (targets[deckId as DeckId] && effect !== 'none') {
                sourceNode.connect(effectInput);
            }
        }
    });
};
