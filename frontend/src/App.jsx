import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";

 // ================= TYPING (FIXED) =================
const TypingText = React.memo(({ text, msgId, animatedMsgs, setAnimatedMsgs }) => {
  const [displayed, setDisplayed] = React.useState("");

React.useEffect(() => {

  // ✅ Already animated OR not ready → show instantly
  if (animatedMsgs[msgId] || !msgId) {
    setDisplayed(text);
    return;
  }

  let i = 0;
  setDisplayed("");

  const interval = setInterval(() => {
    setDisplayed(text.substring(0, i));
    i++;

    if (i > text.length) {
      clearInterval(interval);

      setAnimatedMsgs(prev => ({
        ...prev,
        [msgId]: true
      }));
    }

  }, 8);

  return () => clearInterval(interval);

}, [text, msgId , animatedMsgs, setAnimatedMsgs]);

  return <div className="whitespace-pre-wrap">{displayed}</div>;
});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [animatedMsgs, setAnimatedMsgs] = useState({});
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [expandedMsgs, setExpandedMsgs] = useState({});
  const [mode, setMode] = useState("auto");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [editingChatId, setEditingChatId] = useState(null);
  const [editName, setEditName] = useState("");

  const [search, setSearch] = useState("");
  const chatEndRef = useRef(null);


  // ================= TOGGLE =================
