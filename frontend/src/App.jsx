import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";

 // ================= TYPING (FIXED) =================
  const TypingText = React.memo(({ text, isNew }) => {
    const [displayed, setDisplayed] = useState("");

    useEffect(() => {

      if (!isNew) {
        setDisplayed(text);
        return;
      }

      let i = 0;
      setDisplayed("");

      const interval = setInterval(() => {
        setDisplayed(text.substring(0, i));
        i++;

        if (i > text.length) clearInterval(interval);
      }, 8);

      return () => clearInterval(interval);

    }, [text, isNew]);

    return <div className="whitespace-pre-wrap">{displayed}</div>;
  });

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState(null);
  const [expandedMsgs, setExpandedMsgs] = useState({});
  const [mode, setMode] = useState("auto");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [search, setSearch] = useState("");
  const chatEndRef = useRef(null);


  // ================= TOGGLE =================
const toggleExpand = (id) => {
  setExpandedMsgs(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};

  // ================= LOAD =================
  useEffect(() => {
  axios.get("http://127.0.0.1:8000/chats")
    .then(res => {
      setChats(res.data || []);
      if (res.data.length > 0) {
        setActiveChat(res.data[0].id);
      }

      setLoaded(true); // 🔥 IMPORTANT
    })
    .catch(console.error);
}, []);

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

  // ================= IMAGE UPLOAD =================
  const uploadImage = async (file) => {
    if (!file || !activeChat) return;

    const formData = new FormData();
    formData.append("file", file);

    const userMsg = {
      id: Date.now(),
      type: "user",
      text: "[Image Uploaded 📷]"
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

  try {
     if (file && !currentInput.trim()) {
    await uploadImage(file);
    setFile(null);
    setLoading(false);
    return; // 🚨 STOP here
  }

    if (currentInput.trim()) {
      const userMsg = {
        id: Date.now(), // ✅ UNIQUE ID
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
    <div className="flex h-screen bg-[#0f172a] text-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#020617] p-4 flex flex-col border-r border-gray-800">

        <button onClick={createNewChat} className="mb-3 bg-blue-600 p-2 rounded-xl">
          + New Chat
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="mb-3 p-2 bg-gray-800 rounded-xl"
        />

        <div className="flex-1 overflow-y-auto space-y-2">

          {pinned.length > 0 && <div className="text-xs text-gray-400">📌 Pinned</div>}
          {pinned.map(chat => (
            <div key={chat.id} className="p-2 hover:bg-gray-800 flex justify-between cursor-pointer rounded">
              <span onClick={() => setActiveChat(chat.id)}>{chat.name}</span>

              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }}>📌</button>
                <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>🗑️</button>
              </div>
            </div>
          ))}

          {normal.length > 0 && <div className="text-xs text-gray-400 mt-4">💬 Recent</div>}
          {normal.map(chat => (
            <div key={chat.id} className="p-2 hover:bg-gray-800 flex justify-between cursor-pointer rounded">
              <span onClick={() => setActiveChat(chat.id)}>{chat.name}</span>

              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }}>📌</button>
                <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>🗑️</button>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        <div className="p-4 border-b border-gray-800 flex justify-between">
          <span>🤖 Multi-Agent AI</span>

          <select value={mode} onChange={(e) => setMode(e.target.value)} className="bg-gray-800 px-3 py-1 rounded">
            <option value="auto">Auto</option>
            <option value="detailed">Detailed</option>
            <option value="summary">Summary</option>
          </select>
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {currentChat?.messages?.map((msg, i) => {
               const isLast = i === currentChat.messages.length - 1;
               const isNew = isLast && loaded;

            return (
              <div key={msg.id}>

                {msg.type === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 px-4 py-2 rounded-xl">{msg.text}</div>
                  </div>
                )}

                {/* {msg.type === "ai" && (
                  <motion.div className="flex justify-start">
                    <div className="bg-[#1e293b] p-4 rounded-xl max-w-4xl">

                      {msg.response && (
                        isLast
                          ? <TypingText text={msg.response} />
                          : <div className="whitespace-pre-wrap">{msg.response}</div>
                      )}

                    </div>
                  </motion.div>
                )} */}
                {msg.type === "ai" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[#1e293b] p-4 rounded-2xl max-w-4xl space-y-3 shadow-lg">

                      {/* RESPONSE */}
                      {msg.response && (
                        isLast ? (
                         <TypingText text={msg.response} isNew={isNew} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.response}</div>
                        )
                      )}

                      {/* 🔥 RESEARCH BLOCK */}
                      {msg.research && msg.research.length > 0 && (
                        <div className="bg-[#020617] p-3 rounded-xl mt-2">

                          <h3 className="text-xs text-gray-400 mb-2">
                            🔍 Research
                          </h3>

                          {(expandedMsgs[msg.id] ? msg.full_research : msg.research)?.map((r, idx) => (
                            <div key={idx} className="text-xs mb-2">

                              <div className="font-semibold text-gray-300">
                                • {r.step}
                              </div>

                              {expandedMsgs[msg.id] && (
                                <div className="text-gray-400">
                                  {r.research?.slice(0, 250)}...
                                </div>
                              )}

                            </div>
                          ))}

                          {/* SHOW MORE BUTTON */}
                          {msg.full_research?.length > 2 && (
                            <button
                              onClick={() => toggleExpand(msg.id)}
                              className="text-blue-400 text-xs hover:underline"
                            >
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

          {loading && <div className="text-gray-400">🤖 Thinking...</div>}
          <div ref={chatEndRef} />

        </div>

        {/* INPUT */}
        <div className="p-4 flex flex-col gap-2 border-t border-gray-800">

          {file && (
            <div className="text-xs text-gray-400">
              📎 {file.name}
              <button onClick={() => setFile(null)}> ❌</button>
            </div>
          )}

          <div className="flex gap-2">

            <label className="cursor-pointer">
              📷
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) setFile(f);
                  e.target.value = null;
                }}
              />
            </label>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTask()}
              className="flex-1 p-3 bg-gray-900 rounded"
              placeholder="Ask anything..."
            />

            <button onClick={sendTask} className="bg-blue-600 px-4 rounded">
              ➤
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}