import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function InputBar({ input, setInput, sendTask, file, setFile, filePreview, setFilePreview, loading, aiLength, setAiLength, aiFormat, setAiFormat, aiTone, setAiTone, aiLanguage, setAiLanguage, rememberPrefs, setRememberPrefs }) {
  const textareaRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-resize textarea
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

  // Build active settings string
  const activeSettings = [
    aiLength !== "Auto" ? aiLength : null,
    aiFormat !== "Auto" ? aiFormat : null,
    aiTone !== "Auto" ? aiTone : null,
    aiLanguage !== "Auto" ? aiLanguage : null,
  ].filter(Boolean).join(" | ");

  return (
    <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md relative z-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        
        {/* AI Controls Panel */}
        <div className="w-full">
          <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-400 transition-colors mb-1 ml-1 px-2 py-1 rounded-md hover:bg-slate-800/50 w-fit">
            <svg className={`w-3.5 h-3.5 transform transition-transform ${showSettings ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            ⚙️ AI Settings {activeSettings ? <span className="text-blue-400">({activeSettings})</span> : "(Auto)"}
          </button>
          
          <AnimatePresence>
            {showSettings && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-2xl mb-3 mt-1 shadow-inner grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-1">Length</label>
                    <select value={aiLength} onChange={(e) => setAiLength(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50 shadow-sm cursor-pointer hover:bg-slate-800 transition-colors">
                      <option>Auto</option><option>Short</option><option>Medium</option><option>Detailed</option><option>10 lines</option><option>100 lines</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-1">Format</label>
                    <select value={aiFormat} onChange={(e) => setAiFormat(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50 shadow-sm cursor-pointer hover:bg-slate-800 transition-colors">
                      <option>Auto</option><option>Paragraph</option><option>Bullet Points</option><option>Numbered Steps</option><option>Table</option><option>Comparison</option><option>Report</option><option>Flowchart Text</option><option>Markdown</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-1">Tone</label>
                    <select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50 shadow-sm cursor-pointer hover:bg-slate-800 transition-colors">
                      <option>Auto</option><option>Student</option><option>Professional</option><option>Teacher</option><option>Friendly</option><option>Technical</option><option>Interviewer</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-1">Language</label>
                    <select value={aiLanguage} onChange={(e) => setAiLanguage(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50 shadow-sm cursor-pointer hover:bg-slate-800 transition-colors">
                      <option>Auto</option><option>English</option><option>Hinglish</option><option>Hindi</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 md:col-span-4 flex items-center justify-between bg-slate-900/50 px-4 py-2 rounded-xl mt-1 border border-slate-700/50">
                    <span className="text-xs text-slate-300 font-medium">Remember my preferences</span>
                    <button 
                      onClick={() => setRememberPrefs(!rememberPrefs)} 
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${rememberPrefs ? 'bg-blue-500' : 'bg-slate-600'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${rememberPrefs ? 'translate-x-4.5' : 'translate-x-1'}`} />
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* File Preview */}
        <AnimatePresence>
          {file && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-fit mb-1">
              <div className="relative rounded-xl overflow-hidden border border-slate-600 shadow-lg bg-slate-800 group">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="h-20 md:h-24 w-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="h-20 w-24 flex items-center justify-center bg-slate-700 text-3xl">📄</div>
                )}
                <button onClick={() => { setFile(null); setFilePreview(null); }} className="absolute top-1 right-1 bg-slate-900/80 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs transition-colors backdrop-blur-sm shadow-md">
                  ✖
                </button>
              </div>
              <div className="text-xs text-blue-300 mt-1.5 truncate max-w-[200px] font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                {file.name}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex gap-2 items-end relative bg-slate-800/80 border border-slate-700 rounded-3xl p-1.5 shadow-lg focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
          <label className="cursor-pointer p-3 hover:bg-slate-700/80 rounded-2xl transition-colors text-slate-400 hover:text-blue-400 flex-shrink-0 group">
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            <input
              type="file"
              hidden
              onChange={(e) => { 
                const f = e.target.files[0]; 
                if (f) { setFile(f); setFilePreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null); }
                e.target.value = null; 
              }}
            />
          </label>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 max-h-[150px] min-h-[44px] bg-transparent border-none focus:outline-none focus:ring-0 py-3 px-1 text-slate-100 placeholder-slate-500 resize-none self-center text-sm md:text-base custom-scrollbar"
            placeholder="Message Multi-Agent AI..."
            rows={1}
          />

          <button onClick={sendTask} disabled={(!input.trim() && !file) || loading} className={`p-3 rounded-2xl flex-shrink-0 transition-all duration-200 shadow-md flex items-center justify-center h-12 w-12 mb-0.5 mr-0.5 ${((!input.trim() && !file) || loading) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-[1px] translate-y-[1px]">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </div>
        <div className="text-center text-[11px] text-slate-500 mt-1 font-medium tracking-wide">
          AI agents can make mistakes. Consider verifying important information.
        </div>
      </div>
    </div>
  );
}