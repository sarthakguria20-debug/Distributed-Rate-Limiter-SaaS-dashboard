import { RateLimitRule, RequestLog, TimeSeriesData } from './types';

const API_BASE = '/api';

export const api = {
  getRules: async (): Promise<RateLimitRule[]> => {
    const res = await fetch(`${API_BASE}/rules`);
    return res.json();
  },
  saveRule: async (rule: Partial<RateLimitRule>): Promise<RateLimitRule> => {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    return res.json();
  },
  deleteRule: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/rules/${id}`, { method: 'DELETE' });
  },
  getLogs: async (): Promise<RequestLog[]> => {
    const res = await fetch(`${API_BASE}/logs`);
    return res.json();
  },
  getStats: async (): Promise<TimeSeriesData[]> => {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },
  sendTestRequest: async (clientId: string, endpoint: string) => {
    const res = await fetch(`${API_BASE}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, endpoint })
    });
    const data = await res.json();
    return { status: res.status, data, headers: Object.fromEntries(res.headers.entries()) };
  }
};
