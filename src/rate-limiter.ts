import { Algorithm, RateLimitRule, RequestLog, TimeSeriesData } from './types';

// Abstract base class for rate limiters
abstract class RateLimiter {
  abstract allow(): boolean;
}

// 1. Token Bucket
class TokenBucket extends RateLimiter {
  private capacity: number;
  private tokens: number;
  private fillRate: number; // Tokens per ms
  private lastRefill: number;

  constructor(capacity: number, refillRatePerSec: number) {
    super();
    this.capacity = capacity;
    this.tokens = capacity;
    this.fillRate = refillRatePerSec / 1000;
    this.lastRefill = Date.now();
  }

  allow(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    // Refill tokens
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.fillRate);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

// 2. Sliding Window Log
class SlidingWindowLog extends RateLimiter {
  private limit: number;
  private windowMs: number;
  private logs: number[];

  constructor(limit: number, windowMs: number) {
    super();
    this.limit = limit;
    this.windowMs = windowMs;
    this.logs = [];
  }

  allow(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old logs
    this.logs = this.logs.filter((timestamp) => timestamp > windowStart);

    if (this.logs.length < this.limit) {
      this.logs.push(now);
      return true;
    }
    return false;
  }
}

// 3. Fixed Window Counter
class FixedWindowCounter extends RateLimiter {
  private limit: number;
  private windowMs: number;
  private count: number;
  private windowStart: number;

  constructor(limit: number, windowMs: number) {
    super();
    this.limit = limit;
    this.windowMs = windowMs;
    this.count = 0;
    this.windowStart = Date.now();
  }

  allow(): boolean {
    const now = Date.now();
    
    // Reset window
    if (now - this.windowStart > this.windowMs) {
      this.windowStart = now;
      this.count = 0;
    }

    if (this.count < this.limit) {
      this.count++;
      return true;
    }
    return false;
  }
}

export class RuleManager {
  private rules: Map<string, RateLimitRule> = new Map();
  private limiters: Map<string, RateLimiter> = new Map();
  private logs: RequestLog[] = [];
  private readonly MAX_LOGS = 500;

  constructor() {
    // Seed some initial demo rules
    this.setRule({
      id: 'rule_1',
      targetId: 'global',
      algorithm: 'token_bucket',
      limit: 10,
      windowMs: 1000,
      refillRate: 5
    });
    
    this.setRule({
      id: 'rule_2',
      targetId: 'apikey_free_tier',
      algorithm: 'sliding_window_log',
      limit: 5,
      windowMs: 5000
    });
  }

  getRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  setRule(rule: RateLimitRule): RateLimitRule {
    const newRule = { ...rule, id: rule.id || `rule_${Date.now()}` };
    this.rules.set(newRule.id, newRule);
    
    // Invalidate old limiters for this target
    for (const key of Array.from(this.limiters.keys())) {
      if (key.startsWith(`${newRule.targetId}:`)) {
        this.limiters.delete(key);
      }
    }
    
    return newRule;
  }

  deleteRule(id: string) {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.delete(id);
      for (const key of Array.from(this.limiters.keys())) {
        if (key.startsWith(`${rule.targetId}:`)) {
          this.limiters.delete(key);
        }
      }
    }
  }

  getLogs(): RequestLog[] {
    return [...this.logs].reverse();
  }

  getStats(): TimeSeriesData[] {
    // Group logs by 10 second intervals over the last few minutes
    const now = Date.now();
    const intervalMs = 10000; // 10 seconds
    const stats: Record<string, { accepted: number; rejected: number }> = {};
    
    // Pre-populate last 6 intervals (1 minute)
    for (let i = 0; i < 6; i++) {
        const timeKey = new Date(now - i * intervalMs).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
        stats[timeKey] = { accepted: 0, rejected: 0 };
    }

    this.logs.forEach(log => {
        if (now - log.timestamp < 60000) { // Only last minute
             // align to 10s buckets
             const bucketTime = log.timestamp - (log.timestamp % intervalMs);
             const timeKey = new Date(bucketTime).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
             if (stats[timeKey]) {
                if (log.accepted) stats[timeKey].accepted++;
                else stats[timeKey].rejected++;
             }
        }
    });

    return Object.keys(stats).sort().map(key => ({
        time: key,
        accepted: stats[key].accepted,
        rejected: stats[key].rejected
    }));
  }

  // Returns matched rule, state and whether it's allowed
  processRequest(clientId: string, endpoint: string): { accepted: boolean; log: RequestLog } {
    let matchedRule: RateLimitRule | undefined;
    let fallbackRule: RateLimitRule | undefined;

    // Evaluate rules to find the most specific one
    for (const rule of this.rules.values()) {
        if (rule.targetId === clientId) {
            matchedRule = rule;
            break;
        }
        if (rule.targetId === 'global') {
            fallbackRule = rule;
        }
    }

    const appliedRule = matchedRule || fallbackRule;
    let accepted = true;
    let limiterKey = '';

    if (appliedRule) {
        limiterKey = `${appliedRule.targetId}:${appliedRule.id}`;
        let limiter = this.limiters.get(limiterKey);
        
        if (!limiter) {
            if (appliedRule.algorithm === 'token_bucket') {
                limiter = new TokenBucket(appliedRule.limit, appliedRule.refillRate || appliedRule.limit);
            } else if (appliedRule.algorithm === 'sliding_window_log') {
                limiter = new SlidingWindowLog(appliedRule.limit, appliedRule.windowMs);
            } else {
                limiter = new FixedWindowCounter(appliedRule.limit, appliedRule.windowMs);
            }
            this.limiters.set(limiterKey, limiter);
        }
        
        accepted = limiter.allow();
    }

    const log: RequestLog = {
        id: `req_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        timestamp: Date.now(),
        clientId,
        endpoint,
        accepted,
        algorithmUsed: appliedRule?.algorithm || 'none' as any,
        ruleId: appliedRule?.id || 'none'
    };

    this.logs.push(log);
    if (this.logs.length > this.MAX_LOGS) {
        this.logs.shift();
    }

    return { accepted, log };
  }
}
