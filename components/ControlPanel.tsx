import React, { useState, useEffect } from 'react';
import { ScenePreset, Composition } from '../types';
import { audioEngine } from '../services/audioEngine';
import PatternEditor from './PatternEditor';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (s: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentTitle?: string;
  compositionData?: Composition | null;
  onUpdateComposition: (c: Composition) => void;
}

const PRESETS: ScenePreset[] = [
  { emoji: '🏃', label: 'Chase', prompt: 'High speed chase scene, frantic synthwave, urgent bassline, 160bpm' },
  { emoji: '😢', label: 'Sad', prompt: 'A lonely robot walking in the rain, slow melancholic piano and pads, 70bpm' },
  { emoji: '⚔️', label: 'Battle', prompt: 'Epic boss fight, heavy distortion, dramatic orchestral hits, intense 140bpm' },
  { emoji: '✨', label: 'Wonder', prompt: 'Floating in space, ethereal chimes, vast reverb, slow ambient textures' },
];

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  prompt, 
  setPrompt, 
  onGenerate, 
  isLoading, 
  isPlaying, 
  onPlayPause,
  onStop,
  currentTitle,
  compositionData,
  onUpdateComposition
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'studio' | 'code'>('create');
  
  // Studio State
  const [bpm, setBpm] = useState(120);
  const [transpose, setTranspose] = useState(0);
  const [volumes, setVolumes] = useState({ melody: -6, harmony: -12, bass: -4, rhythm: -5 });
  const [isExporting, setIsExporting] = useState(false);

  // Sync state when new composition loads
  useEffect(() => {
    if (compositionData) {
        setBpm(compositionData.bpm);
        setTranspose(0);
        // Switch to studio on new generation, but if we are editing code, stay there? 
        // Let's default to studio to show the controls first.
        if (activeTab === 'create') setActiveTab('studio');
    }
  }, [compositionData]);

  const handleBpmChange = (newBpm: number) => {
      setBpm(newBpm);
      audioEngine.setBpm(newBpm);
  };

  const handleTranspose = (delta: number) => {
      const newVal = Math.max(-12, Math.min(12, transpose + delta));
      setTranspose(newVal);
      audioEngine.setTranspose(newVal);
  };

  const handleVolumeChange = (track: 'melody' | 'harmony' | 'bass' | 'rhythm', val: number) => {
      setVolumes(prev => ({ ...prev, [track]: val }));
      audioEngine.setVolume(track, val);
  };

  const handleExportAudio = async () => {
      setIsExporting(true);
      try {
          const blob = await audioEngine.exportAudio();
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.download = `animuse-${currentTitle || 'track'}.webm`;
          anchor.href = url;
          anchor.click();
      } catch (e) {
          console.error(e);
          alert("Export failed");
      } finally {
          setIsExporting(false);
      }
  };

  const handleSaveProject = () => {
      if (!compositionData) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(compositionData));
      const anchor = document.createElement('a');
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", `animuse-project-${Date.now()}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
  };

  return (
    <div className="glass-panel rounded-2xl w-full max-w-xl mx-auto animate-fade-in-up overflow-hidden flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-xs md:text-sm font-bold tracking-wide transition-colors ${activeTab === 'create' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
              CREATE
          </button>
          <button 
            onClick={() => setActiveTab('studio')}
            disabled={!compositionData}
            className={`flex-1 py-3 text-xs md:text-sm font-bold tracking-wide transition-colors ${activeTab === 'studio' ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
          >
              STUDIO
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            disabled={!compositionData}
            className={`flex-1 py-3 text-xs md:text-sm font-bold tracking-wide transition-colors ${activeTab === 'code' ? 'bg-green-600/20 text-green-300 border-b-2 border-green-500' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
          >
              CODE
          </button>
      </div>

      <div className="p-6 space-y-6">
        {/* --- CREATE TAB --- */}
        {activeTab === 'create' && (
            <>
                {/* Input Section */}
                <div className="relative">
                    <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your scene (e.g., 'A cyberpunk detective investigating a neon alleyway...')"
                    className="w-full bg-slate-800/50 text-white placeholder-slate-400 border border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none focus:border-transparent transition-all h-32 resize-none font-mono text-sm"
                    />
                    <div className="absolute bottom-3 right-3 flex space-x-2">
                        <button 
                            onClick={() => setShowPresets(!showPresets)}
                            className="text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 px-2 py-1 rounded border border-slate-700"
                        >
                        {showPresets ? 'Hide Ideas' : 'Need Ideas?'}
                        </button>
                    </div>
                </div>

                {/* Presets Slide-down */}
                {showPresets && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-slate-800/50 rounded-lg">
                        {PRESETS.map((p, idx) => (
                            <button 
                                key={idx}
                                onClick={() => { setPrompt(p.prompt); setShowPresets(false); }}
                                className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded transition-colors text-left group"
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">{p.emoji}</span>
                                <span className="text-sm text-slate-300">{p.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Generate Button */}
                <button
                onClick={onGenerate}
                disabled={isLoading || !prompt.trim()}
                className={`w-full py-4 rounded-lg font-bold text-white shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-95 ${
                    isLoading 
                    ? 'bg-slate-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                }`}
                >
                {isLoading ? (
                    <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Composing Soundtrack...</span>
                    </>
                ) : (
                    <>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Generate BGM</span>
                    </>
                )}
                </button>
            </>
        )}

        {/* --- STUDIO TAB --- */}
        {activeTab === 'studio' && compositionData && (
            <div className="space-y-6 animate-fade-in">
                {/* Transport Controls */}
                <div className="flex items-center justify-center space-x-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <button 
                        onClick={onStop}
                        className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500 border border-slate-700 transition-all flex items-center justify-center"
                    >
                        <i className="fa-solid fa-stop"></i>
                    </button>
                    
                    <button 
                        onClick={onPlayPause}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-xl ${
                            isPlaying 
                            ? 'bg-amber-500 text-white hover:bg-amber-400' 
                            : 'bg-green-500 text-white hover:bg-green-400'
                        }`}
                    >
                        {isPlaying ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play ml-1"></i>}
                    </button>

                    <div className="text-center w-20">
                         <div className="text-xs text-slate-500 mb-1">TIME</div>
                         <div className="text-lg font-mono text-purple-400">00:00</div>
                    </div>
                </div>

                {/* Global Params */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <label className="text-xs text-slate-400 font-bold mb-2 block flex justify-between">
                            <span>TEMPO</span>
                            <span className="text-white">{Math.round(bpm)} BPM</span>
                        </label>
                        <input 
                            type="range" min="40" max="240" value={bpm} 
                            onChange={(e) => handleBpmChange(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <label className="text-xs text-slate-400 font-bold mb-2 block text-center">KEY TRANSPOSE</label>
                        <div className="flex items-center justify-between px-2">
                            <button onClick={() => handleTranspose(-1)} className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600">-</button>
                            <span className="font-mono text-white w-8 text-center">{transpose > 0 ? '+' : ''}{transpose}</span>
                            <button onClick={() => handleTranspose(1)} className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600">+</button>
                        </div>
                    </div>
                </div>

                {/* Mixer */}
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <h4 className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">Mixer</h4>
                    <div className="space-y-3">
                        {(Object.keys(volumes) as Array<keyof typeof volumes>).map((track) => (
                            <div key={track} className="flex items-center space-x-3">
                                <span className="text-xs text-slate-400 w-16 capitalize">{track}</span>
                                <input 
                                    type="range" min="-40" max="0" value={volumes[track]} 
                                    onChange={(e) => handleVolumeChange(track, Number(e.target.value))}
                                    className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-xs text-slate-500 w-8 text-right">{volumes[track]}dB</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Export Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                     <button 
                        onClick={handleSaveProject}
                        className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
                     >
                        <i className="fa-solid fa-file-code"></i>
                        <span>Save Project</span>
                     </button>
                     <button 
                        onClick={handleExportAudio}
                        disabled={isExporting}
                        className={`py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 ${isExporting ? 'bg-slate-600 text-slate-400' : 'bg-pink-600 hover:bg-pink-500 text-white'}`}
                     >
                        {isExporting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-download"></i>}
                        <span>{isExporting ? 'Recording...' : 'Export Audio'}</span>
                     </button>
                </div>
            </div>
        )}

        {/* --- CODE TAB --- */}
        {activeTab === 'code' && compositionData && (
            <div className="animate-fade-in">
                <PatternEditor 
                    composition={compositionData}
                    onUpdate={onUpdateComposition}
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;