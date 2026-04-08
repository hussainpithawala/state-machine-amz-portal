'use client';

import {useState, useEffect, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
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
    RotateCcw,
    Hash,
    LinkIcon,
    Loader2
} from 'lucide-react';
import {Execution, StateHistoryEntry} from '@/types/database';
import {formatDate, formatDuration, getStatusColor, formatJson} from '@/lib/utils';
import Link from 'next/link';
import {Skeleton} from '@/components/ui/skeleton';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';

interface PaginationInfo {
    limit: number;
    cursor: number | null;
    nextCursor: number | null;
    hasMore: boolean;
    loadedStates: number;
}

interface LoopDetectionInfo {
    detected: boolean;
    loop: {
        startIndex: number;
        patternLength: number;
        repeatCount: number;
    } | null;
    status: 'none' | 'detected' | 'not_found';
    message: string;
}

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
    pagination: PaginationInfo;
    loopDetection: LoopDetectionInfo | null;
}

export default function ExecutionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const executionId = params.executionId as string;

    // Handle undefined executionId
    if (!executionId) {
        return (
            <div className="max-w-4xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Invalid Execution ID</CardTitle>
                        <CardDescription className="text-center">
                            No execution ID provided in the URL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
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

    const [executionDetail, setExecutionDetail] = useState<ExecutionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('timeline');
    const [resuming, setResuming] = useState(false);
    const [loopDetectionEnabled, setLoopDetectionEnabled] = useState(true);

    useEffect(() => {
        fetchExecutionDetail();
    }, [executionId]);

    const fetchExecutionDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get execution details - now returns paginated list
            const executionResponse = await fetch(`/api/executions?executionId=${encodeURIComponent(executionId)}`);

            if (!executionResponse.ok) {
                const errorData = await executionResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Execution not found');
            }

            const executionData = await executionResponse.json();

            // Extract execution from results array (should be only one result)
            const execution = executionData.results?.[0];

            if (!execution) {
                throw new Error('Execution not found');
            }

            // Get state history using ONLY executionId with pagination
            const historyResponse = await fetch(
                `/api/state-history?executionId=${encodeURIComponent(executionId)}&limit=100&detectLoop=true`
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
                pagination: historyData.pagination,
                loopDetection: historyData.loopDetection,
            });
        } catch (err) {
            console.error('Error fetching execution detail:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreStates = useCallback(async () => {
        if (!executionDetail || !executionDetail.pagination.hasMore || loadingMore) {
            return;
        }

        // If loop was detected in first page, skip loading more unless explicitly requested
        if (executionDetail.loopDetection?.detected && loopDetectionEnabled) {
            return;
        }

        try {
            setLoadingMore(true);

            const historyResponse = await fetch(
                `/api/state-history?executionId=${encodeURIComponent(executionId)}&limit=100&cursor=${executionDetail.pagination.nextCursor}&detectLoop=false`
            );

            if (!historyResponse.ok) {
                const errorData = await historyResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch more state history');
            }

            const historyData = await historyResponse.json();

            setExecutionDetail(prev => {
                if (!prev) return prev;
                
                return {
                    ...prev,
                    stateHistory: [...prev.stateHistory, ...historyData.states],
                    pagination: historyData.pagination,
                };
            });
        } catch (err) {
            console.error('Error loading more state history:', err);
            alert('Failed to load more state history');
        } finally {
            setLoadingMore(false);
        }
    }, [executionDetail, executionId, loadingMore, loopDetectionEnabled]);

    const handleRetry = async () => {
        // TODO: Implement retry logic
        alert('Retry functionality would be implemented here');
    };

    const handleCancel = async () => {
        // TODO: Implement cancel logic
        alert('Cancel functionality would be implemented here');
    };

    const handleRestart = async () => {
        // TODO: Implement restart logic
        alert('Restart functionality would be implemented here');
    };

    const handleResume = async () => {
        try {
            setResuming(true);
            const response = await fetch(`/api/executions/${encodeURIComponent(executionId)}/resume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to resume execution');
            }

            await fetchExecutionDetail();
            alert('Execution resumed successfully');
        } catch (err) {
            console.error('Error resuming execution:', err);
            alert(err instanceof Error ? err.message : 'Failed to resume execution');
        } finally {
            setResuming(false);
        }
    };

    if (loading) {
        return <ExecutionDetailSkeleton/>;
    }

    if (error || !executionDetail) {
        return (
            <div className="max-w-4xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <XCircle className="h-8 w-8 text-red-600"/>
                        </div>
                        <CardTitle className="text-center text-2xl">Error</CardTitle>
                        <CardDescription className="text-center">
                            {error || 'Execution not found'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2"/>
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

    const {execution, stateHistory, summary} = executionDetail;
    
    // Calculate total duration from loaded state history
    const totalDuration = stateHistory.length > 0
        ? (() => {
            const firstState = stateHistory[0];
            const lastState = stateHistory[stateHistory.length - 1];
            if (lastState.endTime && firstState.startTime) {
                return new Date(lastState.endTime).getTime() - new Date(firstState.startTime).getTime();
            }
            return null;
        })()
        : null;
    
    const isRunning = execution.status === 'RUNNING';
    const hasFailed = execution.status === 'FAILED';
    const hasSucceeded = execution.status === 'SUCCEEDED';
    const isPaused = execution.status === 'PAUSED';

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <History className="h-8 w-8 mr-3 text-blue-500"/>
                            Execution Details
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center">
                            <Hash className="h-4 w-4 mr-2"/>
                            {execution.executionId}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {isRunning && (
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                            <Pause className="h-4 w-4 mr-1"/>
                            Cancel
                        </Button>
                    )}
                    {hasFailed && (
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                            <RotateCcw className="h-4 w-4 mr-1"/>
                            Retry
                        </Button>
                    )}
                    {hasSucceeded && (
                        <Button variant="outline" size="sm" onClick={handleRestart}>
                            <Play className="h-4 w-4 mr-1"/>
                            Restart
                        </Button>
                    )}
                    <Badge className={getStatusColor(execution.status || 'RUNNING')}>
                        {execution.status ? execution.status.replace('_', ' ') : 'Unknown'}
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">State Machine</CardTitle>
                        <History className="h-4 w-4 text-gray-400"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-s font-bold">{execution.name}</div>
                        <Link
                            href={`/dashboard/state-machines/${encodeURIComponent(execution.stateMachineId)}`}
                            className="text-xs text-blue-600 hover:underline flex items-center mt-1"
                        >
                            <LinkIcon className="h-3 w-3 mr-1"/>
                            View State Machine
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Duration</CardTitle>
                        <Clock className="h-4 w-4 text-gray-400"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalDuration ? `${(totalDuration).toFixed(2)} ms` : 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {execution.endTime
                                ? `${formatDate(execution.startTime)} → ${formatDate(execution.endTime)}`
                                : `Started: ${formatDate(execution.startTime)}`
                            }
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">States</CardTitle>
                        <FileJson className="h-4 w-4 text-gray-400"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stateHistory.length}</div>
                        <p className="text-xs text-gray-500 mt-1">Total state transitions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Current State</CardTitle>
                        <Play className="h-4 w-4 text-gray-400"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-sm">{execution.currentState}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Succeeded" count={summary.succeeded} icon={CheckCircle2} color="text-green-500"/>
                <SummaryCard title="Failed" count={summary.failed} icon={XCircle} color="text-red-500"/>
                <SummaryCard title="Retrying" count={summary.retrying} icon={RotateCcw} color="text-yellow-500"/>
                <SummaryCard title="Waiting" count={summary.waiting} icon={Clock} color="text-blue-500"/>
            </div>

            {/* Paused Status Card */}
            {isPaused && (
                <Card className="border-amber-300 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-amber-900">
                            <Pause className="h-5 w-5 mr-2"/>
                            Execution Paused
                        </CardTitle>
                        <CardDescription className="text-amber-700">
                            This execution is currently in a paused state
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="h-5 w-5 text-amber-600"/>
                                <span className="text-sm font-medium text-amber-900">
                                    Current State: <code className="bg-amber-100 px-2 py-1 rounded">{execution.currentState}</code>
                                </span>
                            </div>
                            <p className="text-sm text-amber-800">
                                The execution has been paused and will not proceed until resumed. Click the button below to resume execution.
                            </p>
                            <Button 
                                onClick={handleResume} 
                                disabled={resuming}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {resuming ? (
                                    <>
                                        <RotateCcw className="h-4 w-4 mr-2 animate-spin"/>
                                        Resuming...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2"/>
                                        Resume Execution
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="timeline">
                                <History className="h-4 w-4 mr-2"/>
                                Timeline
                            </TabsTrigger>
                            <TabsTrigger value="input">
                                <FileJson className="h-4 w-4 mr-2"/>
                                Input
                            </TabsTrigger>
                            <TabsTrigger value="output">
                                <FileJson className="h-4 w-4 mr-2"/>
                                Output
                            </TabsTrigger>
                            <TabsTrigger value="metadata">
                                <FileJson className="h-4 w-4 mr-2"/>
                                Metadata
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    {activeTab === 'timeline' ? (
                        <>
                            <StateTimeline 
                                states={stateHistory}
                                totalStates={executionDetail.totalStates}
                                loadedStates={executionDetail.pagination.loadedStates}
                                hasMore={executionDetail.pagination.hasMore}
                                loopDetection={executionDetail.loopDetection}
                                onLoadMore={loadMoreStates}
                                loadingMore={loadingMore}
                            />
                            {executionDetail.pagination.hasMore && !executionDetail.loopDetection?.detected && (
                                <div className="mt-6 flex justify-center">
                                    <Button
                                        onClick={loadMoreStates}
                                        disabled={loadingMore}
                                        variant="outline"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <History className="h-4 w-4 mr-2"/>
                                                Load More States ({executionDetail.pagination.loadedStates} of {executionDetail.totalStates})
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                            {executionDetail.loopDetection?.detected && (
                                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-sm text-amber-900">
                                        <AlertCircle className="h-4 w-4 inline mr-1"/>
                                        {executionDetail.loopDetection.message}
                                    </p>
                                    <p className="text-xs text-amber-800 mt-2">
                                        Only showing first {executionDetail.pagination.loadedStates} states to optimize performance. 
                                        Total states: {executionDetail.totalStates}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : activeTab === 'input' ? (
                        <JsonViewer data={execution.input} title="Execution Input"/>
                    ) : activeTab === 'output' ? (
                        <JsonViewer data={execution.output} title="Execution Output"/>
                    ) : (
                        <JsonViewer data={execution.metadata} title="Execution Metadata"/>
                    )}
                </CardContent>
            </Card>

            {/* Error Details (if any) */}
            {execution.error && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-600">
                            <AlertCircle className="h-5 w-5 mr-2"/>
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

            {/* Correlation Data (if any) */}
            {execution.metadata?.correlationKey && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <LinkIcon className="h-5 w-5 mr-2"/>
                            Correlation Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <span className="font-medium">Correlation Key:</span>{' '}
                                <code
                                    className="bg-gray-100 px-2 py-1 rounded">{execution.metadata.correlationKey}</code>
                            </div>
                            <div>
                                <span className="font-medium">Correlation Value:</span>{' '}
                                <code className="bg-gray-100 px-2 py-1 rounded">
                                    {JSON.stringify(execution.metadata.correlationValue)}
                                </code>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function SummaryCard({title, count, icon: Icon, color}: {
    title: string;
    count: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`}/>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count}</div>
            </CardContent>
        </Card>
    )
}

