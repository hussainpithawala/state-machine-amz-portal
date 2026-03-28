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
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';

interface StateNameSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (stateName: string) => void;
    stateMachineId: string;
}

interface StatesResponse {
    stateMachineId: string;
    allStates: string[];
    usedStates: string[];
    stateStatuses: Record<string, string[]>;
    availableStatuses: string[];
}

export function StateNameSelectorModal({
    open,
    onOpenChange,
    onSelect,
    stateMachineId,
}: StateNameSelectorModalProps) {
    const [allStates, setAllStates] = useState<string[]>([]);
    const [usedStates, setUsedStates] = useState<string[]>([]);
    const [stateStatuses, setStateStatuses] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && stateMachineId) {
            fetchStates();
        }
    }, [open, stateMachineId]);

    const fetchStates = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/state-machines/${encodeURIComponent(stateMachineId)}/states`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch states`);
            }

            const data: StatesResponse = await response.json();
            setAllStates(data.allStates || []);
            setUsedStates(data.usedStates || []);
            setStateStatuses(data.stateStatuses || {});
        } catch (err) {
            console.error('Error fetching states:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setAllStates([]);
            setUsedStates([]);
            setStateStatuses({});
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (stateName: string) => {
        onSelect(stateName);
        onOpenChange(false);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Combine all states and mark which ones are used
    const allStatesWithUsage = allStates.map((stateName) => ({
        name: stateName,
        isUsed: usedStates.includes(stateName),
        statuses: stateStatuses[stateName] || [],
    }));

    const filteredStates = allStatesWithUsage.filter((state) =>
        state.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select State Name</DialogTitle>
                    <DialogDescription>
                        Choose a state from the state machine definition
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search states..."
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
                                    <TableHead>State Name</TableHead>
                                    <TableHead className="w-[150px]">Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Loading states...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-red-600">
                                            {error}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                                            {searchQuery ? 'No states found matching your search' : 'No states available in this state machine'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStates.map((state) => (
                                        <TableRow key={state.name}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {state.name}
                                                    {state.isUsed && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Used
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {state.statuses.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {state.statuses.slice(0, 3).map((status) => (
                                                            <Badge key={status} variant="outline" className="text-xs">
                                                                {status}
                                                            </Badge>
                                                        ))}
                                                        {state.statuses.length > 3 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{state.statuses.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Not used yet</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSelect(state.name)}
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
