import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import { LogoIcon } from './icons';

export default function ChatWindow({ currentChat, isReady, loading, theme, showToast, onRegenerate }) {
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentChat, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
      {currentChat?.messages?.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center gap-6 opacity-80 mt-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl text-white"><LogoIcon className="w-10 h-10"/></div>
          <p className={`text-xl font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>How can I help you today?</p>
        </div>
      )}
      {currentChat?.messages?.map(msg => <MessageBubble key={msg.id} msg={msg} isReady={isReady} theme={theme} showToast={showToast} onRegenerate={onRegenerate} />)}
      
      {loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
          <div className={`flex items-center gap-3 p-4 rounded-3xl rounded-tl-sm shadow-sm border ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200'}`}><div className="flex gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span></div><span className={`text-sm font-medium tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Thinking...</span></div>
        </motion.div>
      )}
      <div ref={chatEndRef} className="h-4" />
    </div>
  );
}