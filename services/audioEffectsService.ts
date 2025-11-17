import type { DeckId, EffectType, EffectParams, EffectTargets } from '../types';

let audioContext: AudioContext | null = null;
let sources: Record<DeckId, MediaElementAudioSourceNode | null> = { A: null, B: null };
let effectInput: GainNode;
let dryGain: GainNode;
let wetGain: GainNode;

// Effect Nodes
let echoDelay: DelayNode;
let echoFeedback: GainNode;
let flangerDelay: DelayNode, flangerFeedback: GainNode, flangerLFO: OscillatorNode, flangerDepth: GainNode;
let reverbNode: ConvolverNode;


export const initAudioEffects = (audioElA: HTMLAudioElement, audioElB: HTMLAudioElement) => {
    if (audioContext) return;
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Common nodes
    effectInput = audioContext.createGain();
    dryGain = audioContext.createGain();
    wetGain = audioContext.createGain();

    // Create sources
    sources.A = audioContext.createMediaElementSource(audioElA);
    sources.B = audioContext.createMediaElementSource(audioElB);

    // --- Create Echo Effect Chain ---
    echoDelay = audioContext.createDelay(1.0);
    echoFeedback = audioContext.createGain();
    effectInput.connect(echoDelay);
    echoDelay.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoDelay.connect(wetGain);

    // --- Create Flanger Effect Chain ---
    flangerLFO = audioContext.createOscillator();
    flangerDepth = audioContext.createGain();
    flangerDelay = audioContext.createDelay(0.1);
    flangerFeedback = audioContext.createGain();
    flangerLFO.type = 'sine';
    flangerLFO.connect(flangerDepth);
    flangerDepth.connect(flangerDelay.delayTime);
    effectInput.connect(flangerDelay);
    flangerDelay.connect(flangerFeedback);
    flangerFeedback.connect(flangerDelay);
    flangerDelay.connect(wetGain);
    flangerLFO.start();

    // --- Create Reverb Effect (Algorithmic) ---
    // Simple algorithmic reverb using a generated impulse response
    const sampleRate = audioContext.sampleRate;
    const duration = 2; // seconds
    const decay = 2;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = length - i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
    reverbNode = audioContext.createConvolver();
    reverbNode.buffer = impulse;
    effectInput.connect(reverbNode).connect(wetGain);

    // Initial connections (all dry)
    sources.A.connect(dryGain);
    sources.B.connect(dryGain);
    dryGain.connect(audioContext.destination);
    wetGain.connect(audioContext.destination);
};

const disconnectAllEffects = () => {
    effectInput.disconnect();
    effectInput.connect(echoDelay);
    effectInput.connect(flangerDelay);
    effectInput.connect(reverbNode);
};

export const applyEffect = (effect: EffectType, params: EffectParams, targets: EffectTargets) => {
    if (!audioContext) return;
    
    // Disconnect sources and reconnect based on targets
    Object.entries(sources).forEach(([deckId, sourceNode]) => {
        if (sourceNode) {
            sourceNode.disconnect();
            if (targets[deckId as DeckId]) {
                sourceNode.connect(effectInput); // Send to effect chain
                sourceNode.connect(dryGain); // Also send to dry path
            } else {
                sourceNode.connect(dryGain); // Only dry path
            }
        }
    });

    disconnectAllEffects();
    wetGain.gain.value = 1.0;
    dryGain.gain.value = 1.0;

    switch (effect) {
        case 'echo':
            effectInput.disconnect(flangerDelay);
            effectInput.disconnect(reverbNode);
            echoDelay.delayTime.setValueAtTime(params.echo.time, audioContext.currentTime);
            echoFeedback.gain.setValueAtTime(params.echo.feedback, audioContext.currentTime);
            break;
        case 'flanger':
            effectInput.disconnect(echoDelay);
            effectInput.disconnect(reverbNode);
            flangerDelay.delayTime.setValueAtTime(params.flanger.time, audioContext.currentTime);
            flangerFeedback.gain.setValueAtTime(params.flanger.feedback, audioContext.currentTime);
            flangerLFO.frequency.setValueAtTime(params.flanger.speed, audioContext.currentTime);
            flangerDepth.gain.setValueAtTime(params.flanger.depth, audioContext.currentTime);
            break;
        case 'reverb':
            effectInput.disconnect(echoDelay);
            effectInput.disconnect(flangerDelay);
            wetGain.gain.value = params.reverb.mix;
            dryGain.gain.value = 1 - params.reverb.mix;
            // The impulse response decay is fixed in this simple setup.
            // A more complex setup would use multiple delay lines.
            break;
        case 'none':
        default:
            Object.values(sources).forEach(source => {
                source?.disconnect();
                source?.connect(dryGain);
            });
            wetGain.gain.value = 0.0;
            dryGain.gain.value = 1.0;
            break;
    }
};
