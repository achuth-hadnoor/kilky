import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function Sidebar({ navItems, activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside
      className="w-64 h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 p-4 pt-16"
      data-tauri-drag-region
    >
      <div className="px-4 mb-10 flex items-center gap-3" data-tauri-drag-region>
        <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-md" />
        <h2 className="text-2xl font-bold dark:from-white dark:to-white/40 bg-clip-text tracking-tighter">
          kliky
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 p-1 rounded-xl group ${activeTab === item.id
              ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/10 shadow-lg p-1'
              : 'text-black/40 dark:text-white/40 hover:text-black/70 border border-transparent dark:hover:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 p-1'
              }`}
          >
            <span className={`${item.color} p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200`}>
              <item.icon
                className={`w-3.5 h-3.5 ${activeTab === item.id ? 'text-white' : 'text-white/90'
                  }`}
              />
            </span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

    </aside>
  );
}
