import { useEffect, useState } from 'react';
import { api } from '../api';
import { TimeSeriesData, RequestLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from './Layout';

export function Dashboard() {
  const [stats, setStats] = useState<TimeSeriesData[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setStats(await api.getStats());
      setLogs(await api.getLogs());
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalAccepted = stats.reduce((acc, curr) => acc + curr.accepted, 0);
  const totalRejected = stats.reduce((acc, curr) => acc + curr.rejected, 0);
  const throughput = stats.length > 0 ? ((stats[stats.length - 1].accepted + stats[stats.length - 1].rejected) / 10).toFixed(1) : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-[#1A1D24] p-4 rounded-xl border border-[#2D333D]">
          <div className="text-xs text-slate-400 mb-1">Total Throughput</div>
          <div className="text-2xl font-mono font-bold">{throughput} <span className="text-sm font-normal text-slate-500">req/s</span></div>
        </div>
        <div className="bg-[#1A1D24] p-4 rounded-xl border border-[#2D333D]">
          <div className="text-xs text-slate-400 mb-1">Accepted Requests</div>
          <div className="text-2xl font-mono font-bold text-emerald-400">{totalAccepted}</div>
        </div>
        <div className="bg-[#1A1D24] p-4 rounded-xl border border-[#2D333D]">
          <div className="text-xs text-slate-400 mb-1">Rate Limited (429)</div>
          <div className="text-2xl font-mono font-bold text-red-400">{totalRejected}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden min-h-[400px]">
        <div className="col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Real-time Traffic Over 1 Min</h2>
          </div>
          <div className="bg-[#1A1D24] rounded-xl border border-[#2D333D] overflow-hidden flex-1 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                      <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D333D" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={40} />
                  <Tooltip 
                      contentStyle={{ backgroundColor: '#0F1117', borderColor: '#2D333D', color: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                   />
                  <Area type="monotone" dataKey="accepted" stroke="#10b981" fillOpacity={1} fill="url(#colorAccepted)" strokeWidth={2} name="200 OK" />
                  <Area type="monotone" dataKey="rejected" stroke="#f87171" fillOpacity={1} fill="url(#colorRejected)" strokeWidth={2} name="429 Denied" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col h-full max-h-[800px]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Live Intercepts</h2>
          <div className="bg-black/40 rounded-xl border border-[#2D333D] flex-1 font-mono text-[10px] p-3 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center mt-8 p-4">No traffic yet. Send requests from the Playground.</p>
            ) : (
                <div className="space-y-2 opacity-80 flex flex-col">
                  {logs.slice(0, 50).map(log => (
                    <div key={log.id} className="flex gap-2">
                        <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                        {log.accepted ? (
                             <>
                                 <span className="text-emerald-400 uppercase font-bold w-10 shrink-0">ALLOW</span>
                                 <span className="text-slate-300 min-w-0 truncate">{log.clientId}</span>
                                 <span className="text-slate-500 shrink-0">{'->'} {log.endpoint}</span>
                             </>
                        ) : (
                             <>
                                 <span className="text-red-400 uppercase font-bold w-10 shrink-0">BLOCK</span>
                                 <span className="text-slate-300 min-w-0 truncate">{log.clientId}</span>
                                 <span className="text-red-500/70 shrink-0">{'->'} 429 Limit</span>
                             </>
                        )}
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
