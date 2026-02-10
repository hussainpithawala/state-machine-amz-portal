'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    History,
    FileJson,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Play,
    Pause,
    RotateCcw
} from 'lucide-react';
import { Execution, StateHistoryEntry } from '@/types/database';
import { formatDate, formatDuration, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface ExecutionDetail {
    execution: Execution;
    stateHistory: StateHistoryEntry[];
    summary: {
        succeeded: number;
        failed: number;
        retrying: number;
        waiting: number;
    };
    totalStates: number;
    totalDuration: number | null;
}

export default function ExecutionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const executionId = params.executionId as string;

    const [executionDetail, setExecutionDetail] = useState<ExecutionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('timeline');

    useEffect(() => {
        fetchExecutionDetail();
    }, [executionId]);

    const fetchExecutionDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            // First get the execution details
            const executionResponse = await fetch(`/api/executions?executionId=${encodeURIComponent(executionId)}`);

            if (!executionResponse.ok) {
                throw new Error('Execution not found');
            }

            const execution: Execution = await executionResponse.json();

            // Then get state history
            const historyResponse = await fetch(
                `/api/state-history?executionId=${encodeURIComponent(executionId)})}`
            );

            if (!historyResponse.ok) {
                const errorData = await historyResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch state history');
            }

            const historyData = await historyResponse.json();

            setExecutionDetail({
                execution,
                stateHistory: historyData.states,
                summary: historyData.summary,
                totalStates: historyData.totalStates,
                totalDuration: historyData.totalDuration,
            });
        } catch (err) {
            console.error('Error fetching execution detail:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async () => {
        // TODO: Implement retry logic
        alert('Retry functionality would be implemented here');
    };

    const handleCancel = async () => {
        // TODO: Implement cancel logic
        alert('Cancel functionality would be implemented here');
    };

    if (loading) {
        return <ExecutionDetailSkeleton />;
    }

    if (error || !executionDetail) {
        return (
            <div className="max-w-4xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-center text-2xl">Error</CardTitle>
                        <CardDescription className="text-center">
                            {error || 'Execution not found'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/executions">
                                View All Executions
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { execution, stateHistory, summary, totalDuration } = executionDetail;
    const isRunning = execution.status === 'RUNNING';
    const hasFailed = execution.status === 'FAILED';

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <History className="h-8 w-8 mr-3 text-blue-500" />
                            Execution Details
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center">
                            <FileJson className="h-4 w-4 mr-2" />
                            {execution.executionId}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {isRunning && (
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                            <Pause className="h-4 w-4 mr-1" />
                            Cancel
                        </Button>
                    )}
                    {hasFailed && (
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Retry
                        </Button>
                    )}
                    <Badge className={getStatusColor(execution.status)}>
                        {execution.status.replace('_', ' ')}
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">State Machine</CardTitle>
                        <History className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{execution.name}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Duration</CardTitle>
                        <Clock className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalDuration ? `${(totalDuration / 1000).toFixed(2)}s` : 'N/A'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">States</CardTitle>
                        <FileJson className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stateHistory.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Started</CardTitle>
                        <Clock className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-sm">
                            {formatDate(execution.startTime)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Succeeded" count={summary.succeeded} icon={CheckCircle2} color="text-green-500" />
                <SummaryCard title="Failed" count={summary.failed} icon={XCircle} color="text-red-500" />
                <SummaryCard title="Retrying" count={summary.retrying} icon={RotateCcw} color="text-yellow-500" />
                <SummaryCard title="Waiting" count={summary.waiting} icon={Clock} color="text-blue-500" />
            </div>

            {/* Tabs */}
            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="timeline">
                                <History className="h-4 w-4 mr-2" />
                                Timeline
                            </TabsTrigger>
                            <TabsTrigger value="input">
                                <FileJson className="h-4 w-4 mr-2" />
                                Input
                            </TabsTrigger>
                            <TabsTrigger value="output">
                                <FileJson className="h-4 w-4 mr-2" />
                                Output
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    {activeTab === 'timeline' ? (
                        <StateTimeline states={stateHistory} />
                    ) : activeTab === 'input' ? (
                        <JsonViewer data={execution.input} />
                    ) : (
                        <JsonViewer data={execution.output} />
                    )}
                </CardContent>
            </Card>

            {/* Error Details (if any) */}
            {execution.error && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-600">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Error Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
            <pre className="bg-red-50 p-4 rounded-lg text-sm text-red-800 overflow-x-auto">
              {execution.error}
            </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function SummaryCard({ title, count, icon: Icon, color }: {
    title: string;
    count: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count}</div>
            </CardContent>
        </Card>
    )}

function StateTimeline({ states }: { states: StateHistoryEntry[] }) {
    if (states.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No state history available
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {states.map((state, index) => {
                const isLast = index === states.length - 1;
                const duration = state.endTime
                    ? formatDuration(state.startTime, state.endTime)
                    : 'Running...';

                return (
                    <div key={`${state.id}-${state.startTime}`} className="relative">
                        {!isLast && (
                            <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                        )}
                        <div className="flex items-start space-x-4">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                state.status === 'SUCCEEDED' ? 'bg-green-100 text-green-600' :
                                    state.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                                        state.status === 'RUNNING' ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-600'
                            }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900">{state.stateName}</h3>
                                    <Badge className={getStatusColor(state.status)}>
                                        {state.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Type: {state.stateType} • Duration: {duration}
                                </p>
                                {state.retryCount > 0 && (
                                    <p className="text-sm text-yellow-600 mt-1">
                                        Retried {state.retryCount} time{state.retryCount !== 1 ? 's' : ''}
                                    </p>
                                )}
                                {state.error && (
                                    <p className="text-sm text-red-600 mt-1">
                                        Error: {state.error.substring(0, 100)}...
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Started: {formatDate(state.startTime)}
                                    {state.endTime && ` • Ended: ${formatDate(state.endTime)}`}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function JsonViewer({ data }: { data?: Record<string, any> }) {
    if (!data) {
        return (
            <div className="text-center py-8 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-[600px]">
      <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
        </div>
    );
}

function ExecutionDetailSkeleton() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-24" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border p-6">
                        <Skeleton className="h-4 w-24 mb-4" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border p-6">
                        <Skeleton className="h-4 w-24 mb-4" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg border">
                <div className="border-b p-4">
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="p-4">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
}
