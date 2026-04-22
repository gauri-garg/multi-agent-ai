import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import AgentCityInput from "./AgentCityInput";
import Auth from "./Auth";
import AgentCityHeader from "./AgentCityHeader";
import ChatWindow from "./ChatWindow";
import ShareModal from "./ShareModal";
import Toast from "./Toast";
import SettingsModal from "./SettingsModal";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("agentCityUser")) || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("agentCityToken") || null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  
  const [isReady, setIsReady] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const abortControllerRef = useRef(null);
  const [isStopping, setIsStopping] = useState(false);

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
  
  const showToast = (msg) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("agentCityToken");
    localStorage.removeItem("agentCityUser");
    setToken(null); setUser(null); setChats([]); setActiveChat(null); setIsSettingsModalOpen(false);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("aiPrefs");
    if (saved) {
      try {
        const p = JSON.parse(saved) || {};
        if (p.rememberPrefs) {
          setAiLength(p.aiLength || "Auto"); setAiFormat(p.aiFormat || "Auto"); setAiTone(p.aiTone || "Auto"); setAiLanguage(p.aiLanguage || "Auto"); setRememberPrefs(true);
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (rememberPrefs) localStorage.setItem("aiPrefs", JSON.stringify({ aiLength, aiFormat, aiTone, aiLanguage, rememberPrefs }));
    else localStorage.removeItem("aiPrefs");
  }, [aiLength, aiFormat, aiTone, aiLanguage, rememberPrefs]);

  useEffect(() => {
    if (user && token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.get("http://127.0.0.1:8000/chats").then(res => { setChats(res.data || []); if (res.data.length > 0) setActiveChat(res.data[0].id); }).catch(err => { console.error(err); if (err.response?.status === 401) { handleLogout(); } }).finally(() => setIsReady(true));
    }
  }, [user, token, handleLogout]);

  const currentChat = useMemo(() => chats.find(c => c.id === activeChat), [chats, activeChat]);

  const createNewChat = async () => {
    const res = await axios.post("http://127.0.0.1:8000/chat");
    setChats(prev => [res.data, ...prev]);
    setActiveChat(res.data.id);
  };
  const deleteChat = async (id) => { try { await axios.delete(`http://127.0.0.1:8000/chat/${id}`); setChats(prev => prev.filter(c => c.id !== id)); } catch (e) { console.error(e); } };
  const togglePin = async (id) => { try { await axios.put(`http://127.0.0.1:8000/chat/${id}/pin`); setChats(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c)); } catch (e) { console.error(e); } };
  const renameChat = async (id, newName) => {
    if (!newName.trim()) { setEditingChatId(null); return; }
    try {
      const formData = new FormData();
      formData.append("name", newName);
      await axios.put(`http://127.0.0.1:8000/chat/${id}/rename`, formData);
      setChats(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
      setEditingChatId(null);
    } catch (e) { console.error(e); }
  };

const sendTask = async (forcedInput = null) => {
  const currentInput = forcedInput !== null ? forcedInput : input;
  if (!currentInput.trim() && !file) return;
  if (forcedInput === null) setInput(""); 
  setLoading(true);
  abortControllerRef.current = new AbortController();
  const signal = abortControllerRef.current.signal;
  let targetChatId = activeChat;
  if (!targetChatId) {
    try {
      const res = await axios.post("http://127.0.0.1:8000/chat");
      setChats(prev => [res.data, ...prev]);
      setActiveChat(res.data.id);
      targetChatId = res.data.id;
    } catch (err) {
      console.error("Failed to create chat", err); setLoading(false); return;
    }
  }

  const targetChatObj = chats.find(c => c.id === targetChatId) || { messages: [] };
  const isFirstMsg = !targetChatObj.messages || targetChatObj.messages.length === 0;
  const aiMsgId = Date.now() + Math.random();

  try {
      let displayInput = currentInput.trim();
      const previewUrl = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      if (file) {
        displayInput = `[File Uploaded: ${file.name} 📎]\n${displayInput}`.trim();
      }

      if (isFirstMsg) {
        const titleSource = currentInput.trim() || (file ? `Upload: ${file.name}` : "New Chat");
        const newName = titleSource.slice(0, 25) + (titleSource.length > 25 ? '...' : '');
        renameChat(targetChatId, newName);
      }

      const userMsg = {
        id: Date.now() + Math.random(), type: "user", text: displayInput, imageUrl: previewUrl, isNew: true
      };
      setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: [...(chat.messages || []), userMsg] } : chat));

      const formData = new FormData();
      formData.append("task", currentInput.trim()); 
      if (file) formData.append("file", file, file.name);
      formData.append("ai_length", aiLength); formData.append("ai_format", aiFormat); formData.append("ai_tone", aiTone); formData.append("ai_language", aiLanguage);
      
      setFile(null); setFilePreview(null);

      const res = await fetch(`http://127.0.0.1:8000/chat/${targetChatId}`, { method: "POST", body: formData, headers: { "Authorization": `Bearer ${token}` }, signal });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.detail || errData.error || "Failed to process request");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiMsgData = { id: aiMsgId, type: "ai", response: "", isStreaming: true, isStopped: false, isCompleted: false, plan: [], research: [], full_research: [], isNew: true };
      setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: [...chat.messages, aiMsgData] } : chat));

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "chunk") { aiMsgData.response += data.text; setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, response: aiMsgData.response } : m) } : chat)); }
            else if (data.type === "done") { setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, ...data.full, isStreaming: false, isCompleted: true } : m) } : chat)); }
          } catch { /* ignore partial chunks */ }
        }
      }
  } catch (err) { 
    if (err.name === "AbortError") {
      console.log("Generation stopped by user");
      setChats(prev => prev.map(chat => chat.id === targetChatId ? { ...chat, messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, isStreaming: false, isStopped: true, isCompleted: false } : m) } : chat));
    } else {
      console.error(err); 
      showToast("Network error or connection lost");
    }
  } finally {
    setLoading(false);
    setIsStopping(false);
  }
};

  const handleRegenerate = (aiMsg) => {
    const chat = chats.find(c => c.id === activeChat);
    const idx = chat.messages.findIndex(m => m.id === aiMsg.id);
    let userText = "";
    for (let i = idx - 1; i >= 0; i--) { if (chat.messages[i].type === 'user') { userText = chat.messages[i].text; break; } }
    if (userText) { sendTask(userText); showToast("Regenerating response..."); } 
    else { showToast("Could not find previous prompt."); }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      setIsStopping(true);
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete("http://127.0.0.1:8000/auth/delete-account");
      handleLogout();
      showToast("Account deleted successfully.");
    } catch (e) {
      console.error(e); showToast("Failed to delete account.");
    }
  };

  const handleLoginSuccess = (userData, accessToken) => {
    localStorage.setItem("agentCityToken", accessToken);
    localStorage.setItem("agentCityUser", JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} theme={theme} />;
  }

  return (
    <>
      <Toast toasts={toasts} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} theme={theme} showToast={showToast} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} theme={theme} />
      
      {!isReady ? (
        <div className={`flex h-[100dvh] w-screen items-center justify-center fixed inset-0 ${theme === 'dark' ? 'bg-slate-900 text-slate-200' : 'bg-gray-50 text-gray-900'}`}>
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin text-5xl">⚙️</div>
            <div className="text-xl font-medium animate-pulse text-blue-400">Initializing AI Agents...</div>
          </div>
        </div>
      ) : (
        <div className={`flex h-[100dvh] w-full font-sans selection:bg-blue-500/30 overflow-hidden fixed inset-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
          <Sidebar 
            chats={chats} activeChat={activeChat} setActiveChat={setActiveChat} user={user}
            search={search} setSearch={setSearch} createNewChat={createNewChat}
            deleteChat={deleteChat} togglePin={togglePin} renameChat={renameChat}
            editingChatId={editingChatId} setEditingChatId={setEditingChatId}
            editName={editName} setEditName={setEditName} theme={theme}
            isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isCollapsed={isSidebarCollapsed}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
          <div className="flex flex-col flex-1 relative min-w-0">
            <AgentCityHeader toggleSidebar={() => { setIsSidebarOpen(!isSidebarOpen); setIsSidebarCollapsed(!isSidebarCollapsed); }} theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onShare={() => setIsShareModalOpen(true)} currentChat={currentChat} isSidebarCollapsed={isSidebarCollapsed} />
            <ChatWindow currentChat={currentChat} isReady={isReady} loading={loading} theme={theme} showToast={showToast} onRegenerate={handleRegenerate} />
            <AgentCityInput 
              input={input} setInput={setInput} sendTask={sendTask} 
              stopGeneration={stopGeneration} isStopping={isStopping}
              file={file} setFile={setFile} 
              filePreview={filePreview} setFilePreview={setFilePreview} 
              loading={loading} theme={theme}
              aiLength={aiLength} setAiLength={setAiLength} aiFormat={aiFormat} setAiFormat={setAiFormat}
              aiTone={aiTone} setAiTone={setAiTone} aiLanguage={aiLanguage} setAiLanguage={setAiLanguage}
              rememberPrefs={rememberPrefs} setRememberPrefs={setRememberPrefs} 
            />
          </div>
        </div>
      )}
    </>
  );
}