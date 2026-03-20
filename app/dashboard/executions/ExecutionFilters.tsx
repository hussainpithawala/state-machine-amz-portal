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
import { Search, Calendar, X, Filter } from 'lucide-react';

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

const DATE_RANGE_OPTIONS = [
    {value: 'today', label: 'Today'},
    {value: '7d', label: 'Last 7 days'},
    {value: '30d', label: 'Last 30 days'},
    {value: '90d', label: 'Last 90 days'},
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

    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [dateRangeFilter, setDateRangeFilter] = useState(searchParams.get('dateRange') || '30d');
    const [stateMachineFilter, setStateMachineFilter] = useState(searchParams.get('stateMachineId') || '');
    const [stateNameFilter, setStateNameFilter] = useState(searchParams.get('stateName') || '');
    const [stateStatusFilter, setStateStatusFilter] = useState(searchParams.get('stateStatus') || '');
    
    const [availableStates, setAvailableStates] = useState<StateMachineState | null>(null);
    const [loadingStates, setLoadingStates] = useState(false);

    // Fetch available states when state machine filter changes
    useEffect(() => {
        if (stateMachineFilter) {
            fetchAvailableStates(stateMachineFilter);
        } else {
            setAvailableStates(null);
            setStateNameFilter('');
            setStateStatusFilter('');
        }
    }, [stateMachineFilter]);

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

    useEffect(() => {
        const params = new URLSearchParams();

        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter) params.set('status', statusFilter);
        if (dateRangeFilter) params.set('dateRange', dateRangeFilter);
        if (stateMachineFilter) params.set('stateMachineId', stateMachineFilter);
        if (stateNameFilter) params.set('stateName', stateNameFilter);
        if (stateStatusFilter) params.set('stateStatus', stateStatusFilter);

        const queryString = params.toString();
        const url = `/dashboard/executions${queryString ? `?${queryString}` : ''}`;
        router.push(url);
    }, [searchQuery, statusFilter, dateRangeFilter, stateMachineFilter, stateNameFilter, stateStatusFilter, router]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value === 'all' ? '' : value);
    };

    const handleDateRangeChange = (value: string) => {
        setDateRangeFilter(value);
    };

    const handleStateMachineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStateMachineFilter(e.target.value);
    };

    const handleStateNameChange = (value: string) => {
        setStateNameFilter(value === 'all' ? '' : value);
    };

    const handleStateStatusChange = (value: string) => {
        setStateStatusFilter(value === 'all' ? '' : value);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDateRangeFilter('30d');
        setStateMachineFilter('');
        setStateNameFilter('');
        setStateStatusFilter('');
    };

    const hasActiveFilters = () => {
        return searchQuery || statusFilter || stateMachineFilter || dateRangeFilter !== '30d' || stateNameFilter || stateStatusFilter;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
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

            {/* Date Range Filter */}
            <Select
                value={dateRangeFilter}
                onValueChange={handleDateRangeChange}
            >
                <SelectTrigger className="w-full">
                    <Calendar className="h-4 w-4 mr-2"/>
                    <SelectValue placeholder="Select date range"/>
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
            </div>

            {/* State Name Filter (Dynamic - shown when state machine is selected) */}
            {availableStates && (
                <Select
                    value={stateNameFilter || 'all'}
                    onValueChange={handleStateNameChange}
                >
                    <SelectTrigger className="w-full">
                        <Filter className="h-4 w-4 mr-2"/>
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
            )}

            {/* State Status Filter (Static - shown when state machine is selected) */}
            {availableStates && (
                <Select
                    value={stateStatusFilter || 'all'}
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
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters() && (
                <div className="flex items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                </div>
            )}
        </div>
    );
}
