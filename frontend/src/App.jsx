import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // AI Controls
  const [aiLength, setAiLength] = useState("Auto");
  const [aiFormat, setAiFormat] = useState("Auto");
  const [aiTone, setAiTone] = useState("Auto");
  const [aiLanguage, setAiLanguage] = useState("Auto");
  const [rememberPrefs, setRememberPrefs] = useState(false);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [editingChatId, setEditingChatId] = useState(null);
  const [editName, setEditName] = useState("");

  const [search, setSearch] = useState("");
  const chatEndRef = useRef(null);

  // Load AI Preferences
  useEffect(() => {
    const saved = localStorage.getItem("aiPrefs");
    if (saved) {
      try {
        const p = JSON.parse(saved) || {};
        if (p.rememberPrefs) {
          setAiLength(p.aiLength || "Auto");
          setAiFormat(p.aiFormat || "Auto");
          setAiTone(p.aiTone || "Auto");
          setAiLanguage(p.aiLanguage || "Auto");
          setRememberPrefs(true);
        }
      } catch (err) {
        console.error("Failed to parse saved AI preferences:", err);
      }
    }
  }, [setAiLength, setAiFormat, setAiTone, setAiLanguage, setRememberPrefs]);

  // Save AI Preferences
  useEffect(() => {
    if (rememberPrefs) {
      localStorage.setItem("aiPrefs", JSON.stringify({ aiLength, aiFormat, aiTone, aiLanguage, rememberPrefs }));
    } else {
      localStorage.removeItem("aiPrefs");
    }
  }, [aiLength, aiFormat, aiTone, aiLanguage, rememberPrefs]);

useEffect(() => {
  axios.get("http://127.0.0.1:8000/chats")
    .then(res => {
      setChats(res.data || []);
      if (res.data.length > 0) {
        setActiveChat(res.data[0].id);
      }
    })
    .catch(err => {
      console.error("Backend connection failed:", err);
    })
    .finally(() => {
      setIsReady(true); // ✅ VERY IMPORTANT
    });

}, []);


  // ================= SCROLL =================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const currentChat = useMemo(
    () => chats.find(c => c.id === activeChat),
    [chats, activeChat]
  );

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

  // ================= FILE UPLOAD =================
  const uploadFile = async (file, targetChatId = activeChat) => {
    if (!file || !targetChatId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("ai_length", aiLength);
    formData.append("ai_format", aiFormat);
    formData.append("ai_tone", aiTone);
    formData.append("ai_language", aiLanguage);

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

    const userMsg = {
      id: Date.now() + Math.random(),
      type: "user",
      text: `[File Uploaded: ${file.name} 📎]`,
      imageUrl: previewUrl
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === targetChatId
          ? { ...chat, messages: [...(chat.messages || []), userMsg] }
          : chat
      )
    );

    console.log("Sending AI Payload (Upload):", {
      file: file.name,
      ai_length: aiLength,
      ai_format: aiFormat,
      ai_tone: aiTone,
      ai_language: aiLanguage
    });

    try {
      const res = await fetch(`http://127.0.0.1:8000/upload/${targetChatId}`, {
        method: "POST",
        body: formData
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const aiMsgId = Date.now() + Math.random();
      let aiMsgData = { id: aiMsgId, type: "ai", response: "", isStreaming: true, plan: [], research: [], full_research: [] };

      setChats(prev =>
        prev.map(chat =>
          chat.id === targetChatId
            ? { ...chat, messages: [...chat.messages, aiMsgData] }
            : chat
        )
      );

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        setLoading(false); // Stop loading immediately when first stream chunk arrives

        buffer += decoder.decode(value, { stream: true });
        
        // ROBUST STREAM FIX: Guaranteed no dropped tokens
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete chunk in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);
            if (data.type === "chunk") {
              aiMsgData.response += data.text;
              setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, response: aiMsgData.response } : m) } : chat));
            } else if (data.type === "done") {
              setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, ...data.full, isStreaming: false } : m) } : chat));
            }
          } catch (e) {
            console.debug("Partial chunk parse ignored:", e);
          }
        }
      }

    } catch (err) {
      console.error(err);
    }
  };

  // ================= SEND =================
