import React, { useState, useRef, useEffect } from "react";
import { QUOTES } from "./quotes";

interface HistoryItem {
  id: string;
  wpm: number;
  accuracy: number;
  strokes: number;
  date: string;
}

export function Playground() {
  const [targetText, setTargetText] = useState("");
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // WPM Tracking variables
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Load history
    const saved = localStorage.getItem("kliky_typing_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Focus the input immediately on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Pick a random quote on mount
    setTargetText(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const saveStats = (finalWpm: number, finalStrokes: number, finalAccuracy: number) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      wpm: finalWpm,
      accuracy: finalAccuracy,
      strokes: finalStrokes,
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    };
    const newHistory = [newItem, ...history].slice(0, 10); // keep last 10
    setHistory(newHistory);
    localStorage.setItem("kliky_typing_history", JSON.stringify(newHistory));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;

    // Prevent typing beyond the target text length
    if (val.length > targetText.length) return;

    setText(val);

    if (val.length === 0) {
      startTimeRef.current = null;
      setWpm(0);
      return;
    }

    if (!startTimeRef.current && val.length === 1) {
      startTimeRef.current = Date.now();
    }

    let correctStrokes = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === targetText[i]) {
        correctStrokes++;
      }
    }

    let currentWpm = 0;
    if (startTimeRef.current) {
      const minutesElapsed = (Date.now() - startTimeRef.current) / 60000;
      if (minutesElapsed > 0.01) {
        const calculatedWpm = Math.round((correctStrokes / 5) / minutesElapsed);
        currentWpm = calculatedWpm > 250 ? 250 : calculatedWpm;
        setWpm(currentWpm);
      } else {
        currentWpm = Math.round((correctStrokes / 5) * 60);
        setWpm(currentWpm);
      }
    }

    // Check completion
    if (val.length === targetText.length && targetText.length > 0) {
      const accuracy = Math.round((correctStrokes / targetText.length) * 100);
      saveStats(currentWpm, val.length, accuracy);
    }
  };

  const handleReset = () => {
    setTargetText(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setText("");
    setWpm(0);
    startTimeRef.current = null;
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const deleteHistory = () => {
    setHistory([]);
    localStorage.removeItem("kliky_typing_history");
  };

  return (
    <div className="w-full h-screen bg-transparent p-6 flex flex-col font-sans text-foreground overflow-y-auto" data-tauri-drag-region>
      {/* Title Bar Drag Region */}
      {/* <div className="absolute top-0 left-0 right-0 h-10 z-50 flex justify-end px-4 items-center" data-tauri-drag-region>
        <button
          onClick={() => getCurrentWindow().hide()}
          className="text-zinc-500 hover:text-zinc-300 w-6 h-6 rounded-full flex items-center justify-center transition-colors bg-white/5 hover:bg-white/10"
        >
          &times;
        </button>
      </div> */}

      <div className="max-w-4xl w-full mx-auto flex flex-col space-y-6 mt-6 z-10" data-tauri-drag-region>
        <div className="flex items-center justify-between pb-3 border-b border-white/10" data-tauri-drag-region>
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-400 font-mono flex items-center gap-2" data-tauri-drag-region>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Live Typing Sandbox
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5" data-tauri-drag-region>
              Type to hear your native mechanical switches
            </p>
          </div>
        </div>

        {/* Glassmorphic Typing Test Area */}
        <div className="flex-1 relative group" data-tauri-drag-region>
          <div
            className="w-full relative rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 lg:p-10 flex flex-col transition duration-300 focus-within:border-red-500/40 focus-within:ring-1 focus-within:ring-red-500/30 cursor-text group"
            onClick={() => textareaRef.current?.focus()}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              className="absolute inset-0 opacity-0 resize-none z-10 w-full h-full cursor-text"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />

            <div className="flex-1 relative z-0 pointer-events-none font-mono text-xl lg:text-2xl leading-relaxed tracking-wide text-zinc-600 select-none break-words whitespace-pre-wrap" data-tauri-drag-region>
              {targetText.split('').map((char, index) => {
                let colorClass = "";
                if (index < text.length) {
                  colorClass = text[index] === char
                    ? "text-zinc-200"
                    : "text-red-500 bg-red-500/10 rounded-sm";
                }

                const isCurrent = index === text.length;

                return (
                  <span key={index} className="relative inline-block" data-tauri-drag-region>
                    {isCurrent && (
                      <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-red-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    )}
                    <span className={`${colorClass} transition-colors duration-75`}>{char}</span>
                  </span>
                );
              })}

              {text.length === targetText.length && targetText.length > 0 && (
                <span className="relative inline-block" data-tauri-drag-region>
                  <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-red-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end space-x-2 z-20 relative" data-tauri-drag-region>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition cursor-pointer"
            >
              Restart Test
            </button>
          </div>
        </div>

        {/* Current Metrics */}
        <div className="grid grid-cols-3 gap-4 font-mono" data-tauri-drag-region>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center" data-tauri-drag-region>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold" data-tauri-drag-region>Speed</span>
            <span className="text-2xl font-bold text-zinc-100 mt-1" data-tauri-drag-region>
              {wpm} <span className="text-xs text-zinc-500 font-normal" data-tauri-drag-region>WPM</span>
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center" data-tauri-drag-region>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold" data-tauri-drag-region>Keys hit</span>
            <span className="text-2xl font-bold text-zinc-100 mt-1" data-tauri-drag-region>
              {text.length} <span className="text-xs text-zinc-500 font-normal" data-tauri-drag-region>strokes</span>
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center" data-tauri-drag-region>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold" data-tauri-drag-region>Latency</span>
            <span className="text-2xl font-bold text-red-400 mt-1" data-tauri-drag-region>
              &lt; 3<span className="text-xs font-normal" data-tauri-drag-region>ms</span>
            </span>
          </div>
        </div>

        {/* Previous Best Stats */}
        {history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10" data-tauri-drag-region>
            <div className="flex justify-between items-center mb-4" data-tauri-drag-region>
              <h4 className="text-sm font-semibold tracking-wide uppercase text-zinc-400 font-mono" data-tauri-drag-region>Previous Best Stats</h4>
              <button onClick={deleteHistory} className="text-xs text-red-400 hover:text-red-300 transition" data-tauri-drag-region>Clear History</button>
            </div>
            <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden" data-tauri-drag-region>
              <table className="w-full text-left text-sm font-mono text-zinc-400" data-tauri-drag-region>
                <thead className="bg-black/40 border-b border-white/5 text-[10px] uppercase" data-tauri-drag-region>
                  <tr>
                    <th className="px-4 py-3 font-semibold" data-tauri-drag-region>Date</th>
                    <th className="px-4 py-3 font-semibold text-right" data-tauri-drag-region>WPM</th>
                    <th className="px-4 py-3 font-semibold text-right" data-tauri-drag-region>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition" data-tauri-drag-region>
                      <td className="px-4 py-3" data-tauri-drag-region>{item.date}</td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-200" data-tauri-drag-region>{item.wpm}</td>
                      <td className="px-4 py-3 text-right" data-tauri-drag-region>{item.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
