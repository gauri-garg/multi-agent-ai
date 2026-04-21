import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperClipIcon, PaperAirplaneIcon, SettingsIcon } from "./icons";

export default function InputBox({ input, setInput, sendTask, file, setFile, filePreview, setFilePreview, loading, aiLength, setAiLength, aiFormat, setAiFormat, aiTone, setAiTone, aiLanguage, setAiLanguage, rememberPrefs, setRememberPrefs, theme }) {
  const textareaRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && (input.trim() || file)) sendTask();
    }
  };

  return (
    <div className={`p-4 pb-6 md:px-6 relative z-10 ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-transparent'} backdrop-blur-sm`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-2 relative">
        
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute bottom-[110%] left-0 p-4 rounded-2xl shadow-xl border w-72 md:w-96 z-50 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1"><label className={`text-[10px] uppercase font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Length</label><select value={aiLength} onChange={(e) => setAiLength(e.target.value)} className={`text-xs rounded-xl px-3 py-2 outline-none cursor-pointer border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}><option>Auto</option><option>Short</option><option>Medium</option><option>Detailed</option></select></div>
                <div className="flex flex-col gap-1"><label className={`text-[10px] uppercase font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Format</label><select value={aiFormat} onChange={(e) => setAiFormat(e.target.value)} className={`text-xs rounded-xl px-3 py-2 outline-none cursor-pointer border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}><option>Auto</option><option>Paragraph</option><option>Bullet Points</option><option>Table</option><option>Markdown</option></select></div>
                <div className="flex flex-col gap-1"><label className={`text-[10px] uppercase font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Tone</label><select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className={`text-xs rounded-xl px-3 py-2 outline-none cursor-pointer border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}><option>Auto</option><option>Professional</option><option>Friendly</option><option>Technical</option></select></div>
                <div className="flex flex-col gap-1"><label className={`text-[10px] uppercase font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Language</label><select value={aiLanguage} onChange={(e) => setAiLanguage(e.target.value)} className={`text-xs rounded-xl px-3 py-2 outline-none cursor-pointer border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}><option>Auto</option><option>English</option><option>Hinglish</option><option>Hindi</option></select></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {file && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-fit mb-1 ml-2">
              <div className={`relative rounded-xl overflow-hidden border shadow-lg group ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                {filePreview ? <img src={filePreview} alt="Preview" className="h-16 md:h-20 w-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" /> : <div className="h-16 w-20 flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-2xl">📄</div>}
                <button onClick={() => { setFile(null); setFilePreview(null); }} className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 transition-colors backdrop-blur-sm"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex items-end relative rounded-3xl p-2 shadow-sm border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500' : 'bg-white border-gray-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 shadow-md'}`}>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-3 transition-colors ${showSettings ? 'text-blue-500' : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-700')}`} title="AI Settings">
            <SettingsIcon />
          </button>
          
          <label className={`cursor-pointer p-3 transition-colors flex-shrink-0 ${theme === 'dark' ? 'text-slate-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-600'}`}>
            <PaperClipIcon />
            <input type="file" hidden onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setFilePreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null); } e.target.value = null; }} />
          </label>

          <textarea
            ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            className={`flex-1 max-h-[150px] min-h-[44px] bg-transparent border-none focus:outline-none focus:ring-0 py-3 px-2 resize-none self-center text-sm md:text-base custom-scrollbar ${theme === 'dark' ? 'text-slate-100 placeholder-slate-500' : 'text-gray-900 placeholder-gray-400'}`}
            placeholder="Message Multi-Agent AI..." rows={1}
          />

          <button 
            onClick={() => sendTask()} disabled={(!input.trim() && !file) || loading} 
            className={`p-3 rounded-2xl flex-shrink-0 transition-all duration-200 flex items-center justify-center h-10 w-10 mb-1 mr-1 ${((!input.trim() && !file) || loading) ? (theme === 'dark' ? 'bg-slate-700 text-slate-500' : 'bg-gray-100 text-gray-300') : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95 shadow-md'}`}
          >
            <PaperAirplaneIcon />
          </button>
        </div>
        <div className={`text-center text-[11px] mt-1 font-medium tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
          AI agents can make mistakes. Consider verifying important information.
        </div>
      </div>
    </div>
  );
}