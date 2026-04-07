import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const chatEndRef = useRef(null);

  // 🔥 LOAD CHATS
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/chats")
      .then(res => {
        const data = res.data.map(c => ({
          ...c,
          pinned: c.pinned || false
        }));

        setChats(data);

        if (data.length > 0) {
          setActiveChat(data[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // 🔥 AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const currentChat = chats.find(c => c.id === activeChat);

  // 🧠 FILTER + SORT
  const filteredChats = chats
    .filter(chat =>
      (chat.name || `Chat ${chat.id}`)
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.id - a.id;
    });

  // ➕ CREATE CHAT
  const createNewChat = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/chat");

      const newChat = { ...res.data, pinned: false };

      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat.id);
    } catch (err) {
      console.error(err);
    }
  };

  // 🗑️ DELETE
  const deleteChat = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/chat/${id}`);

      const updated = chats.filter(c => c.id !== id);
      setChats(updated);

      if (activeChat === id && updated.length > 0) {
        setActiveChat(updated[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✏️ RENAME
  const startRename = (chat) => {
    setEditingId(chat.id);
    setEditText(chat.name || `Chat ${chat.id}`);
  };

  const saveRename = async (id) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/chat/${id}?name=${editText}`
      );

      setChats(prev =>
        prev.map(c =>
          c.id === id ? { ...c, name: editText } : c
        )
      );

      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 📌 PIN
  const togglePin = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:8000/chat/${id}/pin`);

      setChats(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, pinned: !c.pinned }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 🚀 SEND MESSAGE
  const sendTask = async () => {
    if (!input || !activeChat) return;

    const userMsg = { type: "user", text: input };

    const aiMsg = {
      type: "ai",
      plan: [],
      ml: null,
      dl: null,
      memory: []
    };

    // add user + ai placeholder
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: [...chat.messages, userMsg, aiMsg]
            }
          : chat
      )
    );

    setLoading(true);

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/chat/${activeChat}`,
        { task: input }
      );

      const data = res.data;

      // STREAM PLAN
      for (let step of data.plan || []) {
        await new Promise(r => setTimeout(r, 400));

        aiMsg.plan.push(step);

        setChats(prev =>
          prev.map(chat =>
            chat.id === activeChat
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages.slice(0, -1),
                    { ...aiMsg }
                  ]
                }
              : chat
          )
        );
      }

      // ML
      await new Promise(r => setTimeout(r, 300));
      aiMsg.ml = data.ml;

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: [
                  ...chat.messages.slice(0, -1),
                  { ...aiMsg }
                ]
              }
            : chat
        )
      );

      // DL
      await new Promise(r => setTimeout(r, 300));
      aiMsg.dl = data.dl;

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: [
                  ...chat.messages.slice(0, -1),
                  { ...aiMsg }
                ]
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
      <div className="w-72 bg-[#0b0f19] border-r border-gray-800 flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 space-y-3">

          <div className="flex justify-between items-center">
            <h2 className="text-sm text-gray-300 font-semibold">
              💬 Chats
            </h2>

            <button
              onClick={createNewChat}
              className="bg-blue-600 px-3 py-1 text-sm rounded-lg hover:bg-blue-700"
            >
              + New
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full p-2 text-sm rounded-lg bg-gray-900 border border-gray-700"
          />
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">

          {filteredChats.map(chat => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
                activeChat === chat.id
                  ? "bg-blue-600/20 border border-blue-500"
                  : "hover:bg-gray-800"
              }`}
              onClick={() => setActiveChat(chat.id)}
            >

              <div className="flex items-center gap-2 truncate">
                {chat.pinned && <span>📌</span>}

                {editingId === chat.id ? (
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => saveRename(chat.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && saveRename(chat.id)
                    }
                    className="bg-gray-900 text-sm px-2 py-1 rounded w-full"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm truncate">
                    {chat.name || `Chat ${chat.id}`}
                  </span>
                )}
              </div>

              <div className="hidden group-hover:flex gap-2 text-xs">

                <button onClick={(e) => {
                  e.stopPropagation();
                  togglePin(chat.id);
                }}>📌</button>

                <button onClick={(e) => {
                  e.stopPropagation();
                  startRename(chat);
                }}>✏️</button>

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

              {msg.type === "user" && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 px-4 py-2 rounded-xl max-w-lg">
                    {msg.text}
                  </div>
                </div>
              )}

              {msg.type === "ai" && (
               <motion.div initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} className="flex justify-start" >
                 <div className="bg-gray-800 p-4 rounded-xl max-w-2xl space-y-3"> 
                  {/* PLAN */}
                 {msg.plan.length > 0 && ( 
                  <ul className="text-sm list-disc pl-5"> 
                  {msg.plan.map((p, i) => ( 
                  <motion.li key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} > {p} </motion.li> ))}
                 </ul>
                 )} 
                 
                 {/* ANALYSIS */} 
                {(msg.ml || msg.dl) && ( <div className="bg-gray-900 p-3 rounded-lg"> 
                <h3 className="text-xs text-gray-400 mb-1"> Analysis </h3> 
                {msg.ml && ( <p className="text-sm"> 🧠 {msg.ml.category} ({msg.ml.confidence}) </p> )}
               {msg.dl && ( <p className="text-sm"> 🤖 {msg.dl.dl_category} ({msg.dl.dl_confidence}) </p> )} 
               </div> )} 
               </div>
                </motion.div>
              )}

            </div>
          ))}

          {/* TYPING */}
          {loading && <p className="text-gray-400">AI is typing...</p>}

          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendTask()}
            placeholder="Type your task..."
            className="flex-1 p-3 bg-gray-900 rounded-xl"
          />
          <button onClick={sendTask} className="bg-blue-600 px-5 rounded-xl">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}