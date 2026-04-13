import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function App() {
  const [expandedMsgs, setExpandedMsgs] = useState({});
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

  // 🚀 SEND MESSAGE (FIXED)
  const sendTask = async () => {
  if (!input || !activeChat) return;

  const userMsg = {
    type: "user",
    text: input
  };

  setLoading(true);

  // ✅ 1. ADD USER MESSAGE FIRST
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
    // ✅ 2. CALL BACKEND
    const res = await axios.post(
      `http://127.0.0.1:8000/chat/${activeChat}`,
      { task: input }
    );

    const aiMsg = res.data;

    // ✅ 3. ADD AI RESPONSE
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
      <div className="w-64 bg-black p-4 flex flex-col">

        <button
          onClick={createNewChat}
          className="mb-3 bg-blue-600 p-2 rounded"
        >
          + New Chat
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="mb-3 p-2 bg-gray-800 rounded"
        />

        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className="p-2 hover:bg-gray-800 cursor-pointer flex justify-between"
            >
              <span>{chat.name || `Chat ${chat.id}`}</span>

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

        <div className="p-4 border-b border-gray-800">
          🤖 Multi-Agent AI
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {currentChat?.messages?.map((msg, i) => (
            <div key={i}>

              {/* USER */}
              {msg.type === "user" && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 px-4 py-2 rounded">
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
                  <div className="bg-gray-800 p-4 rounded-xl max-w-4xl max-h-[500px] overflow-y-auto">

                    {/* MAIN RESPONSE */}
                    {msg.response && (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.response}
                      </div>
                    )}

                    {/* 🔥 RESEARCH SECTION */}
                  {(msg.research || msg.full_research) && (
                    <div className="bg-gray-900 p-3 rounded-lg mt-3 space-y-2">

                      <h3 className="text-xs text-gray-400">🔍 Research</h3>

                      {(expandedMsgs[i] ? msg.full_research : msg.research)?.map((r, idx) => (
                        <div key={idx} className="text-xs text-gray-300">

                          {/* STEP TITLE */}
                          <div className="font-semibold">
                            • {r.step}
                          </div>

                          {/* 🔥 SHOW DETAILS ONLY WHEN EXPANDED */}
                          {expandedMsgs[i] && (
                            <div className="text-gray-400 mt-1">
                              {r.research?.slice(0, 250)}...
                            </div>
                          )}

                        </div>
                      ))}

                      {/* BUTTON */}
                      {msg.full_research?.length > 3 && (
                        <button
                          onClick={() => toggleExpand(i)}
                          className="text-blue-400 text-xs hover:underline"
                        >
                          {expandedMsgs[i] ? "Show Less ▲" : "Show More ▼"}
                        </button>
                      )}

                    </div>
                  )}

                    {/* FALLBACK */}
                    {!msg.response && msg.plan?.length > 0 && (
                      <ul className="text-sm list-disc pl-5">
                        {msg.plan.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    )}

                  </div>
                </motion.div>
              )}

            </div>
          ))}

          {loading && <p className="text-gray-400">🤖 Thinking...</p>}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 flex gap-2 border-t border-gray-800">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendTask()}
            className="flex-1 p-2 bg-gray-900 rounded"
            placeholder="Ask anything..."
          />
          <button
            onClick={sendTask}
            className="bg-blue-600 px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}