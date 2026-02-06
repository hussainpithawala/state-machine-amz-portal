'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    GitBranch,
    FileJson,
    History,
    Clock,
    CheckCircle2,
    XCircle,
    Play,
    Edit,
    Trash2,
    Copy,
    Download
} from 'lucide-react';
import { StateMachine } from '@/types/database';
import { formatDate, formatDuration, copyToClipboard, formatJson } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StateMachineDetail {
    stateMachine: StateMachine;
    executionStats: {
        total: number;
        succeeded: number;
        failed: number;
        running: number;
        successRate: number;
    };
    recentExecutions: Array<{
        executionId: string;
        name: string;
        status: string;
        startTime: string;
        endTime?: string;
        currentState: string;
        error?: string;
    }>;
}

export default function StateMachineDetailPage() {
    const params = useParams();
    const router = useRouter();
    const stateMachineId = params.id as string;

    // ✅ Add this check at the beginning
    if (!stateMachineId) {
        return (
            <div className="max-w-4xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Invalid State Machine ID</CardTitle>
                        <CardDescription className="text-center">
                            No state machine ID provided in the URL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button asChild>
                            <Link href="/dashboard/state-machines">
                                View All State Machines
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const [stateMachineDetail, setStateMachineDetail] = useState<StateMachineDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('definition');
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        fetchStateMachineDetail();
    }, [stateMachineId]);

    const fetchStateMachineDetail = async () => {
        try {
            // ✅ Add this check at the start of the function
            if (!stateMachineId) {
                throw new Error('State machine ID is required');
            }
            setLoading(true);
            setError(null);

            // Fetch state machine details
            const smResponse = await fetch(`/api/state-machines/${encodeURIComponent(stateMachineId)}`);

            if (!smResponse.ok) {
                const errorData = await smResponse.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${smResponse.status}: State machine not found`);
            }

            const stateMachine: StateMachine = await smResponse.json();

            // Fetch execution stats
            const statsResponse = await fetch(`/api/executions?stateMachineId=${encodeURIComponent(stateMachineId)}&pageSize=5`);
            const statsData = await statsResponse.json();

            const executions = statsData.results || [];
            const total = statsData.pagination?.total || 0;
            const succeeded = executions.filter((e: any) => e.status === 'SUCCEEDED').length;
            const failed = executions.filter((e: any) => e.status === 'FAILED').length;
            const running = executions.filter((e: any) => e.status === 'RUNNING').length;
            const successRate = total > 0 ? Math.round((succeeded / total) * 100) : 0;

            setStateMachineDetail({
                stateMachine,
                executionStats: {
                    total,
                    succeeded,
                    failed,
                    running,
                    successRate
                },
                recentExecutions: executions
            });
        } catch (err) {
            console.error('Error fetching state machine detail:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyDefinition = async () => {
        const definition = stateMachineDetail?.stateMachine.definition;
        if (definition) {
            const success = await copyToClipboard(typeof definition === 'string' ? definition : JSON.stringify(definition));
            if (success) {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            }
        }
    };

    const handleDownloadDefinition = () => {
        const definition = stateMachineDetail?.stateMachine.definition;
        if (definition) {
            const blob = new Blob([typeof definition === 'string' ? definition : JSON.stringify(definition, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${stateMachineDetail.stateMachine.name}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleStartExecution = () => {
        // TODO: Implement start execution functionality
        alert('Start execution functionality would be implemented here');
    };

    const handleEdit = () => {
        // TODO: Implement edit functionality
        alert('Edit functionality would be implemented here');
    };

    const handleDelete = () => {
        // TODO: Implement delete functionality
        if (confirm('Are you sure you want to delete this state machine?')) {
            alert('Delete functionality would be implemented here');
        }
    };

    if (loading) {
        return <StateMachineDetailSkeleton />;
    }

    if (error || !stateMachineDetail) {
        return (
            <div className="max-w-4xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-center text-2xl">Error</CardTitle>
                        <CardDescription className="text-center">
                            {error || 'State machine not found'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/state-machines">
                                View All State Machines
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { stateMachine, executionStats, recentExecutions } = stateMachineDetail;
    const definitionToDisplay = typeof stateMachine.definition === 'string'
        ? JSON.parse(stateMachine.definition)
        : stateMachine.definition;

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
                            <GitBranch className="h-8 w-8 mr-3 text-blue-500" />
                            {stateMachine.name}
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center">
                            <FileJson className="h-4 w-4 mr-2" />
                            {stateMachine.id}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handleStartExecution}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Execution
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Type</CardTitle>
                        <GitBranch className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stateMachine.type || 'Standard'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Version</CardTitle>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                            v{stateMachine.version}
                        </Badge>
                    </CardHeader>
                    <CardContent></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Executions</CardTitle>
                        <History className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{executionStats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {executionStats.successRate}%
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Created</CardTitle>
                        <Clock className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-sm">
                            {formatDate(stateMachine.createdAt)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="definition">
                                <FileJson className="h-4 w-4 mr-2" />
                                Definition
                            </TabsTrigger>
                            <TabsTrigger value="metadata">
                                <FileJson className="h-4 w-4 mr-2" />
                                Metadata
                            </TabsTrigger>
                            <TabsTrigger value="executions">
                                <History className="h-4 w-4 mr-2" />
                                Recent Executions
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={handleCopyDefinition}>
                            <Copy className="h-4 w-4 mr-2" />
                            {copySuccess ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadDefinition}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {activeTab === 'definition' ? (
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-[600px]">
              <pre className="whitespace-pre-wrap break-words">
                {formatJson(definitionToDisplay)}
              </pre>
                        </div>
                    ) : activeTab === 'metadata' ? (
                        <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                            {stateMachine.metadata && Object.keys(stateMachine.metadata).length > 0 ? (
                                <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                  {formatJson(stateMachine.metadata)}
                </pre>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <FileJson className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium">No metadata available</p>
                                    <p className="text-sm mt-1">This state machine has no additional metadata</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {recentExecutions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Execution ID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Started</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Current State</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentExecutions.map((execution) => (
                                            <TableRow key={`${execution.executionId}-${execution.startTime}`}>
                                                <TableCell className="font-medium max-w-xs truncate">
                                                    <Link
                                                        href={`/dashboard/executions/${encodeURIComponent(execution.executionId)}`}
                                                        className="text-blue-600 hover:underline hover:text-blue-800"
                                                    >
                                                        {execution.executionId}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {execution.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {formatDate(execution.startTime)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {execution.endTime
                                                        ? formatDuration(execution.startTime, execution.endTime)
                                                        : 'Running...'}
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    {execution.currentState}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link href={`/dashboard/executions/${encodeURIComponent(execution.executionId)}`}>
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">No executions yet</p>
                                    <p className="text-sm">Start a new execution to see it here</p>
                                    <Button
                                        className="mt-4"
                                        onClick={handleStartExecution}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Start Execution
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Description */}
            {stateMachine.description && (
                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{stateMachine.description}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Reusable Status Badge Component
function StatusBadge({ status }: { status: string }) {
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

function StateMachineDetailSkeleton() {
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
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border p-6">
                        <Skeleton className="h-4 w-24 mb-4" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg border">
                <div className="border-b p-4 flex items-center justify-between">
                    <Skeleton className="h-10 w-full max-w-md" />
                    <div className="flex space-x-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
                <div className="p-4">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>

            <div className="bg-white rounded-lg border">
                <div className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                </div>
            </div>
        </div>
    );
}
