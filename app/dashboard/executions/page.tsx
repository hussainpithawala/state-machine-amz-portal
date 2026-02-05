'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    History,
    Filter,
    Calendar,
    Clock,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Play,
    AlertCircle
} from 'lucide-react';
import { Execution } from '@/types/database';
import { formatDate, formatDuration, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ExecutionsResponse {
    results: Execution[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    filters: {
        stateMachineId?: string;
        status?: string;
        dateRange?: string;
    };
}

const STATUS_OPTIONS = [
    { value: 'RUNNING', label: 'Running' },
    { value: 'SUCCEEDED', label: 'Succeeded' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'TIMED_OUT', label: 'Timed Out' },
    { value: 'ABORTED', label: 'Aborted' },
    { value: 'PAUSED', label: 'Paused' },
];

const DATE_RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
];

export default function ExecutionsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [dateRangeFilter, setDateRangeFilter] = useState(searchParams.get('dateRange') || '30d');
    const [stateMachineFilter, setStateMachineFilter] = useState(searchParams.get('stateMachineId') || '');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchExecutions();
    }, [currentPage, searchQuery, statusFilter, dateRangeFilter, stateMachineFilter]);

    const fetchExecutions = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: pageSize.toString(),
                ...(searchQuery && { search: searchQuery }),
                ...(statusFilter && { status: statusFilter }),
                ...(dateRangeFilter && { dateRange: dateRangeFilter }),
                ...(stateMachineFilter && { stateMachineId: stateMachineFilter }),
            });

            const response = await fetch(`/api/executions?${params}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch executions`);
            }

            const apiResponse = await response.json();

            // ✅ This should be correct
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value: string) => {
        // Convert "all" back to empty string for API filtering
        const actualValue = value === 'all' ? '' : value;
        setStatusFilter(actualValue);
        setCurrentPage(1);
    };

    const handleDateRangeChange = (value: string) => {
        setDateRangeFilter(value);
        setCurrentPage(1);
    };

    const handleStateMachineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStateMachineFilter(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDateRangeFilter('30d');
        setStateMachineFilter('');
        setCurrentPage(1);
    };

    const hasActiveFilters = () => {
        return searchQuery || statusFilter || stateMachineFilter || dateRangeFilter !== '30d';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Executions</h1>
                    <p className="text-gray-500 mt-1">
                        {totalItems} execution{totalItems !== 1 ? 's' : ''} found
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard/executions/new')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start New Execution
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or ID..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter || 'all'}
                            onValueChange={handleStatusChange}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {STATUS_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date Range Filter */}
                        <Select
                            value={dateRangeFilter}
                            onValueChange={handleDateRangeChange}
                        >
                            <SelectTrigger className="w-full">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Select date range" />
                            </SelectTrigger>
                            <SelectContent>
                                {DATE_RANGE_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* State Machine Filter */}
                        <div className="relative">
                            <Input
                                placeholder="Filter by State Machine ID..."
                                value={stateMachineFilter}
                                onChange={handleStateMachineChange}
                                className="pr-10"
                            />
                            {hasActiveFilters() && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                    onClick={clearFilters}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Executions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <History className="h-5 w-5 mr-2 text-blue-500" />
                        Execution List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <ExecutionsSkeleton rows={pageSize} />
                    ) : executions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {hasActiveFilters() ? (
                                <>
                                    <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">No executions found</p>
                                    <p className="text-sm">Try adjusting your filters</p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">No executions yet</p>
                                    <p className="text-sm">Start a new execution to see it here</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Execution ID</TableHead>
                                            <TableHead>State Machine</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Started</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Current State</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {executions.map((execution) => (
                                            <TableRow key={`${execution.executionId}-${execution.startTime}`} className="hover:bg-gray-50">
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
                                        <ChevronLeft className="h-4 w-4" />
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
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function ExecutionsSkeleton({ rows = 10 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="space-y-2 flex-1">
                        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
}
