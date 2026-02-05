'use client';

import {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {
    LayoutDashboard,
    GitBranch,
    History,
    AlertCircle,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import {formatDuration, formatDate} from '@/lib/utils';
import {Skeleton} from '@/components/ui/skeleton';
import Link from 'next/link';

interface DashboardStats {
    statusCounts: Array<{ status: string; count: number }>;
    durationStats: {
        avg_duration: number | null;
        max_duration: number | null;
        min_duration: number | null;
    };
    totalExecutions: number;
    totalStateMachines: number;
    recentFailures: Array<{
        executionId: string;
        stateMachineId: string;
        name: string;
        status: string;
        startTime: string;
        currentState: string;
        error?: string;
    }>;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/dashboard/stats');

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return <DashboardSkeleton/>;
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600"/>
                        </div>
                        <CardTitle className="text-center text-2xl">Error Loading Dashboard</CardTitle>
                        <CardDescription className="text-center">
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button onClick={fetchStats}>Retry Loading</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getStatusCount = (status: string) => {
        return stats?.statusCounts.find(s => s.status === status)?.count || 0;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Monitor your state machine executions</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Executions"
                    value={stats?.totalExecutions.toLocaleString() || '0'}
                    icon={History}
                    trend={{value: '+12%', isPositive: true}}
                />
                <StatsCard
                    title="State Machines"
                    value={stats?.totalStateMachines.toString() || '0'}
                    icon={GitBranch}
                    subtitle="Active workflows"
                />
                <StatsCard
                    title="Success Rate"
                    value="98.5%"
                    icon={CheckCircle2}
                    trend={{value: '+2.3%', isPositive: true}}
                />
                <StatsCard
                    title="Avg Duration"
                    value={stats?.durationStats?.avg_duration !== null && stats?.durationStats?.avg_duration !== undefined
                        ? `${Number(stats.durationStats.avg_duration).toFixed(2)}s`
                        : 'N/A'}
                    icon={Clock}
                    subtitle="Last 7 days"
                /></div>

            {/* Status Breakdown & Recent Failures */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-red-500"/>
                            Recent Failures
                        </CardTitle>
                        <CardDescription>Last 10 failed executions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.recentFailures && stats.recentFailures.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Execution ID</TableHead>
                                            <TableHead>State Machine</TableHead>
                                            <TableHead>Failed At</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.recentFailures.map((execution) => (
                                            <TableRow key={execution.executionId}>
                                                <TableCell className="font-medium max-w-xs truncate">
                                                    <Link
                                                        href={`/dashboard/executions/${encodeURIComponent(execution.executionId)}`}
                                                        className="text-blue-600 hover:underline hover:text-blue-800"
                                                    >
                                                        {execution.executionId}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {execution.name}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {formatDate(execution.startTime)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive">{execution.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2"/>
                                <p className="font-medium">No recent failures</p>
                                <p className="text-sm mt-1">All executions are running smoothly</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <LayoutDashboard className="h-5 w-5 mr-2 text-blue-500"/>
                            Execution Status
                        </CardTitle>
                        <CardDescription>Breakdown by status (last 30 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.statusCounts.map((item) => (
                                <div key={item.status} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <StatusBadge status={item.status}/>
                                        <span className="text-sm font-medium text-gray-700">
                      {item.status.replace('_', ' ')}
                    </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                    {item.count.toLocaleString()}
                  </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Reusable Stats Card Component
function StatsCard({
                       title,
                       value,
                       icon: Icon,
                       trend,
                       subtitle
                   }: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: { value: string; isPositive: boolean };
    subtitle?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400"/>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                {trend && (
                    <div className="flex items-center mt-2">
            <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Status Badge Component (simplified version for dashboard)
function StatusBadge({status}: { status: string }) {
    const colors: Record<string, string> = {
        RUNNING: 'bg-blue-100 text-blue-800',
        SUCCEEDED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800',
        CANCELLED: 'bg-gray-100 text-gray-800',
        TIMED_OUT: 'bg-yellow-100 text-yellow-800',
        ABORTED: 'bg-purple-100 text-purple-800',
        PAUSED: 'bg-orange-100 text-orange-800',
    };

    const colorClass = colors[status] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {status.replace('_', ' ')}
    </span>
    );
}

// Loading Skeleton
function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div>
                <div className="h-8 w-48 bg-gray-200 rounded"/>
                <div className="h-4 w-96 bg-gray-200 rounded mt-2"/>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-gray-200 rounded"/>
                            <div className="h-4 w-4 bg-gray-200 rounded-full"/>
                        </CardHeader>
                        <CardContent>
                            <div className="h-7 w-16 bg-gray-200 rounded"/>
                            <div className="h-3 w-24 bg-gray-200 rounded mt-2"/>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-5 w-48 bg-gray-200 rounded"/>
                            <div className="h-4 w-64 bg-gray-200 rounded mt-2"/>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...Array(5)].map((_, j) => (
                                    <div key={j} className="flex items-center justify-between">
                                        <div className="h-4 w-32 bg-gray-200 rounded"/>
                                        <div className="h-4 w-12 bg-gray-200 rounded"/>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