const sendTask = async () => {
  if (!input && !file) return;

  const currentInput = input; // store first
  setInput(""); 

  setLoading(true);

  let targetChatId = activeChat;
  if (!targetChatId) {
    try {
      const res = await axios.post("http://127.0.0.1:8000/chat");
      setChats(prev => [res.data, ...prev]);
      setActiveChat(res.data.id);
      targetChatId = res.data.id;
    } catch (err) {
      console.error("Failed to create chat", err);
      setLoading(false);
      return;
    }
  }

  const targetChatObj = chats.find(c => c.id === targetChatId) || { messages: [] };
  const isFirstMsg = !targetChatObj.messages || targetChatObj.messages.length === 0;

  try {
     if (file && !currentInput.trim()) {
      if (isFirstMsg) renameChat(targetChatId, `Upload: ${file.name}`);
    await uploadFile(file, targetChatId);
    setFile(null);
    setFilePreview(null);
    setLoading(false);
    return; // 🚨 STOP here
  }

    if (currentInput.trim()) {
        if (isFirstMsg) {
          const newName = currentInput.trim().slice(0, 25) + (currentInput.trim().length > 25 ? '...' : '');
          renameChat(targetChatId, newName);
        }
      const userMsg = {
        id: Date.now() + Math.random(), // ✅ UNIQUE ID
        type: "user",
        text: currentInput
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === targetChatId
            ? { ...chat, messages: [...(chat.messages || []), userMsg] }
            : chat
        )
      );

      const formData = new FormData();
      formData.append("task", currentInput);
      formData.append("ai_length", aiLength);
      formData.append("ai_format", aiFormat);
      formData.append("ai_tone", aiTone);
      formData.append("ai_language", aiLanguage);

      console.log("Sending AI Payload (Chat):", {
        task: currentInput,
        ai_length: aiLength,
        ai_format: aiFormat,
        ai_tone: aiTone,
        ai_language: aiLanguage
      });

      const res = await fetch(`http://127.0.0.1:8000/chat/${targetChatId}`, {
        method: "POST",
        body: formData
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const aiMsgId = Date.now() + Math.random();
      let aiMsgData = { id: aiMsgId, type: "ai", response: "", isStreaming: true, plan: [], research: [], full_research: [] };

      setChats(prev =>
        prev.map(chat =>
          chat.id === targetChatId
            ? { ...chat, messages: [...chat.messages, aiMsgData] }
            : chat
        )
      );

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        setLoading(false); // Stop loading immediately when first stream chunk arrives
        
        buffer += decoder.decode(value, { stream: true });
        
        // ROBUST STREAM FIX
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);
            if (data.type === "chunk") {
              aiMsgData.response += data.text;
              setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, response: aiMsgData.response } : m) } : chat));
            } else if (data.type === "done") {
              setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, ...data.full, isStreaming: false } : m) } : chat));
            }
          } catch (e) {
            console.debug("Partial chunk parse ignored:", e);
          }
        }
      }
    }

  } catch (err) {
    console.error(err);
  }

  setLoading(false);
};

  return (
    <>
      {!isReady ? (
        <div className="flex h-[100dvh] w-screen bg-slate-900 items-center justify-center text-slate-200 fixed inset-0">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin text-5xl">⚙️</div>
            <div className="text-xl font-medium animate-pulse text-blue-400">Initializing AI Agents...</div>
          </div>
        </div>
      ) : (
        <div className="flex h-[100dvh] w-full bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden fixed inset-0">

          {/* SIDEBAR */}
          <Sidebar 
            chats={chats} activeChat={activeChat} setActiveChat={setActiveChat}
            search={search} setSearch={setSearch} createNewChat={createNewChat}
            deleteChat={deleteChat} togglePin={togglePin} renameChat={renameChat}
            editingChatId={editingChatId} setEditingChatId={setEditingChatId}
            editName={editName} setEditName={setEditName}
            isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          />

          {/* MAIN */}
          <div className="flex flex-col flex-1 relative min-w-0">

            {/* HEADER */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-2 text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <span className="text-2xl drop-shadow-md">🤖</span>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-wide truncate">Multi-Agent AI</span>
              </div>
            </div>

            {/* CHAT */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {currentChat?.messages?.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-60">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner"><span className="text-3xl">🤖</span></div>
                  <p>How can I help you today?</p>
                </div>
              )}
              {currentChat?.messages?.map(msg => <MessageBubble key={msg.id} msg={msg} isReady={isReady} />)}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-3 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Analyzing...</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* INPUT */}
            <InputBar 
              input={input} setInput={setInput} sendTask={sendTask} 
              file={file} setFile={setFile} 
              filePreview={filePreview} setFilePreview={setFilePreview} 
              loading={loading}
              aiLength={aiLength} setAiLength={setAiLength}
              aiFormat={aiFormat} setAiFormat={setAiFormat}
              aiTone={aiTone} setAiTone={setAiTone}
              aiLanguage={aiLanguage} setAiLanguage={setAiLanguage}
              rememberPrefs={rememberPrefs} setRememberPrefs={setRememberPrefs}
            />
          </div>
        </div>
      )}
    </>
  );
}