const toggleExpand = (id) => {
  setExpandedMsgs(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};
console.log(setAnimatedMsgs);

useEffect(() => {
  const saved = localStorage.getItem("animatedMsgs");

  if (saved) {
    try {
      setAnimatedMsgs(JSON.parse(saved));
    } catch {
      setAnimatedMsgs({});
    }
  }

  axios.get("http://127.0.0.1:8000/chats")
    .then(res => {
      setChats(res.data || []);
      if (res.data.length > 0) {
        setActiveChat(res.data[0].id);
      }
    })
    .finally(() => {
      setIsReady(true); // ✅ VERY IMPORTANT
    });

}, []);

useEffect(() => {
  localStorage.setItem("animatedMsgs", JSON.stringify(animatedMsgs));
}, [animatedMsgs]);




  // ================= SCROLL =================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const currentChat = useMemo(
    () => chats.find(c => c.id === activeChat),
    [chats, activeChat]
  );

  // ================= FILTER =================
  const filteredChats = chats.filter(chat =>
    (chat.name || `Chat ${chat.id}`)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const pinned = filteredChats.filter(c => c.pinned);
  const normal = filteredChats.filter(c => !c.pinned);

  // ================= CHAT ACTIONS =================
  const createNewChat = async () => {
    const res = await axios.post("http://127.0.0.1:8000/chat");
    setChats(prev => [res.data, ...prev]);
    setActiveChat(res.data.id);
  };

  const deleteChat = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/chat/${id}`);
      setChats(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const togglePin = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:8000/chat/${id}/pin`);
      setChats(prev =>
        prev.map(c =>
          c.id === id ? { ...c, pinned: !c.pinned } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const renameChat = async (id, newName) => {
    if (!newName.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", newName);
      await axios.put(`http://127.0.0.1:8000/chat/${id}/rename`, formData);
      setChats(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
      setEditingChatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const onRenameClick = (e, id, name) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditName(name);
  };

  const onPinClick = (e, id) => {
    e.stopPropagation();
    togglePin(id);
  };

  const onDeleteClick = (e, id) => {
    e.stopPropagation();
    deleteChat(id);
  };

  // ================= IMAGE UPLOAD =================
  const uploadImage = async (file) => {
    if (!file || !activeChat) return;

    const formData = new FormData();
    formData.append("file", file);

    const previewUrl = URL.createObjectURL(file);

    const userMsg = {
      id: Date.now() + Math.random(),
      type: "user",
      text: "[Image Uploaded 📷]",
      imageUrl: previewUrl
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChat
          ? { ...chat, messages: [...(chat.messages || []), userMsg] }
          : chat
      )
    );

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/upload/${activeChat}`,
        formData
      );

      const aiMsg = {
        ...res.data,
        id: Date.now() + Math.random()
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? { ...chat, messages: [...chat.messages, aiMsg] }
            : chat
        )
      );

    } catch (err) {
      console.error(err);
    }
  };

  // ================= SEND =================
const sendTask = async () => {
  if (!input && !file) return;

  const currentInput = input; // store first
  setInput(""); // ✅ clear instantly

  setLoading(true);
    const isFirstMsg = !currentChat?.messages || currentChat.messages.length === 0;

  try {
     if (file && !currentInput.trim()) {
      if (isFirstMsg) renameChat(activeChat, "Image Upload 📷");
    await uploadImage(file);
    setFile(null);
    setFilePreview(null);
    setLoading(false);
    return; // 🚨 STOP here
  }

    if (currentInput.trim()) {
        if (isFirstMsg) {
          const newName = currentInput.trim().slice(0, 25) + (currentInput.trim().length > 25 ? '...' : '');
          renameChat(activeChat, newName);
        }
      const userMsg = {
        id: Date.now() + Math.random(), // ✅ UNIQUE ID
        type: "user",
        text: currentInput
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? { ...chat, messages: [...(chat.messages || []), userMsg] }
            : chat
        )
      );

      const formData = new FormData();
      formData.append("task", currentInput);
      formData.append("mode", mode);

      const res = await axios.post(
        `http://127.0.0.1:8000/chat/${activeChat}`,
        formData
      );

      const aiMsg = {
        ...res.data,
        id: Date.now() + Math.random() // ✅ UNIQUE
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? { ...chat, messages: [...chat.messages, aiMsg] }
            : chat
        )
      );
    }

  } catch (err) {
    console.error(err);
  }

  setLoading(false);
};

  return (
    <>
      {!isReady ? (
        <div className="flex h-screen w-screen bg-slate-900 items-center justify-center text-slate-200">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin text-5xl">⚙️</div>
            <div className="text-xl font-medium animate-pulse text-blue-400">Initializing AI Agents...</div>
          </div>
        </div>
      ) : (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">

          {/* SIDEBAR */}
          <div className="w-72 bg-slate-950 p-4 flex flex-col border-r border-slate-800/60 shadow-2xl z-20 transition-all">

            <button onClick={createNewChat} className="mb-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium p-3 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
              <span className="text-xl leading-none">+</span> New Chat
            </button>

            <div className="relative mb-4">
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="w-full p-2.5 pl-9 bg-slate-900/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all text-slate-200 placeholder-slate-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">

              {pinned.length > 0 && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-2">📌 Pinned</div>}
              {pinned.map(chat => (
                <div key={chat.id} className={`p-3 mb-1.5 flex justify-between items-center cursor-pointer rounded-xl transition-all duration-200 group ${activeChat === chat.id ? 'bg-blue-600/15 border border-blue-500/30 shadow-sm' : 'hover:bg-slate-800/50 border border-transparent'}`}>
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
                    <span className="truncate pr-2 text-sm font-medium" onClick={() => setActiveChat(chat.id)}>{chat.name}</span>
                  )}

                  {editingChatId !== chat.id && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={(e) => onRenameClick(e, chat.id, chat.name)} className="hover:text-green-400 transition-colors text-xs text-slate-400" title="Rename">✏️</button>
                    <button onClick={(e) => onPinClick(e, chat.id)} className="hover:text-blue-400 transition-colors text-xs text-slate-400" title="Unpin">📌</button>
                    <button onClick={(e) => onDeleteClick(e, chat.id)} className="hover:text-red-400 transition-colors text-xs text-slate-400" title="Delete">🗑️</button>
                  </div>
                  )}
                </div>
              ))}

              {normal.length > 0 && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-2">💬 Recent</div>}
              {normal.map(chat => (
                <div key={chat.id} className={`p-3 mb-1.5 flex justify-between items-center cursor-pointer rounded-xl transition-all duration-200 group ${activeChat === chat.id ? 'bg-blue-600/15 border border-blue-500/30 shadow-sm' : 'hover:bg-slate-800/50 border border-transparent'}`}>
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
                    <span className="truncate pr-2 text-sm font-medium" onClick={() => setActiveChat(chat.id)}>{chat.name}</span>
                  )}

                  {editingChatId !== chat.id && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={(e) => onRenameClick(e, chat.id, chat.name)} className="hover:text-green-400 transition-colors text-xs text-slate-400" title="Rename">✏️</button>
                    <button onClick={(e) => onPinClick(e, chat.id)} className="hover:text-blue-400 transition-colors text-xs text-slate-400" title="Pin">📌</button>
                    <button onClick={(e) => onDeleteClick(e, chat.id)} className="hover:text-red-400 transition-colors text-xs text-slate-400" title="Delete">🗑️</button>
                  </div>
                  )}
                </div>
              ))}

            </div>
          </div>

          {/* MAIN */}
          <div className="flex flex-col flex-1 relative bg-slate-900">

            {/* HEADER */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl drop-shadow-md">🤖</span>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-wide">Multi-Agent AI</span>
              </div>

              <select value={mode} onChange={(e) => setMode(e.target.value)} className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer shadow-sm hover:bg-slate-700 transition-colors">
                <option value="auto">✨ Auto Mode</option>
                <option value="detailed">📚 Detailed Mode</option>
                <option value="summary">⚡ Summary Mode</option>
              </select>
            </div>

            {/* CHAT */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">

              {currentChat?.messages?.map((msg) => {
                return (
                  <div key={msg.id}>

                    {msg.type === "user" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-[85%] text-sm md:text-base leading-relaxed">
                          {msg.imageUrl && (
                            <div className="mb-2">
                              <img src={msg.imageUrl} alt="Uploaded" className="max-w-[200px] sm:max-w-[250px] rounded-lg shadow-sm border border-blue-400/30 object-cover" />
                            </div>
                          )}
                          {msg.text}
                        </div>
                      </motion.div>
                    )}

                    {msg.type === "ai" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="bg-slate-800/80 border border-slate-700/50 p-5 rounded-2xl rounded-tl-sm max-w-[95%] md:max-w-[85%] space-y-4 shadow-xl text-sm md:text-base leading-relaxed backdrop-blur-sm">

                          {/* RESPONSE */}
                          {isReady && msg.response && (
                            <div className="text-slate-200">
                              <TypingText text={msg.response} msgId={msg.id} animatedMsgs={animatedMsgs} setAnimatedMsgs={setAnimatedMsgs} />
                            </div>
                          )}

                          {/* RESEARCH */}
                          {msg.research && msg.research.length > 0 && (
                            <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-xl mt-4 shadow-inner">

                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span>🔍</span> Research Process
                              </h3>

                              <div className="space-y-3">
                                {(expandedMsgs[msg.id] ? msg.full_research : msg.research)?.map((r, idx) => (
                                  <div key={idx} className="text-sm">
                                    <div className="font-semibold text-slate-300 flex items-start gap-2">
                                      <span className="text-blue-500 mt-0.5">•</span>
                                      <span>{r.step}</span>
                                    </div>

                                    {expandedMsgs[msg.id] && (
                                      <div className="text-slate-400 mt-1.5 ml-4 pl-3 border-l-2 border-slate-700/50 text-xs leading-relaxed">
                                        {r.research?.slice(0, 250)}...
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {msg.full_research?.length > 2 && (
                                <button onClick={() => toggleExpand(msg.id)} className="mt-3 text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-900/20 px-3 py-1.5 rounded-lg">
                                  {expandedMsgs[msg.id] ? "Show Less ▲" : "Show More ▼"}
                                </button>
                              )}

                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}

                  </div>
                );
              })}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-3 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Agents are processing...</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} className="h-4" />

            </div>

            {/* INPUT */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md">
              <div className="max-w-4xl mx-auto flex flex-col gap-2">

                {file && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="relative w-fit mb-1">
                    <div className="relative rounded-xl overflow-hidden border border-slate-600 shadow-sm bg-slate-800">
                      {filePreview && <img src={filePreview} alt="Preview" className="h-20 md:h-24 w-auto object-cover" />}
                      <button onClick={() => { setFile(null); setFilePreview(null); }} className="absolute top-1 right-1 bg-slate-900/80 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs transition-colors backdrop-blur-sm shadow-md">
                        ✖
                      </button>
                    </div>
                    <div className="text-xs text-blue-300 mt-1.5 truncate max-w-[200px] font-medium flex items-center gap-1">
                      📎 {file.name}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-2 items-end relative bg-slate-800 border border-slate-700 rounded-2xl p-1.5 shadow-lg focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">

                  <label className="cursor-pointer p-3 hover:bg-slate-700 rounded-xl transition-colors text-xl flex-shrink-0 group">
                    <span className="group-hover:scale-110 transition-transform block">📷</span>
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => { 
                        const f = e.target.files[0]; 
                        if (f) {
                          setFile(f); 
                          setFilePreview(URL.createObjectURL(f));
                        }
                        e.target.value = null; 
                      }}
                    />
                  </label>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTask(); } }}
                    className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:outline-none focus:ring-0 py-3 px-1 text-slate-100 placeholder-slate-500 resize-none self-center text-sm md:text-base"
                    placeholder="Message Multi-Agent AI..."
                    rows={1}
                  />

                  <button onClick={sendTask} disabled={!input.trim() && !file} className={`p-3 rounded-xl flex-shrink-0 transition-all shadow-md flex items-center justify-center h-11 w-11 mb-0.5 mr-0.5 ${(!input.trim() && !file) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95'}`}>
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

          </div>
        </div>
      )}
    </>
  );
}