import React, { useState, useRef, useEffect } from "react";
import { QUOTES, COMMON_WORDS } from "./quotes";
import { RefreshCw, Timer, FileText, CheckCircle2, AlertTriangle, BarChart2, Sparkles, Keyboard } from "lucide-react";

interface HistoryItem {
  id: string;
  wpm: number;
  accuracy: number;
  strokes: number;
  date: string;
  mode: string;
}

export function Playground() {
  // Config state
  const [mode, setMode] = useState<"time" | "words" | "quote">("time");
  const [timeLimit, setTimeLimit] = useState<15 | 30 | 60>(30);
  const [wordLimit, setWordLimit] = useState<10 | 25 | 50 | 100>(25);

  // Engine state
  const [words, setWords] = useState<string[]>([]);
  const [typedWords, setTypedWords] = useState<string[]>([""]);
  const [isTesting, setIsTesting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Live Metrics
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Stats storage
  const [stats, setStats] = useState<{
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    missedChars: number;
    rawWpm: number;
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("kliky_typing_history_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup / reset helper
  const handleReset = () => {
    // Clear interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    setIsTesting(false);
    setIsCompleted(false);
    setStartTime(null);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setStats(null);

    // Populate words based on mode
    if (mode === "quote") {
      const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      setWords(randomQuote.split(" "));
    } else if (mode === "words") {
      const generated: string[] = [];
      for (let i = 0; i < wordLimit; i++) {
        generated.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]);
      }
      setWords(generated);
    } else {
      // Time mode - generate a large buffer of words
      const generated: string[] = [];
      for (let i = 0; i < 150; i++) {
        generated.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]);
      }
      setWords(generated);
      setTimeLeft(timeLimit);
    }

    setTypedWords([""]);

    // Focus input
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 20);
  };

  // Trigger reset on mode/limit changes
  useEffect(() => {
    handleReset();
  }, [mode, timeLimit, wordLimit]);

  // Focus input automatically on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Global reset keyboard shortcut (Tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, timeLimit, wordLimit]);

  // Handle active word index and active char index
  const activeWordIndex = typedWords.length - 1;
  const activeCharIndex = typedWords[activeWordIndex].length;

  // Real-time calculation of WPM and Accuracy
  const calculateLiveMetrics = (currentTyped: string[]) => {
    if (!startTime) return;
    const now = Date.now();
    const elapsedMinutes = (now - startTime) / 60000;
    if (elapsedMinutes <= 0.005) return;

    let correctChars = 0;
    let totalTypedChars = 0;

    currentTyped.forEach((typedWord, wIdx) => {
      const targetWord = words[wIdx] || "";
      totalTypedChars += typedWord.length;

      for (let cIdx = 0; cIdx < typedWord.length; cIdx++) {
        if (targetWord[cIdx] === typedWord[cIdx]) {
          correctChars++;
        }
      }
      // Add space for completed words
      if (wIdx < currentTyped.length - 1) {
        correctChars++;
        totalTypedChars++;
      }
    });

    const calculatedWpm = Math.round((correctChars / 5) / elapsedMinutes);
    const accuracy = totalTypedChars > 0 ? Math.round((correctChars / totalTypedChars) * 100) : 100;

    setLiveWpm(calculatedWpm > 250 ? 250 : calculatedWpm);
    setLiveAccuracy(accuracy);
  };

  // Start Test Timer
  const startTimer = () => {
    setIsTesting(true);
    const start = Date.now();
    setStartTime(start);

    if (mode === "time") {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            finishTest(timeLimit);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Complete/Finish the test and compute stats
  const finishTest = (finalTimeSec: number) => {
    setIsTesting(false);
    setIsCompleted(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const durationMin = finalTimeSec / 60;

    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;
    let missedChars = 0;
    let totalTypedCount = 0;

    typedWords.forEach((typedWord, wIdx) => {
      const targetWord = words[wIdx] || "";
      totalTypedCount += typedWord.length;

      for (let cIdx = 0; cIdx < Math.max(targetWord.length, typedWord.length); cIdx++) {
        if (cIdx < targetWord.length) {
          if (cIdx < typedWord.length) {
            if (typedWord[cIdx] === targetWord[cIdx]) {
              correctChars++;
            } else {
              incorrectChars++;
            }
          } else {
            missedChars++;
          }
        } else {
          extraChars++;
        }
      }
      // Add space character
      if (wIdx < typedWords.length - 1) {
        correctChars++;
        totalTypedCount++;
      }
    });

    const finalWpm = Math.round((correctChars / 5) / durationMin);
    const rawWpm = Math.round((totalTypedCount / 5) / durationMin);
    const finalAccuracy = totalTypedCount > 0 ? Math.round((correctChars / totalTypedCount) * 100) : 100;

    const finalStats = {
      wpm: finalWpm > 250 ? 250 : finalWpm,
      accuracy: finalAccuracy,
      correctChars,
      incorrectChars,
      extraChars,
      missedChars,
      rawWpm: rawWpm > 250 ? 250 : rawWpm
    };

    setStats(finalStats);

    // Save to history
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      wpm: finalStats.wpm,
      accuracy: finalStats.accuracy,
      strokes: totalTypedCount,
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: `${mode} ${mode === "time" ? timeLimit + "s" : mode === "words" ? wordLimit + "w" : ""}`
    };

    const newHistory = [newItem, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("kliky_typing_history_v2", JSON.stringify(newHistory));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;

    // Start timer on first keystroke
    if (!isTesting && !isCompleted && val.length > 0) {
      startTimer();
    }

    // Split words by spaces
    const wordsTyped = val.split(" ");

    // For non-time modes, check if we reached the end of the text
    if (mode !== "time") {
      if (wordsTyped.length > words.length && words.length > 0) {
        return;
      }
      if (wordsTyped.length === words.length && words.length > 0) {
        const lastWordTyped = wordsTyped[wordsTyped.length - 1];
        const lastWordTarget = words[words.length - 1];
        if (lastWordTyped.length === lastWordTarget.length) {
          // Finished!
          setTypedWords(wordsTyped);
          finishTest((Date.now() - (startTime || Date.now())) / 1000);
          return;
        }
      }
    }

    setTypedWords(wordsTyped);
    calculateLiveMetrics(wordsTyped);
  };

  const deleteHistory = () => {
    setHistory([]);
    localStorage.removeItem("kliky_typing_history_v2");
  };

  return (
    <div className="w-full h-screen bg-background p-6 flex flex-col font-mono text-muted-foreground overflow-y-auto selection:bg-[#ef4444]/30 selection:text-foreground" data-tauri-drag-region>
      <div className="max-w-4xl w-full mx-auto flex flex-col space-y-6 mt-6 z-10" data-tauri-drag-region>
        
        {/* Navigation & Modes Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-border gap-4" data-tauri-drag-region>
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-[#ef4444]" />
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground flex items-center gap-2">
                Kliky Sandbox
              </h3>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                Type smoothly to feel the custom mechanical switches
              </p>
            </div>
          </div>

          {/* Monkeytype Mode Switchers */}
          {!isTesting && !isCompleted && (
            <div className="flex items-center gap-1 bg-muted border border-border rounded-lg p-1 text-xs select-none">
              <button
                onClick={() => setMode("time")}
                className={`px-3 py-1.5 rounded-md transition ${mode === "time" ? "bg-[#ef4444] text-white font-bold" : "hover:text-foreground text-muted-foreground"}`}
              >
                time
              </button>
              <button
                onClick={() => setMode("words")}
                className={`px-3 py-1.5 rounded-md transition ${mode === "words" ? "bg-[#ef4444] text-white font-bold" : "hover:text-foreground text-muted-foreground"}`}
              >
                words
              </button>
              <button
                onClick={() => setMode("quote")}
                className={`px-3 py-1.5 rounded-md transition ${mode === "quote" ? "bg-[#ef4444] text-white font-bold" : "hover:text-foreground text-muted-foreground"}`}
              >
                quote
              </button>

              {/* Sub-selectors */}
              <div className="w-[1px] h-4 bg-border mx-2" />

              {mode === "time" && (
                <div className="flex items-center gap-1">
                  {[15, 30, 60].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeLimit(t as 15 | 30 | 60)}
                      className={`px-2 py-1 rounded transition ${timeLimit === t ? "text-[#ef4444] font-bold" : "hover:text-foreground text-muted-foreground"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {mode === "words" && (
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWordLimit(w as 10 | 25 | 50 | 100)}
                      className={`px-2 py-1 rounded transition ${wordLimit === w ? "text-[#ef4444] font-bold" : "hover:text-foreground text-muted-foreground"}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Metrics Header (Floating while typing) */}
        {isTesting && !isCompleted && (
          <div className="flex flex-1 items-center gap-6 text-sm font-mono text-muted-foreground px-2 animate-fade-in">
            {mode === "time" ? (
              <span className="flex items-center gap-1.5 text-[#ef4444]">
                <Timer className="w-4 h-4" />
                {timeLeft}s
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#ef4444]">
                <FileText className="w-4 h-4" />
                {activeWordIndex}/{words.length} words
              </span>
            )}
            <span>WPM: <strong className="text-foreground">{liveWpm}</strong></span>
            <span>Accuracy: <strong className="text-foreground">{liveAccuracy}%</strong></span>
          </div>
        )}

        {/* Main Interface */}
        {!isCompleted ? (
          <div 
            ref={containerRef}
            className="relative w-full rounded-xl bg-card border border-border/80 p-8 flex flex-col focus-within:border-[#ef4444]/40 transition duration-300 min-h-[180px] justify-center cursor-text shadow-sm"
            onClick={() => textareaRef.current?.focus()}
          >
            {/* Hidden Textarea */}
            <textarea
              ref={textareaRef}
              value={typedWords.join(" ")}
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 resize-none z-10 w-full h-full cursor-text"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              disabled={isCompleted}
            />

            {/* Word list wrapper */}
            <div className="relative z-0 pointer-events-none font-mono text-xl md:text-2xl leading-relaxed tracking-wide select-none break-words whitespace-pre-wrap flex flex-wrap gap-x-[0.55em] gap-y-[0.4em] transition-all duration-300">
              {words.map((word, wordIdx) => {
                const typedWord = typedWords[wordIdx] || "";
                const isActiveWord = wordIdx === activeWordIndex;

                // Build each character's class/span
                const maxLen = Math.max(word.length, typedWord.length);
                const chars = [];

                for (let charIdx = 0; charIdx < maxLen; charIdx++) {
                  const targetChar = word[charIdx];
                  const typedChar = typedWord[charIdx];

                  let colorClass = "text-muted-foreground/50 dark:text-muted-foreground/60";

                  if (typedChar !== undefined) {
                    if (targetChar !== undefined) {
                      colorClass = typedChar === targetChar ? "text-foreground" : "text-red-500 border-b-2 border-red-500/30";
                    } else {
                      // Typed beyond target length
                      colorClass = "text-red-600 bg-red-500/10 rounded-sm";
                    }
                  }

                  const isCurrentCaret = isActiveWord && charIdx === activeCharIndex;

                  chars.push(
                    <span key={charIdx} className="relative inline-block">
                      {isCurrentCaret && (
                        <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-[#ef4444] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                      )}
                      <span className={`${colorClass} transition-colors duration-100`}>
                        {targetChar || typedChar}
                      </span>
                    </span>
                  );
                }

                // If caret is at the end of the current active word, render it here
                const showTrailingCaret = isActiveWord && activeCharIndex >= word.length;

                return (
                  <div
                    key={wordIdx}
                    className={`flex items-center transition duration-150 ${isActiveWord ? "text-foreground border-b border-border/40" : ""
                      }`}
                  >
                    {chars}
                    {showTrailingCaret && (
                      <span className="relative inline-block w-[2px] h-[1.2em]">
                        <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-[#ef4444] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Restart Hint */}
            <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground font-mono z-20 relative">
              <div className="flex items-center gap-2">
                <span className="bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground">tab</span>
                <span>or click restart to quick-reset</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restart
              </button>
            </div>
          </div>
        ) : (
          // Gorgeous Dashboard / Results Screen
          <div className="w-full rounded-xl bg-card border border-border p-8 flex flex-col space-y-8 animate-fade-in shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#ef4444]" />
                <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground">Performance Summary</h4>
              </div>
              <span className="text-xs bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 px-2 py-1 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> completed
              </span>
            </div>

            {/* Main Stats Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-muted/40 border border-border rounded-xl p-5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Speed (WPM)</span>
                <span className="text-4xl font-extrabold text-[#ef4444] mt-2 flex items-baseline gap-1">
                  {stats?.wpm}
                  <span className="text-xs text-muted-foreground font-normal">net</span>
                </span>
              </div>

              <div className="bg-muted/40 border border-border rounded-xl p-5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Accuracy</span>
                <span className="text-4xl font-extrabold text-foreground mt-2 flex items-baseline gap-1">
                  {stats?.accuracy}%
                  <span className="text-xs text-muted-foreground font-normal">hit rate</span>
                </span>
              </div>

              <div className="bg-muted/40 border border-border rounded-xl p-5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Raw Speed</span>
                <span className="text-4xl font-extrabold text-muted-foreground/80 mt-2 flex items-baseline gap-1">
                  {stats?.rawWpm}
                  <span className="text-xs text-muted-foreground font-normal">wpm</span>
                </span>
              </div>

              <div className="bg-muted/40 border border-border rounded-xl p-5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Strokes Details</span>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Correct:</span>
                    <span className="text-emerald-500 font-bold">{stats?.correctChars}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mistakes:</span>
                    <span className="text-rose-500 font-bold">{stats?.incorrectChars}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missed/Extra:</span>
                    <span>{stats?.missedChars || 0} / {stats?.extraChars || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Restart Option */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ef4444] text-white font-bold hover:bg-[#ef4444]/90 transition cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Practice Again
              </button>
            </div>
          </div>
        )}

        {/* Previous Best Stats / History */}
        {history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border" data-tauri-drag-region>
            <div className="flex justify-between items-center mb-4" data-tauri-drag-region>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground/80" />
                Recent Practice Runs
              </h4>
              <button 
                onClick={deleteHistory} 
                className="text-xs text-rose-500 hover:text-rose-600 transition flex items-center gap-1"
                data-tauri-drag-region
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm" data-tauri-drag-region>
              <table className="w-full text-left text-xs text-muted-foreground" data-tauri-drag-region>
                <thead className="bg-muted border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold" data-tauri-drag-region>
                  <tr>
                    <th className="px-4 py-3" data-tauri-drag-region>Date</th>
                    <th className="px-4 py-3" data-tauri-drag-region>Mode</th>
                    <th className="px-4 py-3 text-right" data-tauri-drag-region>WPM</th>
                    <th className="px-4 py-3 text-right" data-tauri-drag-region>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition text-muted-foreground" data-tauri-drag-region>
                      <td className="px-4 py-3" data-tauri-drag-region>{item.date}</td>
                      <td className="px-4 py-3" data-tauri-drag-region>
                        <span className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px]">
                          {item.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground" data-tauri-drag-region>{item.wpm}</td>
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
