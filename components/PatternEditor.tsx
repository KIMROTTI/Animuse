import React, { useState, useEffect } from 'react';
import { Composition } from '../types';

interface PatternEditorProps {
  composition: Composition;
  onUpdate: (c: Composition) => void;
}

const PatternEditor: React.FC<PatternEditorProps> = ({ composition, onUpdate }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Update code when composition changes externally, unless user is typing
    if (!isDirty) {
        setCode(JSON.stringify(composition, null, 2));
    }
  }, [composition, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCode(e.target.value);
      setIsDirty(true);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(code);
      
      // Basic validation to ensure it doesn't crash the engine
      if (!parsed.tracks || !parsed.tracks.melody) {
          throw new Error("Invalid structure: Missing 'tracks' or 'melody'.");
      }
      
      setError(null);
      setIsDirty(false);
      onUpdate(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#0f172a] rounded-xl overflow-hidden border border-slate-700 shadow-2xl font-mono text-sm relative">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
            <i className="fa-solid fa-code text-slate-400"></i>
            <span className="text-slate-400 text-xs font-bold tracking-wider">pattern.json</span>
        </div>
        <button 
           onClick={handleApply}
           className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center space-x-2 ${
               isDirty 
               ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' 
               : 'bg-slate-700 text-slate-400 hover:text-white'
           }`}
        >
           <i className="fa-solid fa-play"></i>
           <span>RUN CODE</span>
        </button>
      </div>

      {/* Code Area */}
      <div className="relative flex-1">
        <textarea
            value={code}
            onChange={handleChange}
            className="w-full h-full p-4 bg-[#0b1120] text-purple-300 focus:outline-none resize-none font-mono leading-relaxed"
            spellCheck={false}
            style={{ fontFamily: '"Fira Code", monospace' }}
        />
        
        {/* Error Toast */}
        {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 text-red-200 p-3 rounded-lg text-xs border border-red-700 flex items-start space-x-2 animate-bounce-in">
                <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                <span>{error}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default PatternEditor;