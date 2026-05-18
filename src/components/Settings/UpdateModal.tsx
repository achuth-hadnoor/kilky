import { useState } from 'react';
import { Download, Check, RefreshCw, X, Loader2, ArrowUpCircle } from 'lucide-react';
import { relaunch } from '@tauri-apps/plugin-process';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  update: any; // The Tauri Update object
}

export function UpdateModal({ isOpen, onClose, update }: UpdateModalProps) {
  const [stage, setStage] = useState<'prompt' | 'downloading' | 'finished' | 'error'>('prompt');
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !update) return null;

  const handleUpdate = async () => {
    setStage('downloading');
    setDownloaded(0);
    setTotal(0);
    try {
      let currentDownloaded = 0;
      let totalLength = 0;

      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            totalLength = event.data.contentLength || 0;
            setTotal(totalLength);
            break;
          case 'Progress':
            currentDownloaded += event.data.chunkLength;
            setDownloaded(currentDownloaded);
            break;
          case 'Finished':
            setStage('finished');
            break;
        }
      });
      
      // If we finished successfully, trigger relaunch
      setStage('finished');
      setTimeout(async () => {
        await relaunch();
      }, 1500);
    } catch (e) {
      console.error(e);
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStage('error');
    }
  };

  const progressPercent = total > 0 ? Math.min(Math.round((downloaded / total) * 100), 100) : 0;
  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md bg-white/90 dark:bg-zinc-950/90 border border-black/10 dark:border-white/10 shadow-2xl rounded-3xl p-8 overflow-hidden select-none animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop decorative circles */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />

        {stage !== 'downloading' && stage !== 'finished' && (
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon Header */}
          {stage === 'prompt' && (
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl scale-125 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg animate-bounce duration-1000">
                <ArrowUpCircle className="w-8 h-8" />
              </div>
            </div>
          )}

          {stage === 'downloading' && (
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl scale-150 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
          )}

          {stage === 'finished' && (
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-125 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                <Check className="w-8 h-8" />
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl scale-125 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg">
                <X className="w-8 h-8" />
              </div>
            </div>
          )}

          {/* Title and details */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-black to-black/60 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
              {stage === 'prompt' && "Update Available"}
              {stage === 'downloading' && "Downloading Update"}
              {stage === 'finished' && "Restarting Kliky..."}
              {stage === 'error' && "Update Failed"}
            </h3>
            <p className="text-sm font-semibold text-indigo-500 dark:text-indigo-400">
              Version {update.version} is ready.
            </p>
          </div>

          {/* Conditional Content */}
          {stage === 'prompt' && (
            <div className="w-full space-y-4">
              {update.body && (
                <div className="w-full max-h-36 overflow-y-auto p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-left text-xs leading-relaxed text-black/60 dark:text-white/60 font-sans custom-scrollbar select-text">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-black/40 dark:text-white/40 mb-2">Release Notes:</div>
                  <div className="whitespace-pre-wrap">{update.body}</div>
                </div>
              )}
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl border border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-sm font-semibold text-black dark:text-white cursor-pointer transition-all duration-200"
                >
                  Later
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-sm font-semibold text-white shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Update Now
                </button>
              </div>
            </div>
          )}

          {stage === 'downloading' && (
            <div className="w-full space-y-4">
              <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-3 overflow-hidden p-[2px]">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300 ease-out animate-pulse"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-black/40 dark:text-white/40 font-semibold font-mono">
                <span>{progressPercent}% completed</span>
                <span>{total > 0 ? `${formatMB(downloaded)} MB of ${formatMB(total)} MB` : "Calculating..."}</span>
              </div>
            </div>
          )}

          {stage === 'finished' && (
            <div className="w-full space-y-2">
              <p className="text-sm text-black/60 dark:text-white/60">
                Installation successful. Relaunching the application...
              </p>
              <div className="flex justify-center p-4">
                <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="w-full space-y-4">
              <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                {errorMsg || "An unknown error occurred during update."}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl border border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-sm font-semibold text-black dark:text-white cursor-pointer transition-all duration-200"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold text-white cursor-pointer transition-all duration-200"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
