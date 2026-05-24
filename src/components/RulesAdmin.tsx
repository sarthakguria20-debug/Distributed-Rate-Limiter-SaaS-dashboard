import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { RateLimitRule, Algorithm } from '../types';
import { cn } from './Layout';

export function RulesAdmin() {
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [targetId, setTargetId] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('token_bucket');
  const [limit, setLimit] = useState<number>(100);
  const [windowMs, setWindowMs] = useState<number>(60000);
  const [refillRate, setRefillRate] = useState<number>(50);

  const fetchRules = async () => setRules(await api.getRules());

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.saveRule({ targetId, algorithm, limit, windowMs, refillRate });
    setIsAdding(false);
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    await api.deleteRule(id);
    fetchRules();
  };

  return (
    <div className="flex flex-col flex-1 h-full">
        <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Active Rate Policies</h2>
            {!isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="text-xs px-3 py-1 bg-blue-600 text-white font-medium rounded hover:bg-blue-500 transition"
                >
                    + New Policy
                </button>
            )}
        </div>

        {isAdding && (
            <div className="bg-[#1A1D24] border border-[#2D333D] rounded-xl p-4 shadow-2xl relative overflow-hidden shrink-0 mb-4">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 ml-2">Create New Policy</h3>
                <form onSubmit={handleSave} className="space-y-4 ml-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Target Identity</label>
                            <input 
                                required
                                placeholder="e.g., 'global', 'apikey_pro'"
                                value={targetId}
                                onChange={e => setTargetId(e.target.value)}
                                className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Algorithm</label>
                            <select 
                                value={algorithm}
                                onChange={e => setAlgorithm(e.target.value as Algorithm)}
                                className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="token_bucket">Token Bucket</option>
                                <option value="sliding_window_log">Sliding Window Log</option>
                                <option value="fixed_window">Fixed Window Counter</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Burst (Limit)</label>
                            <input 
                                required type="number" value={limit} onChange={e => setLimit(Number(e.target.value))}
                                className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                            />
                        </div>
                        {algorithm !== 'token_bucket' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Window (ms)</label>
                                <input 
                                    required type="number" value={windowMs} onChange={e => setWindowMs(Number(e.target.value))}
                                    className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                        )}
                        {algorithm === 'token_bucket' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Refill (tokens/sec)</label>
                                <input 
                                    required type="number" value={refillRate} onChange={e => setRefillRate(Number(e.target.value))}
                                    className="w-full bg-[#0F1117] border border-[#2D333D] rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition rounded">Cancel</button>
                        <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-medium text-xs rounded hover:bg-blue-500 transition">Deploy</button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-[#1A1D24] rounded-xl border border-[#2D333D] overflow-hidden flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
             <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#0F1117] border-b border-[#2D333D] sticky top-0">
                      <th className="px-4 py-3 font-medium text-slate-400 text-xs">POLICY NAME</th>
                      <th className="px-4 py-3 font-medium text-slate-400 text-xs">ALGORITHM</th>
                      <th className="px-4 py-3 font-medium text-slate-400 text-xs">LIMIT</th>
                      <th className="px-4 py-3 font-medium text-slate-400 text-xs">STATUS</th>
                      <th className="px-4 py-3 font-medium text-slate-400 text-xs text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                    {rules.map(rule => (
                         <tr key={rule.id} className="border-b border-[#2D333D] hover:bg-slate-800/30 text-slate-300">
                              <td className="px-4 py-4 font-sans text-sm font-semibold">{rule.targetId}</td>
                              <td className="px-4 py-4">
                                  <span className={cn(
                                      "px-2 py-0.5 rounded border",
                                      rule.algorithm === 'token_bucket' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                      rule.algorithm === 'sliding_window_log' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                                      "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                  )}>
                                      {rule.algorithm.replace(/_/g, ' ')}
                                  </span>
                              </td>
                              <td className="px-4 py-4">
                                  {rule.limit}/{rule.algorithm === 'token_bucket' ? 'sec' : 'window'}
                                  {rule.algorithm === 'token_bucket' ? ` (Refill: ${rule.refillRate})` : ` (${rule.windowMs}ms)`}
                              </td>
                              <td className="px-4 py-4"><span className="text-emerald-500">Active</span></td>
                              <td className="px-4 py-4 text-right">
                                  <button onClick={() => handleDelete(rule.id)} className="text-xs text-slate-500 hover:text-red-400 transition">Delete</button>
                              </td>
                         </tr>
                    ))}
                    {rules.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500 font-sans text-sm">No active limit rules found.</td>
                        </tr>
                    )}
                </tbody>
             </table>
          </div>
        </div>
    </div>
  );
}