function StateTimeline({
    states,
    totalStates,
    loadedStates,
    hasMore,
    loopDetection,
    onLoadMore,
    loadingMore
}: {
    states: StateHistoryEntry[];
    totalStates: number;
    loadedStates: number;
    hasMore: boolean;
    loopDetection: LoopDetectionInfo | null;
    onLoadMore: () => void;
    loadingMore: boolean;
}) {
    const detectedLoop = loopDetection?.detected ? loopDetection.loop : null;
    const [selectedLoopIndex, setSelectedLoopIndex] = useState(0);

    useEffect(() => {
        if (!detectedLoop) {
            setSelectedLoopIndex(0);
            return;
        }

        setSelectedLoopIndex((previous) => {
            if (previous < 0) return 0;
            if (previous > detectedLoop.repeatCount - 1) return detectedLoop.repeatCount - 1;
            return previous;
        });
    }, [detectedLoop?.startIndex, detectedLoop?.patternLength, detectedLoop?.repeatCount]);

    if (states.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                <p className="text-lg font-medium mb-2">No state history available</p>
                <p className="text-sm">This execution has no recorded state transitions</p>
            </div>
        );
    }

    const activeLoopIndex = detectedLoop
        ? Math.min(Math.max(selectedLoopIndex, 0), detectedLoop.repeatCount - 1)
        : 0;

    const visibleStates = detectedLoop
        ? [
            ...states.slice(0, detectedLoop.startIndex),
            ...states.slice(
                detectedLoop.startIndex + activeLoopIndex * detectedLoop.patternLength,
                detectedLoop.startIndex + (activeLoopIndex + 1) * detectedLoop.patternLength
            ),
            ...states.slice(detectedLoop.startIndex + detectedLoop.repeatCount * detectedLoop.patternLength)
        ]
        : states;

    const loopPattern = detectedLoop
        ? states
            .slice(detectedLoop.startIndex, detectedLoop.startIndex + detectedLoop.patternLength)
            .map((state) => state.stateName)
            .join(' -> ')
        : '';

    return (
        <div className="space-y-6">
            {detectedLoop && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-900">
                        Loop detected: <code className="rounded bg-amber-100 px-1 py-0.5">{loopPattern}</code> repeated{' '}
                        <span className="font-semibold">{detectedLoop.repeatCount}</span> times. Showing iteration index{' '}
                        <span className="font-semibold">{activeLoopIndex}</span> (0-based).
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label htmlFor="loop-iteration-index" className="text-xs font-medium text-amber-900">
                            Iteration Index
                        </label>
                        <Input
                            id="loop-iteration-index"
                            type="number"
                            min={0}
                            max={detectedLoop.repeatCount - 1}
                            value={activeLoopIndex}
                            onChange={(event) => {
                                const parsed = Number.parseInt(event.target.value, 10);
                                if (Number.isNaN(parsed)) {
                                    setSelectedLoopIndex(0);
                                    return;
                                }
                                setSelectedLoopIndex(
                                    Math.min(Math.max(parsed, 0), detectedLoop.repeatCount - 1)
                                );
                            }}
                            className="h-8 w-24"
                        />
                        <span className="text-xs text-amber-800">
                            Range: 0 to {detectedLoop.repeatCount - 1}
                        </span>
                    </div>
                </div>
            )}
            {visibleStates.map((state, index) => {
                const isLast = index === visibleStates.length - 1;
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
                                            state.status === 'RETRYING' ? 'bg-yellow-100 text-yellow-600' :
                                                state.status === 'WAITING' ? 'bg-sky-100 text-sky-600' :
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
                                    Type: <code className="bg-gray-100 px-1 py-0.5 rounded">{state.stateType}</code> •
                                    Duration: <span className="font-mono">{duration}</span>
                                </p>
                                {state.retryCount >= 0 && (
                                    <p className="text-sm text-yellow-600 mt-1">
                                        <RotateCcw className="h-4 w-4 inline mr-1"/>
                                        Retried {state.retryCount} time{state.retryCount !== 1 ? 's' : ''}
                                    </p>
                                )}
                                {state.error && (
                                    <Alert variant="destructive" className="mt-2">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            {state.error.length > 200 ? state.error.substring(0, 200) + '...' : state.error}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Started: {formatDate(state.startTime)}
                                    {state.endTime && ` • Ended: ${formatDate(state.endTime)}`}
                                </p>
                                {(state.input || state.output) && (
                                    <div className="mt-2 space-y-1">
                                        {state.input && (
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">Input:</span>
                                                <pre
                                                    className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-x-auto max-h-32">
                          {JSON.stringify(state.input, null, 2)}
                        </pre>
                                            </div>
                                        )}
                                        {state.output && (
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">Output:</span>
                                                <pre
                                                    className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-x-auto max-h-32">
                          {JSON.stringify(state.output, null, 2)}
                        </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function JsonViewer({data, title}: { data?: Record<string, any>; title?: string }) {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <FileJson className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                <p className="text-lg font-medium mb-2">No {title?.toLowerCase() || 'data'} available</p>
                <p className="text-sm">This execution has no {title?.toLowerCase() || 'data'} to display</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-[600px]">
      <pre className="whitespace-pre-wrap break-words">
        {formatJson(data)}
      </pre>
        </div>
    );
}

function ExecutionDetailSkeleton() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-24"/>
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64"/>
                        <Skeleton className="h-4 w-96"/>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-24"/>
                    <Skeleton className="h-10 w-24"/>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border p-6">
                        <Skeleton className="h-4 w-24 mb-4"/>
                        <Skeleton className="h-8 w-32"/>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border p-6">
                        <Skeleton className="h-4 w-24 mb-4"/>
                        <Skeleton className="h-8 w-32"/>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg border">
                <div className="border-b p-4">
                    <Skeleton className="h-10 w-full"/>
                </div>
                <div className="p-4">
                    <Skeleton className="h-64 w-full"/>
                </div>
            </div>
        </div>
    );
}
