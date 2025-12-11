
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import Playlist from './components/Playlist';
import Modal from './components/Modal';
import Footer from './components/Footer';
import { generateDjBanter, generateDjSpeech } from './services/geminiService';
import { saveSong, getSong } from './services/cacheService';
import { initAudioEffects, applyEffect, setDeckVolume, setMasterVolume } from './services/audioEffectsService';
import type { Song, DeckState, DeckId, VoiceOption, EffectType, EffectParams, EffectTargets } from './types';

const initialDeckState: DeckState = {
  song: null,
  progress: 0,
  currentTime: 0,
  duration: 0,
  status: 'empty',
  volume: 1,
};

const initialEffectParams: EffectParams = {
  echo: { time: 0.5, feedback: 0.5 },
  flanger: { time: 0.005, depth: 0.01, feedback: 0.5, speed: 4 },
  reverb: { decay: 2, mix: 0.5 },
};

function App() {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(true);
  
  const [deckAState, setDeckAState] = useState<DeckState>(initialDeckState);
  const [deckBState, setDeckBState] = useState<DeckState>(initialDeckState);
  const [activeDeckId, setActiveDeckId] = useState<DeckId>('A');
  const [masterVolume, setMasterVolume] = useState<number>(1);

  const audioPlayerARef = useRef<HTMLAudioElement>(null);
  const audioPlayerBRef = useRef<HTMLAudioElement>(null);
  const audioContextInitialized = useRef(false);

  // Gemini Modal State
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isTtsModalOpen, setIsTtsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Puck');

  // Effects State
  const [activeEffect, setActiveEffect] = useState<EffectType>('none');
  const [effectParams, setEffectParams] = useState<EffectParams>(initialEffectParams);
  const [effectTargets, setEffectTargets] = useState<EffectTargets>({ A: false, B: false });

  // Update effects when state changes
  useEffect(() => {
    if (audioContextInitialized.current) {
        applyEffect(activeEffect, effectParams, effectTargets);
    }
  }, [activeEffect, effectParams, effectTargets]);

  const getNextSongIndex = useCallback((): number => {
    if (playlist.length === 0) return -1;
    if (isShuffle) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (playlist.length > 1 && nextIndex === currentSongIndex);
      return nextIndex;
    }
    const next = currentSongIndex + 1;
    if (next >= playlist.length) {
      return isRepeat ? 0 : -1;
    }
    return next;
  }, [playlist.length, isShuffle, currentSongIndex, isRepeat]);

  const loadSongToDeck = useCallback(async (deckId: DeckId, songIndex: number) => {
    const audioRef = deckId === 'A' ? audioPlayerARef : audioPlayerBRef;
    const setDeckState = deckId === 'A' ? setDeckAState : setDeckBState;
    const song = songIndex >= 0 ? playlist[songIndex] : null;

    if (audioRef.current && song) {
        const cachedData = await getSong(song.name);
        let songUrl = song.url;
        if (cachedData) {
            const blob = new Blob([cachedData], { type: song.file?.type || 'audio/mpeg' });
            songUrl = URL.createObjectURL(blob);
        }

        audioRef.current.src = songUrl;
        audioRef.current.load();
        setDeckState(prev => ({ ...prev, song, status: deckId === activeDeckId ? (isPlaying ? 'playing' : 'paused') : 'standby' }));
    } else {
        if (audioRef.current) audioRef.current.src = '';
        setDeckState(initialDeckState);
    }
  }, [playlist, activeDeckId, isPlaying]);

  useEffect(() => {
    const loadSongs = async () => {
        const standbyDeckId = activeDeckId === 'A' ? 'B' : 'A';
        const nextIndex = getNextSongIndex();
        
        if (currentSongIndex >= 0) {
            await loadSongToDeck(activeDeckId, currentSongIndex);
        } else {
            await loadSongToDeck(activeDeckId, -1);
        }
        if (nextIndex >= 0 && nextIndex !== currentSongIndex) {
            await loadSongToDeck(standbyDeckId, nextIndex);
        } else {
            await loadSongToDeck(standbyDeckId, -1);
        }
    };
    loadSongs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex, activeDeckId, playlist, isShuffle, isRepeat, loadSongToDeck]);

  const handlePlayPause = () => {
    if (playlist.length === 0) return;
    if (!audioContextInitialized.current && audioPlayerARef.current && audioPlayerBRef.current) {
        initAudioEffects(audioPlayerARef.current, audioPlayerBRef.current);
        audioContextInitialized.current = true;
    }
    const newIsPlaying = !isPlaying;
    const audioRef = activeDeckId === 'A' ? audioPlayerARef : audioPlayerBRef;
    
    if (audioRef.current) {
      if (newIsPlaying) {
        if(currentSongIndex === -1) {
          setCurrentSongIndex(0);
        }
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(newIsPlaying);
    }
  };

  const playNextSong = useCallback(() => {
    const nextIndex = getNextSongIndex();
    if (nextIndex === -1) {
      setIsPlaying(false);
      return;
    }
    
    const newActiveDeckId = activeDeckId === 'A' ? 'B' : 'A';
    
    setCurrentSongIndex(nextIndex);
    setActiveDeckId(newActiveDeckId);

    if (isPlaying) {
      const newActivePlayer = newActiveDeckId === 'A' ? audioPlayerARef.current : audioPlayerBRef.current;
      newActivePlayer?.play().catch(console.error);
    }
  }, [getNextSongIndex, activeDeckId, isPlaying]);

  const handleNext = () => {
    if (playlist.length === 0) return;
    playNextSong();
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentSongIndex > 0 ? currentSongIndex - 1 : playlist.length - 1;
    setCurrentSongIndex(prevIndex);
  };

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const updateProgress = (deckId: DeckId) => {
    const audioRef = deckId === 'A' ? audioPlayerARef : audioPlayerBRef;
    const setDeckState = deckId === 'A' ? setDeckAState : setDeckBState;
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (!isNaN(duration)) {
        setDeckState(prev => ({
          ...prev,
          currentTime,
          duration: duration,
          progress: duration > 0 ? (currentTime / duration) * 100 : 0,
        }));
      }
    }
  };

  const handleFilesAdded = (files: FileList) => {
    const newSongs: Song[] = Array.from(files)
      .filter(file => file.type.startsWith('audio/'))
      .map(file => ({
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Artista Desconhecido",
        url: URL.createObjectURL(file),
        file: file,
      }));
    
    newSongs.forEach(song => {
      if (song.file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            saveSong({ name: song.name, data: e.target.result as ArrayBuffer });
          }
        };
        reader.readAsArrayBuffer(song.file);
      }
    });

    const wasEmpty = playlist.length === 0;
    setPlaylist(prev => [...prev, ...newSongs]);
    if (wasEmpty && newSongs.length > 0) {
      setCurrentSongIndex(0);
    }
  };

  useEffect(() => {
    const players = [audioPlayerARef, audioPlayerBRef];
    players.forEach((ref, index) => {
      const player = ref.current;
      if (player) {
        const deckId = index === 0 ? 'A' : 'B';
        const onTimeUpdate = () => updateProgress(deckId);
        const onLoadedMetadata = () => updateProgress(deckId);
        const onEnded = () => {
          if (deckId === activeDeckId) {
            playNextSong();
          }
        };

        player.addEventListener('timeupdate', onTimeUpdate);
        player.addEventListener('loadedmetadata', onLoadedMetadata);
        player.addEventListener('ended', onEnded);
        
        return () => {
          player.removeEventListener('timeupdate', onTimeUpdate);
          player.removeEventListener('loadedmetadata', onLoadedMetadata);
          player.removeEventListener('ended', onEnded);
        };
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId, playNextSong, playlist]);
  
   useEffect(() => {
    const setDeckStatus = (deckId: DeckId, status: DeckState['status']) => {
        const setter = deckId === 'A' ? setDeckAState : setDeckBState;
        setter(prev => (prev.status !== status ? { ...prev, status } : prev));
    };
    
    setDeckStatus('A', activeDeckId === 'A' ? (deckAState.song ? (isPlaying ? 'playing' : 'paused') : 'empty') : (deckAState.song ? 'standby' : 'empty'));
    setDeckStatus('B', activeDeckId === 'B' ? (deckBState.song ? (isPlaying ? 'playing' : 'paused') : 'empty') : (deckBState.song ? 'standby' : 'empty'));

  }, [isPlaying, activeDeckId, deckAState.song, deckBState.song]);

  const handleGenerateText = async () => {
    setIsGenerating(true);
    setIsTextModalOpen(true);
    setModalContent('');
    const currentSong = playlist[currentSongIndex] || null;
    const nextSong = playlist[getNextSongIndex()] || null;
    const banter = await generateDjBanter(currentSong, nextSong);
    setModalContent(banter);
    setIsGenerating(false);
  };
  
  const handleGenerateAudio = async () => {
    setIsGenerating(true);
    setIsTtsModalOpen(true);
    setTtsAudioUrl(null);
    const currentSong = playlist[currentSongIndex] || null;
    const nextSong = playlist[getNextSongIndex()] || null;
    const audioUrl = await generateDjSpeech(currentSong, nextSong, selectedVoice);
    setTtsAudioUrl(audioUrl);
    setIsGenerating(false);
  };

  const handleParamsChange = (effect: EffectType, param: keyof any, value: number) => {
    setEffectParams(prev => ({
      ...prev,
      [effect]: { ...prev[effect], [param]: value }
    }));
  };

  const handleTargetChange = (deckId: DeckId) => {
    setEffectTargets(prev => ({...prev, [deckId]: !prev[deckId]}));
  };
  
  const handleDeckVolumeChange = (deckId: DeckId, volume: number) => {
    if (audioContextInitialized.current) {
        setDeckVolume(deckId, volume);
    }
    const setDeckState = deckId === 'A' ? setDeckAState : setDeckBState;
    setDeckState(prev => ({ ...prev, volume }));
  };
  
  const handleMasterVolumeChange = (volume: number) => {
    if (audioContextInitialized.current) {
        setMasterVolume(volume);
    }
    setMasterVolume(volume);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 via-gray-900 to-red-900 text-white min-h-screen flex flex-col">
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
            <Deck deckId="A" state={deckAState} isActive={activeDeckId === 'A'} />
            <Mixer
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrev={handlePrev}
                isPlaying={isPlaying}
                isPlaylistEmpty={playlist.length === 0}
                activeDeckId={activeDeckId}
                onGenerateText={handleGenerateText}
                onGenerateAudio={handleGenerateAudio}
                isGenerating={isGenerating}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                deckAVolume={deckAState.volume}
                onDeckAVolumeChange={(v) => handleDeckVolumeChange('A', v)}
                deckBVolume={deckBState.volume}
                onDeckBVolumeChange={(v) => handleDeckVolumeChange('B', v)}
                masterVolume={masterVolume}
                onMasterVolumeChange={handleMasterVolumeChange}
                activeEffect={activeEffect}
                onEffectChange={setActiveEffect}
                effectParams={effectParams}
                onParamsChange={handleParamsChange}
                effectTargets={effectTargets}
                onTargetChange={handleTargetChange}
            />
            <Deck deckId="B" state={deckBState} isActive={activeDeckId === 'B'} />
        </div>
        <Playlist
            songs={playlist}
            currentSongIndex={currentSongIndex}
            activeDeckSongIndex={currentSongIndex}
            onFilesAdded={handleFilesAdded}
            onSongSelect={handleSongSelect}
            isShuffle={isShuffle}
            onShuffleToggle={setIsShuffle}
            isRepeat={isRepeat}
            onRepeatToggle={setIsRepeat}
        />
      </div>

      <Footer />
      
      <audio ref={audioPlayerARef} crossOrigin="anonymous" />
      <audio ref={audioPlayerBRef} crossOrigin="anonymous" />
      
      <Modal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        title="Anúncio do DJ Faísca"
        icon={<i className="ph-fill ph-sparkle text-purple-400"></i>}
      >
        {isGenerating ? (
          <div className="text-center">
            <div className="loader mx-auto"></div>
            <p className="text-gray-400 mt-3">Gerando ideias...</p>
          </div>
        ) : (
          <p className="text-gray-200 text-lg leading-relaxed">{modalContent}</p>
        )}
      </Modal>

      <Modal
        isOpen={isTtsModalOpen}
        onClose={() => setIsTtsModalOpen(false)}
        title="Áudio do DJ Faísca"
        icon={<i className="ph-fill ph-microphone text-purple-400"></i>}
      >
        {isGenerating ? (
          <div className="text-center">
            <div className="loader mx-auto"></div>
            <p className="text-gray-400 mt-3">Gerando áudio...</p>
          </div>
        ) : (
          <div className="w-full">
            {ttsAudioUrl ? (
                <>
                <p className="text-gray-300 text-center mb-4">Anúncio gerado! Clique no play.</p>
                <audio src={ttsAudioUrl} controls autoPlay className="w-full" />
                </>
            ) : (
                <p className="text-red-400 text-center">Não foi possível gerar o áudio. Tente novamente.</p>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}

export default App;
