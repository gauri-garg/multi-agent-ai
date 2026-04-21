import React from 'react';
import { ShareIcon, SunIcon, MoonIcon, MenuIcon, LogoIcon } from './icons';

export default function Header({ toggleSidebar, theme, toggleTheme, onShare }) {
  return (
    <header className={`p-4 border-b sticky top-0 z-10 flex justify-between items-center shadow-sm backdrop-blur-xl transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white/80 border-gray-200'}`}>
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
          <MenuIcon />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <LogoIcon className="w-7 h-7 text-blue-600 dark:text-blue-500" />
          <span className={`text-lg font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Multi-Agent AI</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onShare} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors shadow-sm ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
          <ShareIcon /> <span className="hidden sm:block">Share</span>
        </button>
        <button onClick={toggleTheme} className={`p-2 rounded-xl transition-colors border shadow-sm ${theme === 'dark' ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-yellow-400' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
      </div>
    </header>
  );
}