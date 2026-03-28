'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface StateMachine {
    id: string;
    name: string;
    description?: string;
}

interface StateMachineSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (stateMachineId: string, stateMachineName: string) => void;
}

interface StateMachinesResponse {
    data: StateMachine[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

export function StateMachineSelectorModal({
    open,
    onOpenChange,
    onSelect,
}: StateMachineSelectorModalProps) {
    const [stateMachines, setStateMachines] = useState<StateMachine[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchStateMachines();
        }
    }, [open, currentPage, searchQuery]);

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

    const handleSelect = (stateMachine: StateMachine) => {
        onSelect(stateMachine.id, stateMachine.name);
        onOpenChange(false);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select State Machine</DialogTitle>
                    <DialogDescription>
                        Choose a source state machine from the list below
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search state machines..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="pl-10"
                            disabled={loading}
                        />
                    </div>

                    {/* Table with scroll */}
                    <div className="flex-1 overflow-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Loading state machines...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-red-600">
                                            {error}
                                        </TableCell>
                                    </TableRow>
                                ) : stateMachines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                                            No state machines found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stateMachines.map((sm) => (
                                        <TableRow key={sm.id}>
                                            <TableCell className="font-mono text-sm">{sm.id}</TableCell>
                                            <TableCell>{sm.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSelect(sm)}
                                                >
                                                    Select
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {!loading && !error && stateMachines.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Showing {stateMachines.length} of {totalItems} state machines
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
