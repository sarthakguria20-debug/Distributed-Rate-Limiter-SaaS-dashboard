import React from 'react';
import { Activity, Shield, Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setTab: (t: string) => void;
}

export function Layout({ children, currentTab, setTab }: LayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Monitor', icon: <Activity className="w-4 h-4" /> },
    { id: 'rules', label: 'Rate Limits', icon: <Shield className="w-4 h-4" /> },
    { id: 'playground', label: 'Playground', icon: <Play className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0F1117] text-[#E2E8F0] font-sans overflow-hidden">
      {/* Header / Nav */}
      <header className="h-14 bg-[#1A1D24] border-b border-[#2D333D] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold italic tracking-tighter text-white">RL</div>
          <h1 className="text-lg font-semibold tracking-tight text-white">Limitless <span className="text-blue-500 font-mono text-xs ml-2 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">DISTRIBUTED v2.4</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-emerald-400 font-mono">REDIS CLUSTER: HEALTHY (4 nodes)</span>
          </div>
          <div className="flex items-center gap-2 border-l border-[#2D333D] pl-6">
            <span className="text-xs text-slate-400 font-mono">LATENCY: 0.42ms</span>
            <div className="w-10 h-10 rounded-full bg-[#2D333D] flex items-center justify-center text-sm text-white">JD</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 bg-[#0F1117] border-r border-[#2D333D] flex flex-col p-4 shrink-0">
          <nav className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-2">Monitor</div>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                  currentTab === item.id 
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                    : "text-slate-400 hover:text-slate-300 hover:bg-[#1A1D24] border border-transparent"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="mt-auto p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Node Usage</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
              <div className="bg-blue-500 h-full w-[42%]"></div>
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between font-mono">
              <span>CPU: 42%</span>
              <span>MEM: 1.2GB</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6 flex flex-col overflow-auto">
           {children}
        </main>
      </div>
    </div>
  );
}
