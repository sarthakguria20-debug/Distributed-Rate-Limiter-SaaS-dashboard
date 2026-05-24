export type Algorithm = 'token_bucket' | 'sliding_window_log' | 'fixed_window';

export interface RateLimitRule {
  id: string;
  targetId: string; // e.g. 'global', 'api_key_123', 'ip_1.2.3.4'
  algorithm: Algorithm;
  limit: number;
  windowMs: number; // For window-based algorithms
  refillRate?: number; // For token bucket (tokens per second)
}

export interface RequestLog {
  id: string;
  timestamp: number;
  clientId: string;
  endpoint: string;
  accepted: boolean;
  algorithmUsed: Algorithm;
  ruleId: string;
}

export interface TimeSeriesData {
  time: string;
  accepted: number;
  rejected: number;
}
