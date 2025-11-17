import type { DeckId, EffectType, EffectParams, EffectTargets } from '../types';

let audioContext: AudioContext | null = null;
let sources: Record<DeckId, MediaElementAudioSourceNode | null> = { A: null, B: null };

// NEW: Volume Control Nodes
let gainA: GainNode, gainB: GainNode;
let masterGain: GainNode;

// Main Routing Nodes
let effectInput: GainNode;
let dryGain: GainNode;
let wetGain: GainNode;

// Effect Nodes
let echoDelay: DelayNode, echoFeedback: GainNode;
let flangerDelay: DelayNode, flangerFeedback: GainNode, flangerLFO: OscillatorNode, flangerDepth: GainNode;
let reverbNode: ConvolverNode;

let activeEffectChainInput: AudioNode | null = null;

export const initAudioEffects = (audioElA: HTMLAudioElement, audioElB: HTMLAudioElement) => {
    if (audioContext) return;
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    sources.A = audioContext.createMediaElementSource(audioElA);
    sources.B = audioContext.createMediaElementSource(audioElB);

    // Create volume nodes
    gainA = audioContext.createGain();
    gainB = audioContext.createGain();
    masterGain = audioContext.createGain();

    // Create main signal paths
    effectInput = audioContext.createGain();
    dryGain = audioContext.createGain();
    wetGain = audioContext.createGain();

    // --- Build Effect Chains ---
    // Echo
    echoDelay = audioContext.createDelay(1.0);
    echoFeedback = audioContext.createGain();
    echoDelay.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoDelay.connect(wetGain);
    
    // Flanger
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

    // Reverb
    const sampleRate = audioContext.sampleRate;
    const impulse = audioContext.createBuffer(2, sampleRate * 2, sampleRate);
    const impulseL = impulse.getChannelData(0);
    for (let i = 0; i < impulse.length; i++) {
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulse.length, 2);
    }
    reverbNode = audioContext.createConvolver();
    reverbNode.buffer = impulse;
    reverbNode.connect(wetGain);

    // --- Connect Audio Graph ---
    // 1. Source -> Deck Gain
    sources.A.connect(gainA);
    sources.B.connect(gainB);

    // 2. Initial Deck Gain -> Dry Path
    gainA.connect(dryGain);
    gainB.connect(dryGain);
    
    // 3. Dry/Wet Paths -> Master Gain
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);

    // 4. Master Gain -> Destination
    masterGain.connect(audioContext.destination);

    // Set initial gains
    wetGain.gain.value = 0.0;
    dryGain.gain.value = 1.0;
};

export const applyEffect = (effect: EffectType, params: EffectParams, targets: EffectTargets) => {
    if (!audioContext) return;

    if (activeEffectChainInput) {
        effectInput.disconnect(activeEffectChainInput);
        activeEffectChainInput = null;
    }

    wetGain.gain.setValueAtTime(1.0, audioContext.currentTime);
    dryGain.gain.setValueAtTime(1.0, audioContext.currentTime);

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
            wetGain.gain.setValueAtTime(params.reverb.mix, audioContext.currentTime);
            dryGain.gain.setValueAtTime(1 - params.reverb.mix, audioContext.currentTime);
            break;
        case 'none':
        default:
            wetGain.gain.setValueAtTime(0.0, audioContext.currentTime);
            break;
    }

    if (activeEffectChainInput) {
        effectInput.connect(activeEffectChainInput);
    }

    // Reroute deck gains based on targets
    const deckGains: Record<DeckId, GainNode> = { A: gainA, B: gainB };
    Object.entries(deckGains).forEach(([deckId, gainNode]) => {
        gainNode.disconnect();
        gainNode.connect(dryGain);
        if (targets[deckId as DeckId] && effect !== 'none') {
            gainNode.connect(effectInput);
        }
    });
};

// --- New Volume Control Functions ---

export const setDeckVolume = (deckId: DeckId, volume: number) => {
    if (!audioContext) return;
    const gainNode = deckId === 'A' ? gainA : gainB;
    // Use exponential ramp for smoother volume changes
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), audioContext.currentTime + 0.05);
};

export const setMasterVolume = (volume: number) => {
    if (!audioContext) return;
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), audioContext.currentTime + 0.05);
};