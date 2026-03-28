// app/dashboard/executions/ExecutionFilters.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Search, Calendar, X, Filter, Clock } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { StateMachineSelectorModal } from '@/components/modals/state-machine-selector-modal';

const STATUS_OPTIONS = [
    {value: 'RUNNING', label: 'Running'},
    {value: 'SUCCEEDED', label: 'Succeeded'},
    {value: 'FAILED', label: 'Failed'},
    {value: 'CANCELLED', label: 'Cancelled'},
    {value: 'TIMED_OUT', label: 'Timed Out'},
    {value: 'ABORTED', label: 'Aborted'},
    {value: 'PAUSED', label: 'Paused'},
];

const STATE_STATUS_OPTIONS = [
    {value: 'SUCCEEDED', label: 'Succeeded'},
    {value: 'FAILED', label: 'Failed'},
    {value: 'RUNNING', label: 'Running'},
    {value: 'CANCELLED', label: 'Cancelled'},
    {value: 'TIMED_OUT', label: 'Timed Out'},
    {value: 'RETRYING', label: 'Retrying'},
    {value: 'WAITING', label: 'Waiting'},
];

interface StateMachineState {
    allStates: string[];
    usedStates: string[];
    stateStatuses: Record<string, string[]>;
    availableStatuses: string[];
}

