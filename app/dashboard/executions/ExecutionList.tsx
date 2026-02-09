// app/dashboard/executions/ExecutionList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    History,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import { Execution } from '@/types/database';
import { formatDate, formatDuration, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

interface ExecutionListProps {
    searchParams: {
        page?: string;
        pageSize?: string;
        stateMachineId?: string;
        status?: string;
        search?: string;
        dateRange?: string;
    };
}

export function ExecutionList({ searchParams }: ExecutionListProps) {
    const router = useRouter();
    const currentSearchParams = useSearchParams();

    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.page || '1'));
    const [pageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchExecutions();
    }, [currentSearchParams]);

    const fetchExecutions = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams(currentSearchParams.toString());
            if (!params.has('page')) params.set('page', currentPage.toString());
            if (!params.has('pageSize')) params.set('pageSize', pageSize.toString());

            const response = await fetch(`/api/executions?${params}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch executions`);
            }

            const apiResponse = await response.json();
            setExecutions(apiResponse.results || []);
            setTotalPages(apiResponse.pagination?.totalPages || 1);
            setTotalItems(apiResponse.pagination?.total || 0);
        } catch (err) {
            console.error('Error fetching executions:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setExecutions([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            const params = new URLSearchParams(currentSearchParams.toString());
            params.set('page', newPage.toString());
            router.push(`/dashboard/executions?${params}`);
        }
    };

    const hasActiveFilters = () => {
        const params = currentSearchParams;
        return params.get('search') || params.get('status') || params.get('stateMachineId') || params.get('dateRange') !== '30d';
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <History className="h-5 w-5 mr-2 text-blue-500"/>
                        Execution List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"/>
                                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"/>
                                </div>
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"/>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (executions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <History className="h-5 w-5 mr-2 text-blue-500"/>
                        Execution List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        {hasActiveFilters() ? (
                            <>
                                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                                <p className="text-lg font-medium mb-2">No executions found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => router.push('/dashboard/executions')}
                                >
                                    Clear Filters
                                </Button>
                            </>
                        ) : (
                            <>
                                <History className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                                <p className="text-lg font-medium mb-2">No executions yet</p>
                                <p className="text-sm">Start a new execution to see it here</p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <History className="h-5 w-5 mr-2 text-blue-500"/>
                    Execution List
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>State-Machine-Name</TableHead>
                                <TableHead>Execution ID</TableHead>
                                <TableHead>Execution Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Started</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Current State</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {executions.map((execution) => (
                                <TableRow key={`${execution.executionId}-${execution.startTime}`}
                                          className="hover:bg-gray-50">
                                    <TableCell className="font-medium max-w-xs truncate">
                                        <Link
                                            href={`/dashboard/state-machines/${encodeURIComponent(execution.stateMachineId)}`}
                                            className="text-blue-600 hover:underline hover:text-blue-800"
                                        >
                                            {execution.stateMachineId}
                                        </Link>
                                    </TableCell>
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
                                    <TableCell>
                                        <Badge
                                            className={getStatusColor(execution.status)}
                                            variant="outline"
                                        >
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
                                            <Link
                                                href={`/dashboard/executions/${encodeURIComponent(execution.executionId)}`}>
                                                <ExternalLink className="h-4 w-4 mr-1"/>
                                                View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4"/>
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1"/>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
