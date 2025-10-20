// Enhanced rate limiter for API-Sports free tier constraints
export class ApiRateLimiter {
  private dailyCallCount = 0;
  private minuteCallCount = 0;
  private lastResetDate = new Date().toDateString();
  private minuteResetTime = Date.now();
  
  private readonly MAX_DAILY_CALLS = 95; // Buffer for safety
  private readonly MAX_MINUTE_CALLS = 9;  // Buffer for safety  
  private readonly MINUTE_WINDOW = 60 * 1000; // 60 seconds

  async waitIfNeeded(): Promise<void> {
    // Reset counters if needed
    this.resetCountersIfNeeded();
    
    // Check daily limit
    if (this.dailyCallCount >= this.MAX_DAILY_CALLS) {
      throw new Error(`Daily API limit reached (${this.MAX_DAILY_CALLS} calls). Try again tomorrow.`);
    }
    
    // Check minute limit and wait if needed
    if (this.minuteCallCount >= this.MAX_MINUTE_CALLS) {
      const timeToWait = this.MINUTE_WINDOW - (Date.now() - this.minuteResetTime);
      if (timeToWait > 0) {
        console.log(`⏳ Rate limit: waiting ${Math.ceil(timeToWait / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, timeToWait + 1000)); // Extra second for safety
        this.resetMinuteCounter();
      }
    }
  }
  
  recordCall(): void {
    this.resetCountersIfNeeded();
    this.dailyCallCount++;
    this.minuteCallCount++;
    
    console.log(`📡 API Call: ${this.minuteCallCount}/${this.MAX_MINUTE_CALLS} this minute, ${this.dailyCallCount}/${this.MAX_DAILY_CALLS} today`);
  }
  
  private resetCountersIfNeeded(): void {
    // Reset daily counter
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCallCount = 0;
      this.lastResetDate = today;
      console.log('🌅 New day detected - daily counter reset');
    }
    
    // Reset minute counter
    const now = Date.now();
    if (now - this.minuteResetTime >= this.MINUTE_WINDOW) {
      this.resetMinuteCounter();
    }
  }
  
  private resetMinuteCounter(): void {
    this.minuteCallCount = 0;
    this.minuteResetTime = Date.now();
  }
  
  getRemainingCalls(): { daily: number; minute: number } {
    this.resetCountersIfNeeded();
    return {
      daily: this.MAX_DAILY_CALLS - this.dailyCallCount,
      minute: this.MAX_MINUTE_CALLS - this.minuteCallCount
    };
  }
  
  canMakeCall(): boolean {
    this.resetCountersIfNeeded();
    return this.dailyCallCount < this.MAX_DAILY_CALLS && 
           this.minuteCallCount < this.MAX_MINUTE_CALLS;
  }
}

// Global rate limiter instance
export const rateLimiter = new ApiRateLimiter();