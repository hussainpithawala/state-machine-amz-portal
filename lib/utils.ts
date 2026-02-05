import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDuration(start: Date, end?: Date): string {
    const endTime = end || new Date();
    const diff = endTime.getTime() - start.getTime();

    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${Math.round(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m`;
    return `${Math.round(diff / 3600000)}h`;
}

export function formatDate(date: Date): string {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        RUNNING: 'bg-blue-100 text-blue-800',
        SUCCEEDED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800',
        CANCELLED: 'bg-gray-100 text-gray-800',
        TIMED_OUT: 'bg-yellow-100 text-yellow-800',
        ABORTED: 'bg-purple-100 text-purple-800',
        PAUSED: 'bg-orange-100 text-orange-800',
        RETRYING: 'bg-amber-100 text-amber-800',
        WAITING: 'bg-sky-100 text-sky-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}
