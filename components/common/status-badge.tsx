import { cn } from '@/lib/utils';
import { ExecutionStatus, StateHistoryStatus } from '@/types/database';

interface StatusBadgeProps {
    status: ExecutionStatus | StateHistoryStatus;
    size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
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

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const colorClass = statusColors[status] || statusColors.RUNNING;

    return (
        <span className={cn(
            'inline-flex items-center rounded-full border font-medium',
            size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
            colorClass
        )}>
      {status.replace('_', ' ')}
    </span>
    );
}
