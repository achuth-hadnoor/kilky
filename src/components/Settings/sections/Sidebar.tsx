import { LucideIcon } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { TrialInfo } from '../../../lib/license';

interface NavItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface SidebarProps<T extends string = string> {
  navItems: ReadonlyArray<NavItem<T>>;
  activeTab: T;
  setActiveTab: (id: T) => void;
  trialInfo?: TrialInfo | null;
  isActivated?: boolean;
}

export function Sidebar<T extends string = string>({ navItems, activeTab, setActiveTab, trialInfo, isActivated }: SidebarProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % navItems.length;
      const el = document.getElementById(`nav-item-${navItems[nextIndex].id}`);
      el?.focus();
      setActiveTab(navItems[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + navItems.length) % navItems.length;
      const el = document.getElementById(`nav-item-${navItems[prevIndex].id}`);
      el?.focus();
      setActiveTab(navItems[prevIndex].id);
    }
  };

  return (
    <aside
      className="w-64 h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/20 p-4 pt-16"
      data-tauri-drag-region
    >
      <div className="px-4 mb-10 flex items-center gap-3" data-tauri-drag-region>
        <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-md" />
        <h2 className="text-2xl font-bold bg-gradient-to-br from-black to-black/50 dark:from-white dark:to-white/40 bg-clip-text text-transparent tracking-tighter">
          kliky
        </h2>
      </div>

      <nav className="flex-1 space-y-4">
        {navItems.map((item, index) => (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-full flex items-center gap-3 p-1  pr-4 rounded-xl group transition-all duration-200 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50 ${activeTab === item.id
              ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border-black/10 dark:border-white/10 shadow-sm'
              : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
              }`}
          >
            <span className={`${item.color} p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200`}>
              <item.icon
                className={`w-3.5 h-3.5 ${activeTab === item.id ? 'text-white' : 'text-white/90'
                  }`}
              />
            </span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {trialInfo && !isActivated && trialInfo.isTrialStarted && (
        <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/20 dark:border-orange-500/10 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-orange-500/10">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <svg className="w-12 h-12 text-orange-500 transform translate-x-4 -translate-y-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-1 relative z-10">
            {trialInfo.daysLeft} Days Left
          </h3>
          <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80 mb-4 relative z-10 leading-tight">
            Your free trial is active. Upgrade to permanently unlock premium features.
          </p>
          <button 
            onClick={() => invoke('show_onboarding')}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-[10px] uppercase tracking-wider font-extrabold shadow-md shadow-orange-500/20 transition-all active:scale-[0.98] relative z-10"
          >
            Activate License
          </button>
        </div>
      )}

    </aside>
  );
}
