'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Filter, Layers, Loader2, Play, StopCircle, Zap, GitBranch } from "lucide-react";
import { toast } from 'sonner';
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { TransformerSelect } from '@/components/ui/transformer-select';

interface StartBatchExecutionModalProps {
    stateMachineId: string;
    stateMachineName: string;
    onSuccess?: () => void;
}

export function StartBatchExecutionModal({
                                             stateMachineId,
                                             stateMachineName,
                                             onSuccess
                                         }: StartBatchExecutionModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        sourceStateMachineId: '',
        sourceStateName: '',
        sourceInputTransformer: '',
        status: '',
        startTimeFrom: null as Date | null,
        startTimeTo: null as Date | null,
        namePattern: '',
        limit: '10',
        namePrefix: `batch-${stateMachineName.replace(/\s+/g, '-')}-${Date.now()}`,
        concurrency: '5',
        mode: 'concurrent' as 'distributed' | 'concurrent' | 'sequential',
        stopOnError: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null);
    };

    const handleDateChange = (name: string, date: Date | null | undefined) => {
        setFormData(prev => ({
            ...prev,
            [name]: date
        }));
        setError(null);
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleTransformerChange = (value: string) => {
        const actualValue = value === "none" ? "" : value;
        setFormData(prev => ({ ...prev, sourceInputTransformer: actualValue }));
        setError(null);
    };

    // ✅ CORRECTED: Remove onClick from submit button, let form handle it
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.sourceStateMachineId.trim()) {
            setError('Source State Machine ID is required');
            return;
        }

        if (!formData.namePrefix.trim()) {
            setError('Name prefix is required');
            return;
        }

        const concurrency = parseInt(formData.concurrency);
        const limit = parseInt(formData.limit);

        if (isNaN(concurrency) || concurrency < 1 || concurrency > 100) {
            setError('Concurrency must be between 1 and 100');
            return;
        }

        if (isNaN(limit) || limit < 1 || limit > 1000) {
            setError('Limit must be between 1 and 1000');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const requestBody: any = {
                stateMachineId: stateMachineId,
                filter: {
                    sourceStateMachineId: formData.sourceStateMachineId.trim(),
                },
                namePrefix: formData.namePrefix.trim(),
                concurrency: concurrency,
                mode: formData.mode,
                stopOnError: formData.stopOnError,
            };

            if (formData.status) {
                requestBody.filter.status = formData.status;
            }

            if (formData.sourceStateName.trim()) {
                requestBody.filter.sourceStateName = formData.sourceStateName.trim();
            }

            if (formData.sourceInputTransformer.trim()) {
                requestBody.filter.sourceInputTransformer = formData.sourceInputTransformer.trim();
            }

            if (formData.startTimeFrom) {
                requestBody.filter.startTimeFrom = Math.floor(formData.startTimeFrom.getTime() / 1000);
            }

            if (formData.startTimeTo) {
                requestBody.filter.startTimeTo = Math.floor(formData.startTimeTo.getTime() / 1000);
            }

            if (formData.namePattern) {
                requestBody.filter.namePattern = formData.namePattern;
            }

            requestBody.filter.limit = limit;

            const response = await fetch('/api/executions/launch-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const launched = await response.json();

            toast.success(`Batch execution started successfully!`, {
                description: `Name prefix: ${launched.namePrefix}`,
            });

            if (onSuccess) {
                onSuccess();
            }

            setOpen(false);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to launch batch execution';
            setError(errorMessage);

            toast.error('Failed to start batch execution', {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Layers className="h-4 w-4 mr-2" />
                    Start Batch Execution
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Start Batch Execution</DialogTitle>
                    <DialogDescription>
                        Launch multiple executions for state machine: <strong>{stateMachineName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {/* ✅ FORM WRAPS THE SCROLLABLE CONTENT */}
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="overflow-y-auto max-h-[70vh] pr-2 flex-1">
                        {/* Source Filter Section */}
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-700 flex items-center">
                                <Filter className="h-4 w-4 mr-2" />
                                Source Executions Filter
                            </h3>

                            <div className="space-y-2">
                                <label htmlFor="sourceStateMachineId" className="text-sm font-medium">
                                    Source State Machine ID *
                                </label>
                                <Input
                                    id="sourceStateMachineId"
                                    name="sourceStateMachineId"
                                    value={formData.sourceStateMachineId}
                                    onChange={handleChange}
                                    placeholder="state-machine-A"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="sourceStateName" className="text-sm font-medium">
                                    Source State Name (Optional)
                                </label>
                                <Input
                                    id="sourceStateName"
                                    name="sourceStateName"
                                    value={formData.sourceStateName}
                                    onChange={handleChange}
                                    placeholder="IngestData"
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500">
                                    Specify the state name from which to resume execution
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="sourceInputTransformer" className="text-sm font-medium">
                                    Source Input Transformer (Optional)
                                </label>
                                <TransformerSelect
                                    value={formData.sourceInputTransformer}
                                    onChange={handleTransformerChange}
                                    disabled={loading}
                                    placeholder="Select a transformer..."
                                />
                                <p className="text-xs text-gray-500">
                                    Transform input data from source executions before processing
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="status" className="text-sm font-medium">Status</label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange('status', value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RUNNING">Running</SelectItem>
                                            <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
                                            <SelectItem value="FAILED">Failed</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                            <SelectItem value="TIMED_OUT">Timed Out</SelectItem>
                                            <SelectItem value="ABORTED">Aborted</SelectItem>
                                            <SelectItem value="PAUSED">Paused</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="limit" className="text-sm font-medium">Limit</label>
                                    <Input
                                        id="limit"
                                        name="limit"
                                        type="number"
                                        value={formData.limit}
                                        onChange={handleChange}
                                        placeholder="10"
                                        min="1"
                                        max="1000"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="startTimeFrom" className="text-sm font-medium">
                                        Start Time From
                                    </label>
                                    <DateTimePicker
                                        date={formData.startTimeFrom}
                                        onChange={(date) => handleDateChange('startTimeFrom', date)}
                                        placeholder="Pick start date & time"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="startTimeTo" className="text-sm font-medium">
                                        Start Time To
                                    </label>
                                    <DateTimePicker
                                        date={formData.startTimeTo}
                                        onChange={(date) => handleDateChange('startTimeTo', date)}
                                        placeholder="Pick end date & time"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="namePattern" className="text-sm font-medium">Name Pattern</label>
                                <Input
                                    id="namePattern"
                                    name="namePattern"
                                    value={formData.namePattern}
                                    onChange={handleChange}
                                    placeholder="execution-*"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Batch Configuration Section */}
                        <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                            <h3 className="text-sm font-medium text-green-700 flex items-center">
                                <Zap className="h-4 w-4 mr-2" />
                                Batch Configuration
                            </h3>

                            <div className="space-y-2">
                                <label htmlFor="namePrefix" className="text-sm font-medium">Name Prefix *</label>
                                <Input
                                    id="namePrefix"
                                    name="namePrefix"
                                    value={formData.namePrefix}
                                    onChange={handleChange}
                                    placeholder="test-batch-1"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="concurrency" className="text-sm font-medium">Concurrency</label>
                                    <Input
                                        id="concurrency"
                                        name="concurrency"
                                        type="number"
                                        value={formData.concurrency}
                                        onChange={handleChange}
                                        placeholder="5"
                                        min="1"
                                        max="100"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="mode" className="text-sm font-medium">Mode</label>
                                    <Select
                                        value={formData.mode}
                                        onValueChange={(value) => handleSelectChange('mode', value as any)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="concurrent">Concurrent</SelectItem>
                                            <SelectItem value="distributed">Distributed</SelectItem>
                                            <SelectItem value="sequential">Sequential</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    id="stopOnError"
                                    name="stopOnError"
                                    type="checkbox"
                                    checked={formData.stopOnError}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="stopOnError" className="text-sm text-gray-700 flex items-center">
                                    <StopCircle className="h-4 w-4 mr-1 text-red-500" />
                                    Stop on Error
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* ✅ FOOTER OUTSIDE SCROLLABLE AREA - NO onClick handler */}
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Batch Execution
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
