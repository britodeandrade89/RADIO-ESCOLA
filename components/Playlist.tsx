
import React from 'react';
import type { Song } from '../types';

interface PlaylistProps {
  songs: Song[];
  currentSongIndex: number;
  activeDeckSongIndex: number;
  onFilesAdded: (files: FileList) => void;
  onSongSelect: (index: number) => void;
  isShuffle: boolean;
  onShuffleToggle: (checked: boolean) => void;
  isRepeat: boolean;
  onRepeatToggle: (checked: boolean) => void;
}

const Playlist: React.FC<PlaylistProps> = ({
  songs,
  activeDeckSongIndex,
  onFilesAdded,
  onSongSelect,
  isShuffle,
  onShuffleToggle,
  isRepeat,
  onRepeatToggle
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesAdded(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="min-h-[24rem] flex flex-col p-4 bg-gray-900 rounded-lg mt-4 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-white">Biblioteca de Músicas</h2>
        
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="shuffle-toggle" checked={isShuffle} onChange={(e) => onShuffleToggle(e.target.checked)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-blue-500 rounded focus:ring-blue-500" />
            <label htmlFor="shuffle-toggle" className="text-sm font-medium text-gray-300">Aleatório</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="repeat-toggle" checked={isRepeat} onChange={(e) => onRepeatToggle(e.target.checked)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-blue-500 rounded focus:ring-blue-500" />
            <label htmlFor="repeat-toggle" className="text-sm font-medium text-gray-300">Repetir Playlist</label>
          </div>
          <label className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg text-center cursor-pointer transition-colors duration-200 flex items-center shadow-md">
            <i className="ph ph-plus-circle mr-2"></i>
            Adicionar Músicas
            <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </div>
      
      <div id="playlist" className="flex-1 bg-gray-950 rounded-lg overflow-y-auto min-h-[200px] border border-gray-800">
        {songs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
             <i className="ph ph-music-notes text-6xl mb-4 opacity-50"></i>
             <p className="text-lg">Sua playlist está vazia.</p>
             <p className="text-sm mt-2">Adicione arquivos de áudio para começar a mixar.</p>
          </div>
        ) : (
          <ul>
            {songs.map((song, index) => (
              <li
                key={song.url}
                onClick={() => onSongSelect(index)}
                className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors duration-150 border-b border-gray-800 last:border-0 ${index === activeDeckSongIndex ? 'bg-blue-900/40 border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex items-center space-x-4 overflow-hidden">
                  <span className="text-xs text-gray-600 w-6 text-center">{index + 1}</span>
                  <i className={`ph ${index === activeDeckSongIndex ? 'ph-fill ph-speaker-high text-blue-400' : 'ph-music-note text-gray-400'}`}></i>
                  <div className="min-w-0">
                    <p className={`font-semibold truncate ${index === activeDeckSongIndex ? 'text-blue-300' : 'text-white'}`}>{song.name}</p>
                    <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white p-2">
                   <i className={`ph ${index === activeDeckSongIndex ? 'ph-fill ph-chart-bar text-blue-400' : 'ph-play-circle text-xl'}`}></i>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Playlist;
