import React from "react";

export default function Sidebar({ chats, activeChat, setActiveChat, search, setSearch, createNewChat, deleteChat, togglePin, renameChat, editingChatId, setEditingChatId, editName, setEditName, isOpen, setIsOpen }) {
  
  const filteredChats = chats.filter(chat => (chat.name || `Chat ${chat.id}`).toLowerCase().includes(search.toLowerCase()));
  const pinned = filteredChats.filter(c => c.pinned);
  const normal = filteredChats.filter(c => !c.pinned);

  const ChatItem = ({ chat }) => (
    <div onClick={() => { setActiveChat(chat.id); setIsOpen(false); }} className={`p-3 mb-1.5 flex justify-between items-center cursor-pointer rounded-xl transition-all duration-200 group ${activeChat === chat.id ? 'bg-blue-600/15 border border-blue-500/30 shadow-sm' : 'hover:bg-slate-800/50 border border-transparent'}`}>
      {editingChatId === chat.id ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => renameChat(chat.id, editName)}
          onKeyDown={(e) => e.key === 'Enter' && renameChat(chat.id, editName)}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium bg-slate-800 text-slate-100 px-2 py-1 rounded w-full border border-blue-500 focus:outline-none"
        />
      ) : (
        <div className="flex items-center gap-3 truncate">
          <svg className={`w-4 h-4 flex-shrink-0 ${activeChat === chat.id ? "text-blue-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <span className="truncate pr-2 text-sm font-medium text-slate-300">{chat.name}</span>
        </div>
      )}

      {editingChatId !== chat.id && (
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setEditingChatId(chat.id); setEditName(chat.name); }} className="hover:text-green-400 text-xs text-slate-400" title="Rename">✏️</button>
          <button onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }} className="hover:text-blue-400 text-xs text-slate-400" title={chat.pinned ? "Unpin" : "Pin"}>📌</button>
          <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="hover:text-red-400 text-xs text-slate-400" title="Delete">🗑️</button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}
      
      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 p-4 flex flex-col border-r border-slate-800/80 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
        
        <div className="flex justify-between items-center mb-5 md:hidden">
          <span className="font-bold text-lg tracking-wide text-slate-200">Menu</span>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <button onClick={createNewChat} className="mb-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium p-3 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
          <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Chat
        </button>

        <div className="relative mb-4">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full p-2.5 pl-9 bg-slate-900/80 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all text-slate-200 placeholder-slate-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {pinned.length > 0 && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-2">Pinned</div>}
          {pinned.map(chat => <ChatItem key={chat.id} chat={chat} />)}

          {normal.length > 0 && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-2">Recent</div>}
          {normal.map(chat => <ChatItem key={chat.id} chat={chat} />)}
          
          {chats.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">No chats found.</div>}
        </div>
      </div>
    </>
  );
}