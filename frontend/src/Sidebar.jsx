import React from "react";
import { PlusIcon, SearchIcon, PinIcon, PencilIcon, TrashIcon, SettingsIcon, LogoIcon, XMarkIcon } from "./icons";

export const AgentCityLogo = ({ theme, className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`agentCityGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={theme === 'dark' ? '#3B82F6' : '#0EA5E9'} />
        <stop offset="100%" stopColor={theme === 'dark' ? '#8B5CF6' : '#6366F1'} />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill={`url(#agentCityGrad-${theme})`} />
    
    {/* Abstract City Skyline */}
    <path d="M8 24V15L12 11V24H8Z" fill="white" opacity="0.4" />
    <path d="M13 24V13L19 7V24H13Z" fill="white" opacity="0.9" />
    <path d="M20 24V17L24 14V24H20Z" fill="white" opacity="0.5" />
    
    {/* AI Network Nodes connecting the city */}
    <circle cx="12" cy="11" r="2" fill="#FDE047" />
    <circle cx="19" cy="7" r="2.5" fill="#FDE047" />
    <circle cx="24" cy="14" r="2" fill="#FDE047" />
    <path d="M12 11L19 7L24 14" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Sidebar({ chats, activeChat, setActiveChat, search, setSearch, createNewChat, deleteChat, togglePin, renameChat, editingChatId, setEditingChatId, editName, setEditName, isOpen, setIsOpen, isCollapsed, theme, user, onOpenSettings }) {
  
  const filteredChats = chats.filter(chat => (chat.name || `Chat ${chat.id}`).toLowerCase().includes(search.toLowerCase()));
  const pinned = filteredChats.filter(c => c.pinned);
  const normal = filteredChats.filter(c => !c.pinned);

  const ChatItem = ({ chat }) => (
    <div onClick={() => { setActiveChat(chat.id); setIsOpen(false); }} className={`p-3 mb-1 flex items-center cursor-pointer rounded-xl transition-all duration-200 group ${isCollapsed ? 'justify-center' : 'justify-between'} ${activeChat === chat.id ? (theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700 font-semibold') : (theme === 'dark' ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-gray-100 text-gray-700')}`}>
      {editingChatId === chat.id ? (
        <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => renameChat(chat.id, editName)} onKeyDown={(e) => e.key === 'Enter' && renameChat(chat.id, editName)} onClick={(e) => e.stopPropagation()} className={`text-sm font-medium px-2 py-1 rounded w-full border focus:outline-none ${theme === 'dark' ? 'bg-slate-900 border-blue-500 text-white' : 'bg-white border-blue-400 text-gray-900'}`} />
      ) : (
        isCollapsed ? <svg className="w-5 h-5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> : <span className="truncate pr-2 text-sm font-medium">{chat.name || `Chat ${chat.id}`}</span>
      )}

      {editingChatId !== chat.id && !isCollapsed && (
        <div className={`flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
          <button onClick={(e) => { e.stopPropagation(); setEditingChatId(chat.id); setEditName(chat.name); }} className="hover:text-green-500 p-1" title="Rename"><PencilIcon/></button>
          <button onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }} className="hover:text-blue-500 p-1" title={chat.pinned ? "Unpin" : "Pin"}><PinIcon/></button>
          <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="hover:text-red-500 p-1" title="Delete"><TrashIcon/></button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}
      
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "w-0 md:w-20 overflow-hidden md:border-r" : "w-72 border-r"} ${theme === 'dark' ? 'bg-slate-950 border-slate-800/80' : 'bg-gray-50 border-gray-200'}`}>
        
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-6 md:hidden">
            <div className="flex items-center gap-2 text-blue-500"><AgentCityLogo theme={theme} /><span className={`font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AgentCity</span></div>
            <button onClick={() => setIsOpen(false)} className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}><XMarkIcon/></button>
          </div>
          <div className={`hidden md:flex ${isCollapsed ? 'justify-center' : 'justify-start px-2'} items-center mb-6 mt-2 cursor-pointer`} onClick={() => setIsOpen(!isOpen)}>
            <AgentCityLogo theme={theme} />
            {!isCollapsed && <span className={`ml-3 text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500`}>AgentCity</span>}
          </div>
          <button onClick={createNewChat} className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all active:scale-95 mb-5 ${isCollapsed ? 'px-0' : 'px-4'}`} title="New Chat">
            <PlusIcon /> {!isCollapsed && "New Chat"}
          </button>
          <div className={`relative mb-4 ${isCollapsed ? 'hidden' : 'block'}`}>
            <div className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}><SearchIcon /></div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats..." className={`w-full p-2.5 pl-9 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium ${theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500' : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400'}`} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {pinned.length > 0 && <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 mt-4 px-2 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>Pinned</div>}
            {pinned.map(chat => <ChatItem key={chat.id} chat={chat} />)}
            {normal.length > 0 && <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 mt-6 px-2 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>Recent</div>}
            {normal.map(chat => <ChatItem key={chat.id} chat={chat} />)}
            {chats.length === 0 && <div className={`text-center text-sm mt-10 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>No chats found.</div>}
          </div>
        </div>
        <div className={`p-4 border-t flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${theme === 'dark' ? 'border-slate-800' : 'border-gray-200 bg-white'}`}>
          {!isCollapsed && <div className="flex items-center gap-3"><img src={user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed="+user?.name} alt="User" className="w-9 h-9 rounded-full border-2 border-blue-500/30 shadow-sm" /><span className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{user?.name}</span></div>}
          <button onClick={onOpenSettings} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`} title="Settings"><SettingsIcon/></button>
        </div>
      </div>
    </>
  );
}