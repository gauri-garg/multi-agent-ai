import React from 'react';

export default function AgentCityHeader({ toggleSidebar, theme, toggleTheme, onShare, currentChat, isSidebarCollapsed }) {
    return (
        <div className={`flex items-center justify-between p-4 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-gray-200 bg-white/80 text-gray-900'} backdrop-blur-md sticky top-0 z-10`}>
            <div className="flex items-center gap-3">
                <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-black/5 md:hidden">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight flex items-center gap-2">
                       <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">AgentCity</span>
                       {currentChat && <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{currentChat.name}</span>}
                    </span>
                    <span className="text-xs opacity-60">Advanced Intelligence</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-gray-100 text-indigo-600'}`} title="Toggle Theme">
                    {theme === 'dark' ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                    )}
                </button>
                {currentChat && (
                    <button onClick={onShare} className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`} title="Share Chat">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
}