import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div 
            key={t.id} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.9}} 
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-xl text-sm font-medium border border-slate-700 tracking-wide pointer-events-auto"
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}