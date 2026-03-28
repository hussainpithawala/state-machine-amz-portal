// app/dashboard/linked-executions/LinkedExecutionsList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Link as LinkIcon,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import { LinkedExecution } from '@/types/database';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface LinkedExecutionsListProps {
    searchParams: {
        page?: string;
        pageSize?: string;
        sourceStateMachineId?: string;
        sourceExecutionId?: string;
        sourceStateName?: string;
        inputTransformerName?: string;
        targetStateMachineName?: string;
        targetExecutionId?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
    };
}

export function LinkedExecutionsList({ searchParams }: LinkedExecutionsListProps) {
    const router = useRouter();
    const currentSearchParams = useSearchParams();

    const [linkedExecutions, setLinkedExecutions] = useState<LinkedExecution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.page || '1', 10));
    const [pageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchLinkedExecutions();
    }, [currentSearchParams]);

    useEffect(() => {
        const pageFromUrl = parseInt(currentSearchParams.get('page') || searchParams.page || '1', 10);
        setCurrentPage(Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl);
    }, [currentSearchParams, searchParams.page]);

    const fetchLinkedExecutions = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams(currentSearchParams.toString());
            if (!params.has('page')) params.set('page', currentPage.toString());
            if (!params.has('pageSize')) params.set('pageSize', pageSize.toString());

            const response = await fetch(`/api/linked-executions?${params}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch linked executions`);
            }

            const apiResponse = await response.json();
            setLinkedExecutions(apiResponse.results || []);
            setTotalPages(apiResponse.pagination?.totalPages || 1);
            setTotalItems(apiResponse.pagination?.total || 0);
        } catch (err) {
            console.error('Error fetching linked executions:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setLinkedExecutions([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const params = new URLSearchParams(currentSearchParams.toString());
            params.set('page', newPage.toString());
            router.push(`/dashboard/linked-executions?${params}`);
        }
    };

    const hasActiveFilters = () => {
        const params = currentSearchParams;
        return params.get('sourceStateMachineId') || 
               params.get('sourceExecutionId') || 
               params.get('sourceStateName') || 
               params.get('inputTransformerName') || 
               params.get('targetStateMachineName') || 
               params.get('targetExecutionId') ||
               params.get('createdAtFrom') || 
               params.get('createdAtTo');
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2 text-blue-500"/>
                        Linked Executions List
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

    if (linkedExecutions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2 text-blue-500"/>
                        Linked Executions List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        {hasActiveFilters() ? (
                            <>
                                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                                <p className="text-lg font-medium mb-2">No linked executions found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => router.push('/dashboard/linked-executions')}
                                >
                                    Clear Filters
                                </Button>
                            </>
                        ) : (
                            <>
                                <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                                <p className="text-lg font-medium mb-2">No linked executions yet</p>
                                <p className="text-sm">Linked executions will appear here when state machines are connected</p>
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
                    <LinkIcon className="h-5 w-5 mr-2 text-blue-500"/>
                    Linked Executions List
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Source State Machine</TableHead>
                                <TableHead>Source Execution</TableHead>
                                <TableHead>Source State</TableHead>
                                <TableHead>Transformer</TableHead>
                                <TableHead>Target State Machine</TableHead>
                                <TableHead>Target Execution</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {linkedExecutions.map((linked) => (
                                <TableRow key={linked.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium max-w-xs truncate">
                                        <Link
                                            href={`/dashboard/state-machines/${encodeURIComponent(linked.sourceStateMachineId)}`}
                                            className="text-blue-600 hover:underline hover:text-blue-800"
                                        >
                                            {linked.sourceStateMachineId}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        <Link
                                            href={`/dashboard/executions/${encodeURIComponent(linked.sourceExecutionId)}`}
                                            className="text-blue-600 hover:underline hover:text-blue-800"
                                        >
                                            {linked.sourceExecutionId}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {linked.sourceStateName || '-'}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {linked.inputTransformerName || '-'}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        <Badge variant="secondary">
                                            {linked.targetStateMachineName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        <Link
                                            href={`/dashboard/executions/${encodeURIComponent(linked.targetExecutionId)}`}
                                            className="text-blue-600 hover:underline hover:text-blue-800"
                                        >
                                            {linked.targetExecutionId}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {formatDate(linked.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/dashboard/executions/${encodeURIComponent(linked.targetExecutionId)}`}>
                                                <ExternalLink className="h-4 w-4 mr-1"/>
                                                View Target
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