export function ExecutionFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Committed filter values (from URL)
    const [committedFilters, setCommittedFilters] = useState({
        searchQuery: searchParams.get('search') || '',
        statusFilter: searchParams.get('status') || '',
        startTimeFrom: searchParams.get('startTimeFrom') ? new Date(parseInt(searchParams.get('startTimeFrom')!)) : null as Date | null,
        startTimeTo: searchParams.get('startTimeTo') ? new Date(parseInt(searchParams.get('startTimeTo')!)) : null as Date | null,
        stateMachineFilter: searchParams.get('stateMachineId') || '',
        stateNameFilter: searchParams.get('stateName') || '',
        stateStatusFilter: searchParams.get('stateStatus') || '',
    });

    // Pending filter values (for form inputs)
    const [pendingFilters, setPendingFilters] = useState(committedFilters);

    const [availableStates, setAvailableStates] = useState<StateMachineState | null>(null);
    const [loadingStates, setLoadingStates] = useState(false);
    const [selectorOpen, setSelectorOpen] = useState(false);

    // Fetch available states when state machine filter changes
    useEffect(() => {
        if (committedFilters.stateMachineFilter) {
            fetchAvailableStates(committedFilters.stateMachineFilter);
        } else {
            setAvailableStates(null);
            setPendingFilters(prev => ({
                ...prev,
                stateNameFilter: '',
                stateStatusFilter: '',
            }));
            setCommittedFilters(prev => ({
                ...prev,
                stateNameFilter: '',
                stateStatusFilter: '',
            }));
        }
    }, [committedFilters.stateMachineFilter]);

    const fetchAvailableStates = async (stateMachineId: string) => {
        try {
            setLoadingStates(true);
            const response = await fetch(`/api/state-machines/${encodeURIComponent(stateMachineId)}/states`);
            if (response.ok) {
                const data = await response.json();
                setAvailableStates(data);
            } else {
                setAvailableStates(null);
            }
        } catch (error) {
            console.error('Error fetching available states:', error);
            setAvailableStates(null);
        } finally {
            setLoadingStates(false);
        }
    };

    const handleApplyFilters = () => {
        setCommittedFilters(pendingFilters);

        const params = new URLSearchParams();

        if (pendingFilters.searchQuery) params.set('search', pendingFilters.searchQuery);
        if (pendingFilters.statusFilter) params.set('status', pendingFilters.statusFilter);
        if (pendingFilters.startTimeFrom) params.set('startTimeFrom', Math.floor(pendingFilters.startTimeFrom.getTime() / 1000).toString());
        if (pendingFilters.startTimeTo) params.set('startTimeTo', Math.floor(pendingFilters.startTimeTo.getTime() / 1000).toString());
        if (pendingFilters.stateMachineFilter) params.set('stateMachineId', pendingFilters.stateMachineFilter);
        if (pendingFilters.stateNameFilter) params.set('stateName', pendingFilters.stateNameFilter);
        if (pendingFilters.stateStatusFilter) params.set('stateStatus', pendingFilters.stateStatusFilter);

        const queryString = params.toString();
        const url = `/dashboard/executions${queryString ? `?${queryString}` : ''}`;
        router.push(url);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, searchQuery: e.target.value }));
    };

    const handleStatusChange = (value: string) => {
        setPendingFilters(prev => ({ ...prev, statusFilter: value === 'all' ? '' : value }));
    };

    const handleStateMachineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPendingFilters(prev => ({ ...prev, stateMachineFilter: e.target.value }));
    };

    const handleStateMachineSelect = (stateMachineId: string, stateMachineName: string) => {
        setPendingFilters(prev => ({ ...prev, stateMachineFilter: stateMachineId }));
    };

    const handleStateNameChange = (value: string) => {
        setPendingFilters(prev => ({ ...prev, stateNameFilter: value === 'all' ? '' : value }));
    };

    const handleStateStatusChange = (value: string) => {
        setPendingFilters(prev => ({ ...prev, stateStatusFilter: value === 'all' ? '' : value }));
    };

    const handleStartTimeFromChange = (date: Date | null | undefined) => {
        setPendingFilters(prev => ({ ...prev, startTimeFrom: date || null }));
    };

    const handleStartTimeToChange = (date: Date | null | undefined) => {
        setPendingFilters(prev => ({ ...prev, startTimeTo: date || null }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            searchQuery: '',
            statusFilter: '',
            startTimeFrom: null as Date | null,
            startTimeTo: null as Date | null,
            stateMachineFilter: '',
            stateNameFilter: '',
            stateStatusFilter: '',
        };
        setPendingFilters(clearedFilters);
        setCommittedFilters(clearedFilters);
        router.push('/dashboard/executions');
    };

    const hasActiveFilters = () => {
        return committedFilters.searchQuery ||
            committedFilters.statusFilter ||
            committedFilters.startTimeFrom ||
            committedFilters.startTimeTo ||
            committedFilters.stateMachineFilter ||
            committedFilters.stateNameFilter ||
            committedFilters.stateStatusFilter;
    };

    const hasPendingChanges = () => {
        return pendingFilters.searchQuery !== committedFilters.searchQuery ||
            pendingFilters.statusFilter !== committedFilters.statusFilter ||
            pendingFilters.startTimeFrom !== committedFilters.startTimeFrom ||
            pendingFilters.startTimeTo !== committedFilters.startTimeTo ||
            pendingFilters.stateMachineFilter !== committedFilters.stateMachineFilter ||
            pendingFilters.stateNameFilter !== committedFilters.stateNameFilter ||
            pendingFilters.stateStatusFilter !== committedFilters.stateStatusFilter;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Search
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                        <Input
                            placeholder="Search by name or ID..."
                            value={pendingFilters.searchQuery}
                            onChange={handleSearchChange}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">Status</label>
                    <Select
                        value={pendingFilters.statusFilter || 'all'}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by status"/>
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
                </div>

                {/* Start Time From */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Start Time From
                    </label>
                    <DateTimePicker
                        date={pendingFilters.startTimeFrom}
                        onChange={handleStartTimeFromChange}
                        placeholder="Pick start date & time"
                    />
                </div>

                {/* Start Time To */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Start Time To
                    </label>
                    <DateTimePicker
                        date={pendingFilters.startTimeTo}
                        onChange={handleStartTimeToChange}
                        placeholder="Pick end date & time"
                    />
                </div>

                {/* State Machine Filter */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">State Machine ID</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Select from list..."
                            value={pendingFilters.stateMachineFilter}
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

                {/* State Name Filter (Dynamic - shown when state machine is selected) */}
                {availableStates && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600 flex items-center">
                            <Filter className="h-3 w-3 mr-1" />
                            State Name
                        </label>
                        <Select
                            value={pendingFilters.stateNameFilter || 'all'}
                            onValueChange={handleStateNameChange}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by state name"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All States</SelectItem>
                                {availableStates.usedStates.length > 0 ? (
                                    availableStates.usedStates.sort().map(stateName => (
                                        <SelectItem key={stateName} value={stateName}>
                                            {stateName}
                                        </SelectItem>
                                    ))
                                ) : (
                                    availableStates.allStates.sort().map(stateName => (
                                        <SelectItem key={stateName} value={stateName}>
                                            {stateName}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* State Status Filter (Static - shown when state machine is selected) */}
                {availableStates && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">State Status</label>
                        <Select
                            value={pendingFilters.stateStatusFilter || 'all'}
                            onValueChange={handleStateStatusChange}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by state status"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All State Statuses</SelectItem>
                                {STATE_STATUS_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
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
                    <Button
                        variant="outline"
                        onClick={clearFilters}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                )}
                {hasPendingChanges() && (
                    <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Unsaved changes
                    </span>
                )}
            </div>

            <StateMachineSelectorModal
                open={selectorOpen}
                onOpenChange={setSelectorOpen}
                onSelect={handleStateMachineSelect}
            />
        </div>
    );
}
