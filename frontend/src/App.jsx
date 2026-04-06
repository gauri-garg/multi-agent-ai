import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  // 🔥 LOAD CHATS FROM BACKEND
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/chats")
      .then(res => {
        setChats(res.data);

        if (res.data.length > 0) {
          setActiveChat(res.data[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const currentChat = chats.find(c => c.id === activeChat);

  // ➕ CREATE NEW CHAT
  const createNewChat = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/chat");

      setChats(prev => [res.data, ...prev]);
      setActiveChat(res.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  // 🚀 SEND MESSAGE
  const sendTask = async () => {
    if (!input || !activeChat) return;

    const userMsg = { type: "user", text: input };

    // instant UI update
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChat
          ? { ...chat, messages: [...chat.messages, userMsg] }
          : chat
      )
    );

    setLoading(true);

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/chat/${activeChat}`,
        { task: input }
      );

      // add AI response
      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: [...chat.messages, res.data]
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
      <div className="w-64 bg-black p-4 border-r border-gray-800 flex flex-col">

        <button
          onClick={createNewChat}
          className="mb-4 bg-blue-600 p-2 rounded-lg hover:bg-blue-700"
        >
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`p-2 rounded cursor-pointer ${
                activeChat === chat.id
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }`}
            >
              💬 Chat {chat.id}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <div className="p-4 border-b border-gray-800">
          🤖 Multi-Agent AI
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {currentChat?.messages.map((msg, i) => (
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
                  <div className="bg-gray-800 p-4 rounded-xl max-w-2xl space-y-2">

                    {msg.plan && msg.plan.length > 0 && (
                      <ul className="text-sm list-disc pl-5">
                        {msg.plan.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    )}

                    {msg.ml && (
                      <p className="text-sm">🧠 {msg.ml.category}</p>
                    )}

                    {msg.dl && (
                      <p className="text-sm">🤖 {msg.dl.dl_category}</p>
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
        </div>

        {/* INPUT */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 p-3 rounded-xl bg-gray-900 border border-gray-700"
          />
          <button
            onClick={sendTask}
            className="bg-blue-600 px-5 rounded-xl"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}