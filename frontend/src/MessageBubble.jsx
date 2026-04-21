import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import { LikeIcon, DislikeIcon, CopyIcon, CheckIcon, RegenerateIcon, LogoIcon, UserIcon } from "./icons";

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  suppressErrorRendering: true
});

const Mermaid = ({ chart, isStreaming, theme }) => {
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (chart) {
      mermaid.initialize({ theme: theme === 'dark' ? 'dark' : 'default' });
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      mermaid.render(id, chart)
        .then(({ svg }) => {
          if (isMounted) {
            setSvgContent(svg);
            setError(false);
          }
        })
        .catch(() => {
          if (isMounted) setError(true);
          // Cleanup stray Mermaid error overlays from the DOM
          const errorEl = document.getElementById("d" + id);
          if (errorEl) errorEl.remove();
        });
    }
    return () => { isMounted = false; };
  }, [chart]);

  if (error && !isStreaming) {
    return (
      <div className="my-4 bg-slate-900/50 text-red-400 px-4 py-3 rounded-xl font-mono text-sm border border-red-500/30 overflow-x-auto">
        <div className="font-bold mb-2 text-xs uppercase tracking-wider text-red-500">Mermaid Syntax Error</div>
        <pre>{chart}</pre>
      </div>
    );
  }

  return (
    <>
      <div className={`group relative flex justify-center w-full my-6 overflow-x-auto bg-slate-900/60 p-6 rounded-2xl shadow-inner border border-slate-700/50 ${!svgContent ? 'min-h-[100px] items-center' : ''}`}>
        {svgContent ? (
          <>
            <button onClick={() => setIsFullscreen(true)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-slate-800 text-slate-300 hover:text-white p-2 rounded-lg transition-opacity border border-slate-700 shadow-sm z-10" title="View Fullscreen">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
            <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full flex justify-center cursor-zoom-in [&>svg]:max-w-full [&>svg]:h-auto" onClick={() => setIsFullscreen(true)} />
          </>
        ) : (
          <>
            {!error && <div className="animate-pulse text-slate-500 text-sm font-medium tracking-wide">Drawing chart...</div>}
            {error && isStreaming && <div className="animate-pulse text-slate-500 text-sm font-medium tracking-wide">Generating chart layout...</div>}
          </>
        )}
      </div>

      <AnimatePresence>
        {isFullscreen && createPortal(
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative bg-slate-900 rounded-3xl p-6 sm:p-10 w-full h-full max-w-7xl max-h-[90vh] overflow-auto flex flex-col items-center border border-slate-700 shadow-2xl cursor-default" onClick={e => e.stopPropagation()}>
              <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white rounded-full p-2 transition-colors z-50 shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full flex justify-center items-center [&>svg]:!w-full [&>svg]:!h-auto [&>svg]:!max-w-none [&>svg]:!max-h-none [&>svg]:!min-w-[600px] md:[&>svg]:!min-w-[1000px]" />
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
};

export default function MessageBubble({ msg, isReady }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = msg.type === "user";

  const handleCopy = () => {
    const textToCopy = isUser ? msg.text : msg.response;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={msg.isNew ? { opacity: 0, y: 15 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex gap-4 max-w-[95%] md:max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md ${isUser ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"}`}>
          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          ) : (
            <span className="text-lg">🤖</span>
          )}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col gap-3 min-w-0 ${isUser ? "items-end" : "items-start"}`}>
          <div className={`px-5 py-4 shadow-sm text-sm md:text-base leading-relaxed ${
            isUser 
              ? "bg-blue-600 text-white rounded-3xl rounded-tr-sm" 
              : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-3xl rounded-tl-sm backdrop-blur-sm"
          }`}>
            
            {msg.imageUrl && (
              <div className="mb-3">
                <img src={msg.imageUrl} alt="Uploaded" className="max-w-[200px] sm:max-w-[280px] rounded-xl shadow-md border border-white/10 object-cover" />
              </div>
            )}

            {isUser ? (
              <div className="whitespace-pre-wrap">{msg.text}</div>
            ) : (
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-700/50 prose-pre:shadow-inner prose-headings:text-blue-400 prose-a:text-blue-400">
                {msg.detected_format && (
                  <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wider text-blue-400/90 select-none">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Auto-Formatted: {msg.detected_format}
                  </div>
                )}
                {(isReady && msg.response) ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: (props) => { const cleanProps = { ...props }; delete cleanProps.node; return <div className="overflow-x-auto my-4"><table className="min-w-full text-left border-collapse border border-slate-700/50 shadow-sm rounded-lg" {...cleanProps} /></div>; },
                      thead: (props) => { const cleanProps = { ...props }; delete cleanProps.node; return <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50" {...cleanProps} />; },
                      tbody: (props) => { const cleanProps = { ...props }; delete cleanProps.node; return <tbody className="divide-y divide-slate-700/50 bg-slate-900/30" {...cleanProps} />; },
                      tr: (props) => { const cleanProps = { ...props }; delete cleanProps.node; return <tr className="hover:bg-slate-800/30 transition-colors" {...cleanProps} />; },
                      th: (props) => { const cleanProps = { ...props }; delete cleanProps.node; return <th className="px-4 py-3 font-semibold text-sm whitespace-nowrap border-r border-slate-700/50 last:border-none" {...cleanProps} />; },
                      td: (props) => { const cleanProps = { ...props }; delete cleanProps.node; return <td className="px-4 py-3 text-sm text-slate-300 border-r border-slate-700/50 last:border-none" {...cleanProps} />; },
                      code: ({ inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = inline !== undefined ? inline : !match;
                        const cleanProps = { ...props };
                        delete cleanProps.node; // Prevent React DOM warning & ESLint unused var
                        
                        if (!isInline && match && match[1] === "mermaid") {
                          let chartText = Array.isArray(children) ? children.join('') : String(children || '');
                          // Fix common AI hallucinations and decode HTML entities
                          chartText = chartText.replace(/\|>/g, '|').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&'); 
                          return <Mermaid chart={chartText.replace(/\n$/, '')} isStreaming={msg.isStreaming} />;
                        }

                        return isInline 
                          ? <code className="bg-slate-900/50 text-blue-300 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...cleanProps}>{children}</code>
                          : <code className={`block font-mono text-sm ${className || ""}`} {...cleanProps}>{children}</code>;
                      }
                    }}
                  >
                    {msg.response + (msg.isStreaming ? ' ▍' : '')}
                  </ReactMarkdown>
                ) : msg.isStopped ? (
                  <span className="italic opacity-60 text-sm">Response generation was stopped by user.</span>
                ) : (
                  <span className="animate-pulse">Thinking...</span>
                )}
              </div>
            )}
          </div>

          {/* Research Expandable */}
          {msg.research && msg.research.length > 0 && (
            <div className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-inner mt-1">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Research Process Context
                </div>
                <svg className={`w-4 h-4 text-slate-400 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 space-y-3"
                  >
                    <div className="h-px w-full bg-slate-800 mb-2"></div>
                    {(msg.full_research || msg.research || []).map((r, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-semibold text-slate-300 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{r.step}</span>
                        </div>
                        <div className="text-slate-400 mt-1.5 ml-4 pl-3 border-l-2 border-slate-700/50 text-xs leading-relaxed">
                          {r.research?.slice(0, 300)}...
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Copy Toolbar for User */}
          {isUser && (
            <div className="flex items-center gap-2 mt-1 justify-end mr-2">
              <button 
                onClick={handleCopy} 
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                title="Copy text"
              >
                {copied ? (
                  <><svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> <span className="text-green-400 font-medium">Copied!</span></>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}