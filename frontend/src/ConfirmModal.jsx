import React from 'react';
import { motion } from 'framer-motion';

export default function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", onConfirm, onCancel, theme, isDestructive = false }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
        className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-900'}`}>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className={`flex-1 py-2.5 rounded-xl font-semibold border transition-colors ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>Cancel</button>
          <button onClick={() => { onConfirm(); onCancel(); }} 
            className={`flex-1 py-2.5 rounded-xl font-semibold text-white shadow-md transition-colors ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}