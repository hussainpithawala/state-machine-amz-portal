// app/dashboard/linked-executions/LinkedExecutionsFilters.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Calendar, X, Clock, Trash2 } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { StateMachineSelectorModal } from '@/components/modals/state-machine-selector-modal';
import { toast } from 'sonner';

export function LinkedExecutionsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Committed filter values (from URL)
    const [committedFilters, setCommittedFilters] = useState({
        sourceStateMachineId: searchParams.get('sourceStateMachineId') || '',
        sourceExecutionId: searchParams.get('sourceExecutionId') || '',
        sourceStateName: searchParams.get('sourceStateName') || '',
        inputTransformerName: searchParams.get('inputTransformerName') || '',
        targetStateMachineName: searchParams.get('targetStateMachineName') || '',
        targetExecutionId: searchParams.get('targetExecutionId') || '',
        createdAtFrom: searchParams.get('createdAtFrom') ? new Date(parseInt(searchParams.get('createdAtFrom')!)) : null as Date | null,
        createdAtTo: searchParams.get('createdAtTo') ? new Date(parseInt(searchParams.get('createdAtTo')!)) : null as Date | null,
    });

    // Pending filter values (for form inputs)
    const [pendingFilters, setPendingFilters] = useState(committedFilters);

    const [selectorOpen, setSelectorOpen] = useState(false);
    const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filteredCount, setFilteredCount] = useState<number | null>(null);

    const handleApplyFilters = () => {
        setCommittedFilters(pendingFilters);

        const params = new URLSearchParams();

        if (pendingFilters.sourceStateMachineId) params.set('sourceStateMachineId', pendingFilters.sourceStateMachineId);
        if (pendingFilters.sourceExecutionId) params.set('sourceExecutionId', pendingFilters.sourceExecutionId);
        if (pendingFilters.sourceStateName) params.set('sourceStateName', pendingFilters.sourceStateName);
        if (pendingFilters.inputTransformerName) params.set('inputTransformerName', pendingFilters.inputTransformerName);
        if (pendingFilters.targetStateMachineName) params.set('targetStateMachineName', pendingFilters.targetStateMachineName);
        if (pendingFilters.targetExecutionId) params.set('targetExecutionId', pendingFilters.targetExecutionId);
        if (pendingFilters.createdAtFrom) params.set('createdAtFrom', Math.floor(pendingFilters.createdAtFrom.getTime() / 1000).toString());
        if (pendingFilters.createdAtTo) params.set('createdAtTo', Math.floor(pendingFilters.createdAtTo.getTime() / 1000).toString());

        const queryString = params.toString();
        const url = `/dashboard/linked-executions${queryString ? `?${queryString}` : ''}`;
        router.push(url);
    };

    const handleSourceStateMachineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, sourceStateMachineId: e.target.value }));
    };

    const handleSourceStateMachineSelect = (stateMachineId: string, stateMachineName: string) => {
        setPendingFilters(prev => ({ ...prev, sourceStateMachineId: stateMachineId }));
    };

    const handleSourceExecutionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, sourceExecutionId: e.target.value }));
    };

    const handleSourceStateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, sourceStateName: e.target.value }));
    };

    const handleInputTransformerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, inputTransformerName: e.target.value }));
    };

    const handleTargetStateMachineNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, targetStateMachineName: e.target.value }));
    };

    const handleTargetExecutionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, targetExecutionId: e.target.value }));
    };

    const handleCreatedAtFromChange = (date: Date | null | undefined) => {
        setPendingFilters(prev => ({ ...prev, createdAtFrom: date || null }));
    };

    const handleCreatedAtToChange = (date: Date | null | undefined) => {
        setPendingFilters(prev => ({ ...prev, createdAtTo: date || null }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            sourceStateMachineId: '',
            sourceExecutionId: '',
            sourceStateName: '',
            inputTransformerName: '',
            targetStateMachineName: '',
            targetExecutionId: '',
            createdAtFrom: null as Date | null,
            createdAtTo: null as Date | null,
        };
        setPendingFilters(clearedFilters);
        setCommittedFilters(clearedFilters);
        router.push('/dashboard/linked-executions');
    };

    const hasActiveFilters = () => {
        return committedFilters.sourceStateMachineId ||
            committedFilters.sourceExecutionId ||
            committedFilters.sourceStateName ||
            committedFilters.inputTransformerName ||
            committedFilters.targetStateMachineName ||
            committedFilters.targetExecutionId ||
            committedFilters.createdAtFrom ||
            committedFilters.createdAtTo;
    };

    const hasPendingChanges = () => {
        return pendingFilters.sourceStateMachineId !== committedFilters.sourceStateMachineId ||
            pendingFilters.sourceExecutionId !== committedFilters.sourceExecutionId ||
            pendingFilters.sourceStateName !== committedFilters.sourceStateName ||
            pendingFilters.inputTransformerName !== committedFilters.inputTransformerName ||
            pendingFilters.targetStateMachineName !== committedFilters.targetStateMachineName ||
            pendingFilters.targetExecutionId !== committedFilters.targetExecutionId ||
            pendingFilters.createdAtFrom !== committedFilters.createdAtFrom ||
            pendingFilters.createdAtTo !== committedFilters.createdAtTo;
    };

    const fetchFilteredCount = async (): Promise<number> => {
        const params = new URLSearchParams();

        if (committedFilters.sourceStateMachineId) params.set('sourceStateMachineId', committedFilters.sourceStateMachineId);
        if (committedFilters.sourceExecutionId) params.set('sourceExecutionId', committedFilters.sourceExecutionId);
        if (committedFilters.sourceStateName) params.set('sourceStateName', committedFilters.sourceStateName);
        if (committedFilters.inputTransformerName) params.set('inputTransformerName', committedFilters.inputTransformerName);
        if (committedFilters.targetStateMachineName) params.set('targetStateMachineName', committedFilters.targetStateMachineName);
        if (committedFilters.targetExecutionId) params.set('targetExecutionId', committedFilters.targetExecutionId);
        if (committedFilters.createdAtFrom) params.set('createdAtFrom', Math.floor(committedFilters.createdAtFrom.getTime() / 1000).toString());
        if (committedFilters.createdAtTo) params.set('createdAtTo', Math.floor(committedFilters.createdAtTo.getTime() / 1000).toString());

        const response = await fetch(`/api/linked-executions?${params}&page=1&pageSize=1`);
        if (!response.ok) {
            throw new Error('Failed to fetch filtered count');
        }
        const data = await response.json();
        return data.pagination?.total || 0;
    };

    const handleDeleteAllFiltered = async () => {
        setShowDeleteConfirmDialog(false);
        setIsDeleting(true);

        try {
            const body: Record<string, any> = {
                deleteByFilter: true,
            };

            if (committedFilters.sourceStateMachineId) body.sourceStateMachineId = committedFilters.sourceStateMachineId;
            if (committedFilters.sourceExecutionId) body.sourceExecutionId = committedFilters.sourceExecutionId;
            if (committedFilters.sourceStateName) body.sourceStateName = committedFilters.sourceStateName;
            if (committedFilters.inputTransformerName) body.inputTransformerName = committedFilters.inputTransformerName;
            if (committedFilters.targetStateMachineName) body.targetStateMachineName = committedFilters.targetStateMachineName;
            if (committedFilters.targetExecutionId) body.targetExecutionId = committedFilters.targetExecutionId;
            if (committedFilters.createdAtFrom) body.createdAtFrom = Math.floor(committedFilters.createdAtFrom.getTime() / 1000).toString();
            if (committedFilters.createdAtTo) body.createdAtTo = Math.floor(committedFilters.createdAtTo.getTime() / 1000).toString();

            const response = await fetch('/api/linked-executions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete linked executions`);
            }

            const result = await response.json();

            toast.success('Linked executions deleted', {
                description: `${result.deletedCount} record(s) deleted successfully`,
            });

            // Clear filters and refresh
            clearFilters();
        } catch (err) {
            console.error('Error deleting linked executions:', err);
            toast.error('Failed to delete linked executions', {
                description: err instanceof Error ? err.message : 'An unknown error occurred',
            });
        } finally {
            setIsDeleting(false);
            setFilteredCount(null);
        }
    };

    const handleOpenDeleteDialog = async () => {
        try {
            const count = await fetchFilteredCount();
            setFilteredCount(count);
            if (count === 0) {
                toast.info('No records to delete', {
                    description: 'The current filters match 0 linked executions',
                });
                return;
            }
            setShowDeleteConfirmDialog(true);
        } catch (err) {
            console.error('Error fetching filtered count:', err);
            toast.error('Failed to fetch record count', {
                description: err instanceof Error ? err.message : 'An unknown error occurred',
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Source State Machine ID */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Source State Machine ID
                    </label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Select from list..."
                            value={pendingFilters.sourceStateMachineId}
                            disabled
                            className="flex-1 bg-gray-50"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectorOpen(true)}
                            title="Select from list"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Source Execution ID */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Source Execution ID
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                        <Input
                            placeholder="Search by source execution ID..."
                            value={pendingFilters.sourceExecutionId}
                            onChange={handleSourceExecutionIdChange}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Source State Name */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Source State Name
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                        <Input
                            placeholder="Search by source state name..."
                            value={pendingFilters.sourceStateName}
                            onChange={handleSourceStateNameChange}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Input Transformer Name */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Input Transformer Name
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                        <Input
                            placeholder="Search by transformer name..."
                            value={pendingFilters.inputTransformerName}
                            onChange={handleInputTransformerNameChange}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Target State Machine Name */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Target State Machine Name
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                        <Input
                            placeholder="Search by target state machine name..."
                            value={pendingFilters.targetStateMachineName}
                            onChange={handleTargetStateMachineNameChange}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Target Execution ID */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Target Execution ID
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                        <Input
                            placeholder="Search by target execution ID..."
                            value={pendingFilters.targetExecutionId}
                            onChange={handleTargetExecutionIdChange}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Created At From */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Created At From
                    </label>
                    <DateTimePicker
                        date={pendingFilters.createdAtFrom}
                        onChange={handleCreatedAtFromChange}
                        placeholder="Pick start date & time"
                    />
                </div>

                {/* Created At To */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Created At To
                    </label>
                    <DateTimePicker
                        date={pendingFilters.createdAtTo}
                        onChange={handleCreatedAtToChange}
                        placeholder="Pick end date & time"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={handleApplyFilters}
                    disabled={!hasPendingChanges()}
                >
                    <Search className="h-4 w-4 mr-2" />
                    Apply Filters
                </Button>
                {hasActiveFilters() && (
                    <>
                        <Button
                            variant="destructive"
                            onClick={handleOpenDeleteDialog}
                            disabled={isDeleting}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete All Filtered
                        </Button>
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    </>
                )}
                {hasPendingChanges() && (
                    <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Unsaved changes
                    </span>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete All Filtered Linked Executions</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete all {filteredCount !== null ? filteredCount : ''} linked execution{filteredCount !== 1 ? 's' : ''} matching the current filters? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirmDialog(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAllFiltered}
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
                                    Delete All
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <StateMachineSelectorModal
                open={selectorOpen}
                onOpenChange={setSelectorOpen}
                onSelect={handleSourceStateMachineSelect}
            />
        </div>
    );
}
