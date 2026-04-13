import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function App() {
  const [file, setFile] = useState(null);
  const [expandedMsgs, setExpandedMsgs] = useState({});
  const [mode, setMode] = useState("auto"); // 🔥 new

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [search, setSearch] = useState("");
  const chatEndRef = useRef(null);

  const toggleExpand = (index) => {
    setExpandedMsgs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  //upload file when selected
  const uploadImage = async () => {
  if (!file || !activeChat) return;

  const formData = new FormData();
  formData.append("file", file);

  setLoading(true);

  try {
    const res = await axios.post(
      `http://127.0.0.1:8000/upload-image/${activeChat}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    const { extracted_text, ai } = res.data;

    // show extracted text as user msg
    const userMsg = {
      type: "user",
      text: extracted_text || "[Image]"
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: [...chat.messages, userMsg, ai]
            }
          : chat
      )
    );

  } catch (err) {
    console.error(err);
  }

  setFile(null);
  setLoading(false);
};

  // LOAD CHATS
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/chats")
      .then(res => {
        setChats(res.data || []);
        if (res.data.length > 0) {
          setActiveChat(res.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const currentChat = chats.find(c => c.id === activeChat);

  // FILTER
  const filteredChats = chats.filter(chat =>
    (chat.name || `Chat ${chat.id}`)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // CREATE CHAT
  const createNewChat = async () => {
    const res = await axios.post("http://127.0.0.1:8000/chat");
    setChats(prev => [res.data, ...prev]);
    setActiveChat(res.data.id);
  };

  // DELETE CHAT
  const deleteChat = async (id) => {
    await axios.delete(`http://127.0.0.1:8000/chat/${id}`);
    setChats(prev => prev.filter(c => c.id !== id));
  };

  // PIN CHAT
  const togglePin = async (id) => {
    await axios.put(`http://127.0.0.1:8000/chat/${id}/pin`);
    setChats(prev =>
      prev.map(c =>
        c.id === id ? { ...c, pinned: !c.pinned } : c
      )
    );
  };

  // 🚀 SEND MESSAGE
  const sendTask = async () => {
    if (!input || !activeChat) return;

    const userMsg = {
      type: "user",
      text: input
    };

    setLoading(true);

    // add user message
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: [...(chat.messages || []), userMsg]
            }
          : chat
      )
    );

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/chat/${activeChat}`,
        {
          task: input,
          mode: mode   // 🔥 important
        }
      );

      const aiMsg = res.data;

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: [...(chat.messages || []), aiMsg]
              }
            : chat
        )
      );

    } catch (err) {
      console.error(err);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#020617] border-r border-gray-800 p-4 flex flex-col">

        <button
          onClick={createNewChat}
          className="mb-3 bg-blue-600 p-2 rounded-xl hover:bg-blue-700"
        >
          + New Chat
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="mb-3 p-2 bg-gray-800 rounded-xl"
        />

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className="p-2 rounded-lg hover:bg-gray-800 cursor-pointer flex justify-between"
            >
              <span className="text-sm truncate">
                {chat.name || `Chat ${chat.id}`}
              </span>

              <div className="flex gap-2">
                <button onClick={(e) => {
                  e.stopPropagation();
                  togglePin(chat.id);
                }}>📌</button>

                <button onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 flex justify-between">
          <span>🤖 Multi-Agent AI</span>

          {/* 🔥 MODE SELECT */}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-gray-800 px-3 py-1 rounded-lg text-sm"
          >
            <option value="auto">Auto</option>
            <option value="detailed">Detailed</option>
            <option value="summary">Summary</option>
          </select>
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {currentChat?.messages?.map((msg, i) => (
            <div key={i}>

              {/* USER */}
              {msg.type === "user" && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 px-4 py-2 rounded-xl max-w-lg">
                    {msg.text}
                  </div>
                </div>
              )}

              {/* AI */}
              {msg.type === "ai" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#1e293b] p-4 rounded-2xl max-w-4xl space-y-3 shadow-lg">

                    {/* RESPONSE */}
                    {msg.response && (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.response}
                      </div>
                    )}

                    {/* 🔥 RESEARCH */}
                    {msg.research && (
                      <div className="bg-[#020617] p-3 rounded-xl mt-2">

                        <h3 className="text-xs text-gray-400 mb-2">
                          🔍 Research
                        </h3>

                        {(expandedMsgs[i] ? msg.full_research : msg.research)?.map((r, idx) => (
                          <div key={idx} className="text-xs mb-2">
                            <div className="font-semibold text-gray-300">
                              • {r.step}
                            </div>

                            {expandedMsgs[i] && (
                              <div className="text-gray-400">
                                {r.research?.slice(0, 250)}...
                              </div>
                            )}
                          </div>
                        ))}

                        {msg.full_research?.length > 2 && (
                          <button
                            onClick={() => toggleExpand(i)}
                            className="text-blue-400 text-xs hover:underline"
                          >
                            {expandedMsgs[i] ? "Show Less ▲" : "Show More ▼"}
                          </button>
                        )}

                      </div>
                    )}

                  </div>
                </motion.div>
              )}

            </div>
          ))}

          {loading && (
            <p className="text-gray-400 animate-pulse">
              🤖 Thinking...
            </p>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <div className="p-4 border-t border-gray-800 flex gap-2">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendTask()}
            className="flex-1 p-2 bg-gray-900 rounded"
            placeholder="Ask anything..."
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button onClick={sendTask} className="bg-blue-600 px-4 rounded">
            Send
          </button>

          <button onClick={uploadImage} className="bg-green-600 px-4 rounded">
            Upload
          </button>

        </div>
      </div>
    </div>
  );
}