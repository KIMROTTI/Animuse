import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import Visualizer from './components/Visualizer';
import { composeMusic } from './services/geminiService';
import { audioEngine } from './services/audioEngine';
import { Composition } from './types';

function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [composition, setComposition] = useState<Composition | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [moodColor, setMoodColor] = useState<string>('#8b5cf6'); // Default purple

  // Determine color based on composition metadata
  useEffect(() => {
      if (!composition) return;
      
      const bpm = composition.bpm;
      const key = composition.key.toLowerCase();
      
      if (bpm > 130) setMoodColor('#ef4444'); // Red/Fast
      else if (key.includes('minor')) setMoodColor('#3b82f6'); // Blue/Sad
      else if (key.includes('major') && bpm > 100) setMoodColor('#eab308'); // Yellow/Happy
      else setMoodColor('#8b5cf6'); // Default Purple

  }, [composition]);

  const handleGenerate = async () => {
    setIsLoading(true);
    // Pause current playback if any
    if (isPlaying) {
        audioEngine.stop();
        setIsPlaying(false);
    }

    try {
      const result = await composeMusic(prompt);
      setComposition(result);
      
      // Initialize audio engine if not already done
      await audioEngine.init();
      
      // Load the new composition
      audioEngine.loadComposition(result);
      
      // Auto play
      await audioEngine.play();
      setIsPlaying(true);
      
    } catch (error) {
      alert("Failed to compose music. Please try again with a different prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateComposition = (newComposition: Composition) => {
    setComposition(newComposition);
    audioEngine.loadComposition(newComposition);
    // If it was playing, restart it because loadComposition stops it
    if (isPlaying) {
        audioEngine.play();
    }
  };

  const togglePlay = async () => {
    if (!composition) return;
    
    // Ensure engine is init (needed for first interaction policy)
    if (!audioEngine.isInitialized) await audioEngine.init();

    if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
      audioEngine.stop();
      setIsPlaying(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-b from-slate-900 to-black overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                <i className="fa-solid fa-music"></i>
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Animuse</h1>
                <p className="text-slate-400 text-xs md:text-sm">AI BGM Generator for Animators</p>
            </div>
        </div>
        <a href="https://github.com/google/generative-ai-js" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-brands fa-github text-xl"></i>
        </a>
      </header>

      {/* Main Content Grid */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
        
        {/* Left Col: Visualizer & Info */}
        <div className="flex flex-col space-y-6">
            <Visualizer isPlaying={isPlaying} moodColor={moodColor} />
            
            {composition ? (
                <div className="glass-panel p-6 rounded-xl border-l-4 transition-colors" style={{ borderLeftColor: moodColor }}>
                    <h3 className="text-lg font-bold text-white mb-2">{composition.title || "Untitled Composition"}</h3>
                    <p className="text-slate-300 text-sm mb-4 italic">"{composition.description}"</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-800/50 p-2 rounded">
                            <div className="text-xs text-slate-400 uppercase">Original BPM</div>
                            <div className="text-xl font-mono text-white">{composition.bpm}</div>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded">
                            <div className="text-xs text-slate-400 uppercase">Original Key</div>
                            <div className="text-xl font-mono text-white">{composition.key}</div>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded">
                            <div className="text-xs text-slate-400 uppercase">Tracks</div>
                            <div className="text-xl font-mono text-white">
                                {[
                                    composition.tracks.melody.notes.length > 0, 
                                    composition.tracks.bass.notes.length > 0, 
                                    composition.tracks.harmony.notes.length > 0
                                ].filter(Boolean).length}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center text-center h-48 border-dashed border-2 border-slate-700">
                    <i className="fa-solid fa-wave-square text-4xl text-slate-600 mb-4"></i>
                    <p className="text-slate-400">Describe a scene to generate a visualizer and soundtrack.</p>
                </div>
            )}
        </div>

        {/* Right Col: Controls */}
        <div className="flex flex-col justify-center">
             <ControlPanel 
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                isPlaying={isPlaying}
                onPlayPause={togglePlay}
                onStop={handleStop}
                currentTitle={composition?.title}
                compositionData={composition}
                onUpdateComposition={handleUpdateComposition}
             />
             
             <div className="mt-8 text-center text-slate-500 text-xs">
                 <p>Powered by Google Gemini 2.5 Flash & Tone.js</p>
                 <p className="mt-1">Designed for quick moodboarding and scene scoring.</p>
             </div>
        </div>

      </main>
    </div>
  );
}

export default App;