import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentCityInput({ 
  input, setInput, sendTask, stopGeneration, loading, isStopping, theme, 
  file, setFile, filePreview, setFilePreview,
  aiLength, setAiLength, aiFormat, setAiFormat, aiTone, setAiTone
}) {
    const fileInputRef = useRef(null);
    const [showSettings, setShowSettings] = useState(false);

    const handleSend = () => {
        if (loading) stopGeneration();
        else sendTask();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!loading && (input.trim() || file)) handleSend();
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            if (selected.type.startsWith("image/")) setFilePreview(URL.createObjectURL(selected));
            else setFilePreview(null);
        }
        e.target.value = null; // reset to allow selecting the same file again if removed
    };

    return (
        <div className={`p-4 border-t transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/95' : 'border-gray-200 bg-white/95'} backdrop-blur-md sticky bottom-0 z-20`}>
            <div className="max-w-4xl mx-auto flex flex-col gap-2 relative">
                
                {/* Advanced Settings Popover */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute bottom-[110%] left-0 p-4 rounded-2xl shadow-xl border w-full max-w-[320px] z-50 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1"><label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Mode</label><select value={aiLength} onChange={(e) => setAiLength(e.target.value)} className={`text-xs rounded-xl px-3 py-2 outline-none cursor-pointer border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}><option>Auto</option><option>Detailed</option><option>Summary</option></select></div>
                        <div className="flex flex-col gap-1"><label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Tone</label><select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className={`text-xs rounded-xl px-3 py-2 outline-none cursor-pointer border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}><option>Auto</option><option>Professional</option><option>Casual</option><option>Friendly</option><option>Technical</option></select></div>
                        <div className="flex flex-col gap-1"><label className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Format</label><select value={aiFormat} onChange={(e) => setAiFormat(e.target.value)} className={`text-xs rounded-xl px-3 py-2 outline-none cursor-pointer border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}><option>Auto</option><option>Paragraph</option><option>Bullet Points</option><option>Step-by-step</option><option>Table</option><option>Flowchart</option></select></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {file && (
                    <div className="flex items-center gap-3 p-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl w-fit">
                        {filePreview ? <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover" /> : <span className="text-xl">📄</span>}
                        <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => {setFile(null); setFilePreview(null);}} className="hover:text-red-500 transition-colors">✕</button>
                    </div>
                )}
                
                <div className={`flex items-end gap-2 rounded-3xl border p-2 transition-all shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 focus-within:border-blue-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-blue-500/50'}`}>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 rounded-full transition-colors ${showSettings ? 'bg-blue-500/10 text-blue-500' : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-900')}`} title="Output Settings">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </button>
                    
                    <button onClick={() => fileInputRef.current.click()} className={`p-2.5 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-900'}`} title="Attach file">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message AgentCity..."
                        className="flex-1 max-h-48 min-h-[44px] py-3 px-2 bg-transparent outline-none resize-none text-sm placeholder-opacity-50"
                        rows="1"
                    />
                    
                    {/* Dynamic Send / Stop Button */}
                    <button 
                        onClick={handleSend}
                        disabled={isStopping || (!input.trim() && !file && !loading)}
                        className={`relative p-2.5 rounded-full transition-all duration-300 flex items-center justify-center min-w-[44px] h-[44px] shadow-sm 
                        ${loading ? 'text-gray-400 hover:text-red-500' : (input.trim() || file ? 'bg-blue-600 hover:bg-blue-700 text-white' : (theme === 'dark' ? 'bg-slate-700 text-slate-500' : 'bg-gray-200 text-gray-400'))}`}
                        title={loading ? "Stop generation" : "Send message"}
                    >
                        {loading ? (
                            <>
                                {/* Spinning outer loader rim */}
                                <svg className="absolute inset-0 w-full h-full animate-spin opacity-50" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="30 60"></circle></svg>
                                {/* Static Stop square inside */}
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                            </>
                        ) : (
                            <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
