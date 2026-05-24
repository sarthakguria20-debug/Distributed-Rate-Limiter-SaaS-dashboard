import { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { cn } from './Layout';

export function Playground() {
  const [targetId, setTargetId] = useState('ip_test_1');
  const [endpoint, setEndpoint] = useState('/api/pricing');
  const [count, setCount] = useState(1);
  const [autoFire, setAutoFire] = useState(false);
  const [intervalMs, setIntervalMs] = useState(100);
  
  const [logs, setLogs] = useState<{ id: string, status: number, headers: Record<string, string>, accepted: boolean, time: number }[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fireRequest = async () => {
    const id = Math.random().toString();
    try {
      const start = Date.now();
      const res = await api.sendTestRequest(targetId, endpoint);
      const end = Date.now();
      
      setLogs(prev => [...prev, {
        id,
        status: res.status,
        headers: res.headers || {},
        accepted: res.status === 200,
        time: end - start
      }]);
    } catch (e) {
       console.error("Simulation failed", e);
    }
  };

  const handleShoot = async () => {
     for (let i = 0; i < count; i++) {
        fireRequest();
        if (i < count - 1) await new Promise(r => setTimeout(r, 10)); // tiny delay
     }
  };

  useEffect(() => {
    let timer: any;
    if (autoFire) {
      timer = setInterval(fireRequest, intervalMs);
    }
    return () => clearInterval(timer);
  }, [autoFire, intervalMs, targetId, endpoint]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full flex-1">
      {/* Control Panel */}
      <div className="bg-[#1A1D24] border border-[#2D333D] rounded-xl p-6 flex flex-col">
         <div className="flex items-center justify-between mb-2">
           <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Traffic Simulator</h2>
           {autoFire && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase animate-pulse">Running</span>}
         </div>
         <p className="text-xs text-slate-400 mb-6">Send mocked requests to test your middleware behavior and capacity handling.</p>
         
         <div className="space-y-4 flex-1">
             <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Simulated Client Identity</label>
                <input 
                   value={targetId} onChange={e => setTargetId(e.target.value)}
                   className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Endpoint</label>
                <input 
                   value={endpoint} onChange={e => setEndpoint(e.target.value)}
                   className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
             </div>

             <div className="pt-4 border-t border-[#2D333D] mt-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Manual Burst</h3>
                 <div className="flex gap-3 items-end">
                     <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Count</label>
                        <input 
                          type="number" value={count} onChange={e => setCount(Number(e.target.value))}
                          className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                     </div>
                     <button 
                        onClick={handleShoot}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium transition"
                     >
                         Fire Burst
                     </button>
                 </div>
             </div>

             <div className="pt-4 border-t border-[#2D333D]">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Auto-Fire Loop</h3>
                 <div className="flex gap-3 items-end">
                     <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Interval (ms)</label>
                        <input 
                          type="number" value={intervalMs} onChange={e => setIntervalMs(Number(e.target.value))}
                          className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                     </div>
                     <button 
                        onClick={() => setAutoFire(!autoFire)}
                        className={cn(
                            "px-4 py-1.5 rounded text-sm font-medium transition",
                            autoFire ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30" : "bg-slate-800 text-white hover:bg-slate-700 border border-[#2D333D]"
                        )}
                     >
                         {autoFire ? 'Stop Engine' : 'Start Engine'}
                     </button>
                 </div>
             </div>
         </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#0F1117] border border-[#2D333D] rounded-xl overflow-hidden flex flex-col relative h-[500px] lg:h-auto">
          <div className="h-8 bg-[#1A1D24] border-b border-[#2D333D] flex items-center px-4 gap-2 sticky top-0 shrink-0">
             <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
             </div>
             <div className="mx-auto text-[10px] font-mono text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                 Live Feed Log
             </div>
          </div>
          
          <div className="flex-1 overflow-auto p-3 font-mono text-[10px] space-y-1.5 leading-tight">
              {logs.map((log, i) => (
                  <div key={log.id + i} className="flex gap-2">
                      <span className="text-slate-500 shrink-0">[{new Date().toISOString().split('T')[1].slice(0, 12)}]</span>
                      <span className={cn(
                          "shrink-0 w-12 font-bold uppercase",
                          log.accepted ? "text-emerald-400" : "text-red-400"
                      )}>
                          {log.accepted ? 'ALLOW' : 'BLOCK'}
                      </span>
                      <span className="text-slate-300">
                          {log.accepted 
                             ? `Served in ${log.headers['x-time-of-flight'] || log.time + 'ms'}` 
                             : `429: Rate Limit Exceeded (Rule: ${log.headers['x-ratelimit-ruleid']})`}
                      </span>
                  </div>
              ))}
              <div ref={logsEndRef} />
          </div>
          
          <div className="absolute top-10 right-4 text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
             Events: {logs.length}
          </div>
      </div>
    </div>
  );
}
