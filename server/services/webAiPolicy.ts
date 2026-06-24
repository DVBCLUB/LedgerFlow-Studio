export type WebAIPageErrorCode = 'quota' | 'platform_error';

const QUOTA_PATTERNS = [
  /you(?:'ve| have) reached (?:the|your) .*limit/i,
  /rate limit exceeded/i,
  /too many requests/i,
  /quota exceeded/i,
  /limit reached.*try again/i,
  /het luot/i,
  /dat gioi han/i,
];

const PLATFORM_ERROR_PATTERNS = [
  /something went wrong/i,
  /network error/i,
  /server error/i,
  /could not generate/i,
  /unable to generate/i,
];

export function classifyWebAIPageText(text: string): WebAIPageErrorCode | null {
  if (QUOTA_PATTERNS.some((pattern) => pattern.test(text))) return 'quota';
  if (PLATFORM_ERROR_PATTERNS.some((pattern) => pattern.test(text))) return 'platform_error';
  return null;
}

export function parseQuotaResetTime(text: string): string {
  // Check for patterns like "try again after 4:15 PM" or "try again at 12:30"
  const timeRegex = /try again (?:after|at) (\d{1,2}:\d{2}\s*(?:pm|am)?)/i;
  const matchTime = text.match(timeRegex);
  if (matchTime && matchTime[1]) {
    const timeStr = matchTime[1];
    const now = new Date();
    const hhMm = timeStr.match(/(\d{1,2}):(\d{2})\s*(pm|am)?/i);
    if (hhMm) {
      let hh = parseInt(hhMm[1], 10);
      const mm = parseInt(hhMm[2], 10);
      const ampm = hhMm[3]?.toLowerCase();
      if (ampm === 'pm' && hh < 12) hh += 12;
      if (ampm === 'am' && hh === 12) hh = 0;
      
      const resetDate = new Date();
      resetDate.setHours(hh, mm, 0, 0);
      if (resetDate.getTime() <= now.getTime()) {
        resetDate.setDate(resetDate.getDate() + 1);
      }
      return resetDate.toISOString();
    }
  }

  // Check for patterns like "try again in 2 hours" or "try again in 15 minutes"
  const durationRegex = /try again in (\d+)\s*(hour|minute|sec)/i;
  const matchDuration = text.match(durationRegex);
  if (matchDuration && matchDuration[1]) {
    const val = parseInt(matchDuration[1], 10);
    const unit = matchDuration[2].toLowerCase();
    const msToAdd = unit.startsWith('hour') ? val * 60 * 60 * 1000 : val * 60 * 1000;
    return new Date(Date.now() + msToAdd).toISOString();
  }

  // Default fallback: 1 hour from now
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

