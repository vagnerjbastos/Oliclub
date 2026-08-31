'use client';

import { Home, Trophy, BarChart3, User, Shield } from 'lucide-react';
import { useAppStore, type AppView } from '@/lib/store';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  view: AppView;
}

export default function BottomNav() {
  const { view, setView, player } = useAppStore();

  if (!player || view === 'auth') return null;

  const items: NavItem[] = [
    { label: 'Início', icon: <Home className="h-5 w-5" />, view: 'home' },
    { label: 'Torneios', icon: <Trophy className="h-5 w-5" />, view: 'tournaments' },
    { label: 'Ranking', icon: <BarChart3 className="h-5 w-5" />, view: 'rankings' },
    { label: 'Perfil', icon: <User className="h-5 w-5" />, view: 'profile' },
  ];

  if (player.isAdmin) {
    items.push({
      label: 'Admin',
      icon: <Shield className="h-5 w-5" />,
      view: 'admin-tournaments',
    });
  }

  const isActive = (itemView: AppView) => {
    if (view === 'tournament-detail' && itemView === 'tournaments') return true;
    if (
      (view === 'admin-tournaments' || view === 'admin-create' || view === 'admin-manage') &&
      itemView === 'admin-tournaments'
    ) {
      return true;
    }
    return view === itemView;
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-500/15 bg-[#0f1419]/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-1">
        {items.map((item) => {
          const active = isActive(item.view);
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`
                relative flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium transition-all duration-200
                ${
                  active
                    ? 'text-amber-400'
                    : 'text-slate-500 hover:text-slate-300 active:scale-95'
                }
              `}
            >
              {active && (
                <span className="absolute -top-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              )}
              <span
                className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
