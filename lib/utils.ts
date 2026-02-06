import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string | null | undefined): string {
  // Handle null, undefined, or empty values
  if (!date) {
    return 'N/A';
  }

  const d = typeof date === 'string' ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
/**
 * Format duration between two dates
 */
/**
 * Format duration between two dates
 */
export function formatDuration(start: Date | string | null | undefined, end?: Date | string | null | undefined): string {
  // Handle null/undefined start time
  if (!start) {
    return 'N/A';
  }

  const startTime = typeof start === 'string' ? new Date(start) : start;
  const endTime = end
      ? (typeof end === 'string' ? new Date(end) : end)
      : new Date();

  // Check if dates are valid
  if (isNaN(startTime.getTime())) {
    return 'Invalid Start Time';
  }

  const diff = endTime.getTime() - startTime.getTime();

  if (diff < 1000) return `${diff}ms`;
  if (diff < 60000) return `${Math.round(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ${Math.round((diff % 60000) / 1000)}s`;
  return `${Math.round(diff / 3600000)}h ${Math.round((diff % 3600000) / 60000)}m`;
}

/**
 * Get status color classes for badges
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
    SUCCEEDED: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    TIMED_OUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ABORTED: 'bg-purple-100 text-purple-800 border-purple-200',
    PAUSED: 'bg-orange-100 text-orange-800 border-orange-200',
    RETRYING: 'bg-amber-100 text-amber-800 border-amber-200',
    WAITING: 'bg-sky-100 text-sky-800 border-sky-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T = any>(str: string, defaultValue?: T): T | undefined {
  try {
    return JSON.parse(str) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Format JSON with syntax highlighting (for display)
 */
export function formatJson(json: any): string {
  try {
    return JSON.stringify(json, null, 2);
  } catch {
    return String(json);
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return `${Math.floor(days / 30)} months ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Copy text to clipboard
 */
export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
}

/**
 * Generate a random ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

