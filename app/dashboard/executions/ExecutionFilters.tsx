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
import { Search, Calendar, X } from 'lucide-react';

const STATUS_OPTIONS = [
    {value: 'RUNNING', label: 'Running'},
    {value: 'SUCCEEDED', label: 'Succeeded'},
    {value: 'FAILED', label: 'Failed'},
    {value: 'CANCELLED', label: 'Cancelled'},
    {value: 'TIMED_OUT', label: 'Timed Out'},
    {value: 'ABORTED', label: 'Aborted'},
    {value: 'PAUSED', label: 'Paused'},
];

const DATE_RANGE_OPTIONS = [
    {value: 'today', label: 'Today'},
    {value: '7d', label: 'Last 7 days'},
    {value: '30d', label: 'Last 30 days'},
    {value: '90d', label: 'Last 90 days'},
];

export function ExecutionFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [dateRangeFilter, setDateRangeFilter] = useState(searchParams.get('dateRange') || '30d');
    const [stateMachineFilter, setStateMachineFilter] = useState(searchParams.get('stateMachineId') || '');

    useEffect(() => {
        const params = new URLSearchParams();

        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter) params.set('status', statusFilter);
        if (dateRangeFilter) params.set('dateRange', dateRangeFilter);
        if (stateMachineFilter) params.set('stateMachineId', stateMachineFilter);

        const queryString = params.toString();
        const url = `/dashboard/executions${queryString ? `?${queryString}` : ''}`;
        router.push(url);
    }, [searchQuery, statusFilter, dateRangeFilter, stateMachineFilter, router]);

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

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDateRangeFilter('30d');
        setStateMachineFilter('');
    };

    const hasActiveFilters = () => {
        return searchQuery || statusFilter || stateMachineFilter || dateRangeFilter !== '30d';
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
                {hasActiveFilters() && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={clearFilters}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
