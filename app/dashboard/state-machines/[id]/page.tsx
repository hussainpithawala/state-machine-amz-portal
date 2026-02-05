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
    XCircle
} from 'lucide-react';
import { StateMachine } from '@/types/database';
import { formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function StateMachineDetailPage() {
    const params = useParams();
    const router = useRouter();
    const stateMachineId = params.id as string;

    const [stateMachine, setStateMachine] = useState<StateMachine | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('definition');
    const [parsedDefinition, setParsedDefinition] = useState<any>(null);

    useEffect(() => {
        fetchStateMachine();
    }, [stateMachineId]);

    const fetchStateMachine = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/state-machines/${encodeURIComponent(stateMachineId)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('State machine not found');
                } else {
                    setError('Failed to fetch state machine details');
                }
                return;
            }

            const data: StateMachine = await response.json();
            setStateMachine(data);

            // Try to parse definition
            try {
                setParsedDefinition(typeof data.definition === 'string'
                    ? JSON.parse(data.definition)
                    : data.definition);
            } catch {
                setParsedDefinition(null);
            }
        } catch (err) {
            console.error('Error fetching state machine:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <StateMachineDetailSkeleton />;
    }

    if (error || !stateMachine) {
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

    const definitionToDisplay = parsedDefinition || stateMachine.definition;

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
                <Badge variant="outline" className="text-lg px-4 py-2">
                    v{stateMachine.version}
                </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
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
                        <CardTitle className="text-sm font-medium text-gray-600">Created</CardTitle>
                        <Clock className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDate(stateMachine.createdAt)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Last Updated</CardTitle>
                        <Clock className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDate(stateMachine.updatedAt)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="definition">
                                <FileJson className="h-4 w-4 mr-2" />
                                Definition
                            </TabsTrigger>
                            <TabsTrigger value="metadata">
                                <FileJson className="h-4 w-4 mr-2" />
                                Metadata
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    {activeTab === 'definition' ? (
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-[600px]">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(definitionToDisplay, null, 2)}
              </pre>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            {Object.keys(stateMachine.metadata).length > 0 ? (
                                <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                  {JSON.stringify(stateMachine.metadata, null, 2)}
                </pre>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    No metadata available
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Related Executions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <History className="h-5 w-5 mr-2 text-blue-500" />
                        Recent Executions
                    </CardTitle>
                    <CardDescription>
                        View executions for this state machine
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href={`/dashboard/executions?stateMachineId=${encodeURIComponent(stateMachine.id)}`}>
                            View Executions
                            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
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
                <Skeleton className="h-10 w-24" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
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
