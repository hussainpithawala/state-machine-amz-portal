// app/dashboard/linked-executions/LinkedExecutionsList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Link as LinkIcon,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    Trash2,
    CheckCheck
} from 'lucide-react';
import { LinkedExecution } from '@/types/database';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

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
    const [jumpPage, setJumpPage] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        fetchLinkedExecutions();
    }, [currentSearchParams]);

    useEffect(() => {
        const pageFromUrl = parseInt(currentSearchParams.get('page') || searchParams.page || '1', 10);
        setCurrentPage(Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl);
    }, [currentSearchParams, searchParams.page]);

    // Clear selection when filters or page changes
    useEffect(() => {
        setSelectedIds(new Set());
    }, [currentSearchParams]);

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

    const handleJumpToPage = () => {
        const pageToJump = parseInt(jumpPage, 10);
        if (Number.isNaN(pageToJump) || pageToJump < 1) {
            setJumpPage('');
            return;
        }
        if (pageToJump > totalPages) {
            setJumpPage(totalPages.toString());
            return;
        }
        setJumpPage('');
        handlePageChange(pageToJump);
    };

    const handleJumpPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleJumpToPage();
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === linkedExecutions.length) {
            // Deselect all
            setSelectedIds(new Set());
        } else {
            // Select all on current page
            const allIds = new Set(linkedExecutions.map(item => item.id));
            setSelectedIds(allIds);
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = async () => {
        setShowConfirmDialog(false);
        setIsDeleting(true);

        try {
            const response = await fetch('/api/linked-executions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ids: Array.from(selectedIds),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete linked executions`);
            }

            const result = await response.json();
            
            toast.success('Linked executions deleted', {
                description: `${result.deletedCount} record(s) deleted successfully`,
            });

            setSelectedIds(new Set());
            fetchLinkedExecutions();
        } catch (err) {
            console.error('Error deleting linked executions:', err);
            toast.error('Failed to delete linked executions', {
                description: err instanceof Error ? err.message : 'An unknown error occurred',
            });
        } finally {
            setIsDeleting(false);
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
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2 text-blue-500"/>
                        Linked Executions List
                    </CardTitle>
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                            >
                                <CheckCheck className="h-4 w-4 mr-2"/>
                                {selectedIds.size === linkedExecutions.length ? 'Deselect All' : `Select All (${linkedExecutions.length})`}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowConfirmDialog(true)}
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-4 w-4 mr-2"/>
                                Delete Selected ({selectedIds.size})
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedIds.size === linkedExecutions.length && linkedExecutions.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
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
                                <TableRow key={linked.id} className={selectedIds.has(linked.id) ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-gray-50'}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(linked.id)}
                                            onCheckedChange={() => handleSelectOne(linked.id)}
                                        />
                                    </TableCell>
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
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            title="First page"
                        >
                            <ChevronsLeft className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4"/>
                            Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                            <span className="text-sm text-gray-600">
                                Page
                            </span>
                            <Input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={jumpPage}
                                placeholder={currentPage.toString()}
                                onChange={(e) => setJumpPage(e.target.value)}
                                onKeyDown={handleJumpPageKeyDown}
                                className="w-20 h-8 text-sm text-center"
                                title={`Jump to page (1-${totalPages})`}
                            />
                            <span className="text-sm text-gray-600">
                                of {totalPages}
                            </span>
                            {jumpPage && jumpPage !== currentPage.toString() && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleJumpToPage}
                                    className="h-8 px-3 text-xs"
                                >
                                    Go
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            title="Last page"
                        >
                            <ChevronsRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Linked Executions</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedIds.size} linked execution{selectedIds.size !== 1 ? 's' : ''}? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2"/>
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
