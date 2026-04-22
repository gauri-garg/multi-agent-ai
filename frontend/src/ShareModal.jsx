import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CopyIcon, CheckIcon } from './icons';

export default function ShareModal({ isOpen, onClose, theme, showToast }) {
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const fakeLink = "https://multi-agent-ai.app/share/ck82mPq";

  const handleCopy = () => {
    navigator.clipboard.writeText(fakeLink);
    setCopied(true);
    showToast("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-900'}`}>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Share Chat</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><XMarkIcon /></button>
            </div>

            <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-sm">Public Link</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Anyone with the link can view</p>
              </div>
              <button onClick={() => setIsPublic(!isPublic)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-blue-600' : 'bg-gray-400 dark:bg-slate-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {isPublic && (
              <div className="flex items-center gap-2">
                <input readOnly value={fakeLink} className={`flex-1 p-3 text-sm rounded-xl border outline-none ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-slate-700'}`} />
                <button onClick={handleCopy} className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors">{copied ? <CheckIcon/> : <CopyIcon/>}</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}