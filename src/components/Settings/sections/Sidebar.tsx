import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface SidebarProps {
  navItems: ReadonlyArray<NavItem>;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function Sidebar({ navItems, activeTab, setActiveTab }: SidebarProps) {
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
      className="w-64 h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 p-4 pt-16"
      data-tauri-drag-region
    >
      <div className="px-4 mb-10 flex items-center gap-3" data-tauri-drag-region>
        <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-md" />
        <h2 className="text-2xl font-bold bg-gradient-to-br from-black to-black/50 dark:from-white dark:to-white/40 bg-clip-text text-transparent tracking-tighter">
          kliky
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item, index) => (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-full flex items-center gap-3 p-2 pr-4 rounded-xl group transition-all duration-200 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50 ${
              activeTab === item.id
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

    </aside>
  );
}
