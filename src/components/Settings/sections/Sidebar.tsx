import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function Sidebar({ navItems, activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside
      className="w-64 h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 p-4 pt-16"
      data-tauri-drag-region
    >
      <div className="px-4 mb-8" data-tauri-drag-region>
        <h2 className="text-2xl font-bold dark:from-white dark:to-white/40 bg-clip-text tracking-tight">
          kliky
        </h2>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl duration-200 group ${
              activeTab === item.id
                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/10 shadow-lg'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <item.icon
              className={`w-4 h-4 ${
                activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : ''
              }`}
            />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-black/5 dark:border-white/5 mt-auto">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30 font-bold">
            Engine Active
          </span>
        </div>
      </div>
    </aside>
  );
}
