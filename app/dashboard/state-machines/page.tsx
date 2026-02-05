'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Plus,
    GitBranch,
    Clock,
    ExternalLink,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { StateMachine } from '@/types/database';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface StateMachinesResponse {
    data: StateMachine[];        // ✅ Changed from 'results' to 'data'
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

export default function StateMachinesPage() {
    const router = useRouter();
    const [stateMachines, setStateMachines] = useState<StateMachine[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStateMachines();
    }, [currentPage, searchQuery]);

    const fetchStateMachines = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: pageSize.toString(),
                ...(searchQuery && { search: searchQuery }),
            });

            const response = await fetch(`/api/state-machines?${params}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch state machines`);
            }

            const apiResponse = await response.json();

            // ✅ FIX: Use 'data' instead of 'results'
            const resultsArray = Array.isArray(apiResponse.data) ? apiResponse.data : [];

            setStateMachines(resultsArray);
            setTotalPages(apiResponse.pagination?.totalPages || 1);
            setTotalItems(apiResponse.pagination?.total || 0);
        } catch (err) {
            console.error('Error fetching state machines:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setStateMachines([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const truncateDefinition = (definition: string) => {
        try {
            const parsed = JSON.parse(definition);
            return JSON.stringify(parsed, null, 2).substring(0, 100) + '...';
        } catch {
            return definition.substring(0, 100) + '...';
        }
    };

    // Handle empty state safely
    const isEmpty = !stateMachines || stateMachines.length === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">State Machines</h1>
                    <p className="text-gray-500 mt-1">
                        {totalItems} state machine{totalItems !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard/state-machines/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create State Machine
                </Button>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-5 w-5 rounded-full bg-red-200 flex items-center justify-center">
                                    <span className="text-red-800 text-xs font-bold">!</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">Error</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchStateMachines}
                                    className="mt-2"
                                >
                                    Retry
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* State Machines Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <GitBranch className="h-5 w-5 mr-2 text-blue-500" />
                        State Machine List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <StateMachinesSkeleton rows={pageSize} />
                    ) : isEmpty ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchQuery ? (
                                <>
                                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">No state machines found</p>
                                    <p className="text-sm">Try adjusting your search query</p>
                                </>
                            ) : (
                                <>
                                    <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">No state machines registered</p>
                                    <p className="text-sm">Create your first state machine to get started</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px]">Name</TableHead>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Version</TableHead>
                                            <TableHead>Definition</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stateMachines.map((sm) => (
                                            <TableRow key={sm.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <GitBranch className="h-4 w-4 text-blue-500" />
                                                        <span>{sm.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm max-w-xs truncate">
                                                    {sm.id}
                                                </TableCell>
                                                <TableCell>
                                                    {sm.type ? (
                                                        <Badge variant="secondary">{sm.type}</Badge>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{sm.version}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-md truncate">
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {truncateDefinition(sm.definition)}
                                                    </code>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {formatDate(sm.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link href={`/dashboard/state-machines/${encodeURIComponent(sm.id)}`}>
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

function StateMachinesSkeleton({ rows = 10 }: { rows?: number }) {
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
