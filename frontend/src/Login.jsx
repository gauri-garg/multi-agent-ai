import React, { useState } from "react";
import { motion } from "framer-motion";
import { GoogleIcon, LogoIcon } from "./icons";

export default function Login({ onLogin, theme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin({
      name: email ? email.split("@")[0] : "Guest User",
      email: email || "guest@example.com",
      avatar: `https://ui-avatars.com/api/?name=${email ? email.split("@")[0] : "Guest"}&background=2563EB&color=fff&rounded=true`
    });
  };

  return (
    <div className={`flex h-[100dvh] w-full items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col items-center mb-8">
          <LogoIcon className="w-12 h-12 text-blue-600 dark:text-blue-500 mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Sign in to continue to Multi-Agent AI</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Email Address</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'}`} placeholder="you@example.com" />
          </div>
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-slate-900'}`} placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors mt-2 shadow-md">Sign In</button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}></div></div>
          <div className="relative flex justify-center text-sm"><span className={`px-4 text-xs uppercase tracking-widest font-semibold ${theme === 'dark' ? 'bg-slate-800/50 text-slate-400' : 'bg-white text-gray-400'}`}>Or continue with</span></div>
        </div>

        <button type="button" onClick={handleLogin} className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl border font-semibold transition-all ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50 text-white' : 'border-gray-300 hover:bg-gray-50 text-slate-700'}`}><GoogleIcon /> Google</button>
      </motion.div>
    </div>
  );
}