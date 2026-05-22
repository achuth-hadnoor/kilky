import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { X, Copy, Terminal, Shield, Package, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DebugInfo {
  bundle_id: string;
  is_sandboxed: boolean;
  is_trusted: boolean;
  version: string;
  arch: string;
}

interface LogEntry {
  message: string;
  level: number;
}

export function DebugOverlay({ onClose }: { onClose: () => void }) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const info = await invoke<DebugInfo>("get_debug_info");
      setDebugInfo(info);
    };
    fetchInfo();

    const unlisten = listen<LogEntry>("plugin:log", (event) => {
      setLogs((prev) => [...prev, event.payload.message].slice(-100));
    });

    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = () => {
    const text = `
Debug Info:
Bundle ID: ${debugInfo?.bundle_id}
Sandboxed: ${debugInfo?.is_sandboxed}
Trusted: ${debugInfo?.is_trusted}
Version: ${debugInfo?.version}

Logs:
${logs.join("\n")}
    `;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-bold">Debug Console</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 opacity-50">
            <Package className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Application</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-400">Bundle ID: <span className="text-white font-mono">{debugInfo?.bundle_id}</span></p>
            <p className="text-xs text-zinc-400">Version: <span className="text-white font-mono">{debugInfo?.version} ({debugInfo?.arch})</span></p>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Environment</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Sandboxed:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${debugInfo?.is_sandboxed ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
                {debugInfo?.is_sandboxed ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Accessibility:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${debugInfo?.is_trusted ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {debugInfo?.is_trusted ? 'GRANTED' : 'DENIED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Live Logs</span>
          <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 gap-2 text-[10px] hover:bg-white/10">
            <Copy className="w-3 h-3" />
            Copy All
          </Button>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-1 select-text"
        >
          {logs.length === 0 && <p className="opacity-20 italic">No logs yet...</p>}
          {logs.map((log, i) => (
            <p key={i} className="text-zinc-300 break-all border-l border-white/5 pl-2">{log}</p>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-red-100">Fix Permissions (TCC Reset)</p>
          <p className="text-xs text-red-100/60 leading-normal mb-2">
            If the toggle won't turn on, run this in Terminal to clear the system cache for this app:
          </p>
          <code className="block bg-black/30 p-2 rounded text-[10px] font-mono text-red-300 select-all cursor-pointer">
            tccutil reset Accessibility {debugInfo?.bundle_id}
          </code>
        </div>
      </div>
    </div>
  );
}
