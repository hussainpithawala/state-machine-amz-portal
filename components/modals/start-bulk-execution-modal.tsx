'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, Play, Package, GitBranch } from "lucide-react";
import { toast } from 'sonner';
import { TransformerSelect } from '@/components/ui/transformer-select';

interface StartBulkExecutionModalProps {
    stateMachineId: string;
    stateMachineName: string;
    onSuccess?: () => void;
}

export function StartBulkExecutionModal({
    stateMachineId,
    stateMachineName,
    onSuccess
}: StartBulkExecutionModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        namePrefix: `bulk-${stateMachineName.replace(/\s+/g, '-')}-${Date.now()}`,
        concurrency: '10',
        mode: 'concurrent' as 'concurrent' | 'sequential',
        stopOnError: false,
        inputs: JSON.stringify([], null, 2),
        doMicroBatch: true,
        microBatchSize: '5',
        orchestratorId: `bulk-orchestrator-${Date.now()}`,
        pauseThreshold: '0.1',
        resumeStrategy: 'manual' as 'manual' | 'auto',
        timeoutSeconds: '300',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null);
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
        setError(null);
    };

    const validateInputs = (): boolean => {
        try {
            const inputs = JSON.parse(formData.inputs);
            if (!Array.isArray(inputs)) {
                setError('Inputs must be a JSON array');
                return false;
            }
            return true;
        } catch {
            setError('Invalid JSON in inputs array');
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.namePrefix.trim()) {
            setError('Name prefix is required');
            return;
        }

        if (!validateInputs()) {
            return;
        }

        const concurrency = parseInt(formData.concurrency);
        const microBatchSize = parseInt(formData.microBatchSize);
        const pauseThreshold = parseFloat(formData.pauseThreshold);
        const timeoutSeconds = parseInt(formData.timeoutSeconds);

        if (isNaN(concurrency) || concurrency < 1 || concurrency > 100) {
            setError('Concurrency must be between 1 and 100');
            return;
        }

        if (formData.doMicroBatch && (isNaN(microBatchSize) || microBatchSize < 1)) {
            setError('Micro batch size must be at least 1');
            return;
        }

        if (isNaN(pauseThreshold) || pauseThreshold < 0 || pauseThreshold > 1) {
            setError('Pause threshold must be between 0 and 1');
            return;
        }

        if (isNaN(timeoutSeconds) || timeoutSeconds < 1) {
            setError('Timeout seconds must be at least 1');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const requestBody = {
                stateMachineId: stateMachineId,
                namePrefix: formData.namePrefix.trim(),
                concurrency: concurrency,
                mode: formData.mode,
                stopOnError: formData.stopOnError,
                inputs: JSON.parse(formData.inputs),
                doMicroBatch: formData.doMicroBatch,
                microBatchSize: formData.doMicroBatch ? microBatchSize : undefined,
                orchestratorId: formData.orchestratorId.trim(),
                pauseThreshold: pauseThreshold,
                resumeStrategy: formData.resumeStrategy,
                timeoutSeconds: timeoutSeconds,
            };

            const response = await fetch('/api/executions/launch-bulk', {
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

            const result = await response.json();

            toast.success(`Bulk execution started successfully!`, {
                description: `Name prefix: ${result.namePrefix || formData.namePrefix}`,
            });

            if (onSuccess) {
                onSuccess();
            }

            setOpen(false);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to launch bulk execution';
            setError(errorMessage);

            toast.error('Failed to start bulk execution', {
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
                    <Package className="h-4 w-4 mr-2" />
                    Start Bulk Execution
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Start Bulk Execution</DialogTitle>
                    <DialogDescription>
                        Launch multiple executions with custom inputs for state machine: <strong>{stateMachineName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="overflow-y-auto max-h-[70vh] pr-2 flex-1">
                        {/* Bulk Inputs Section */}
                        <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                            <h3 className="text-sm font-medium text-purple-700 flex items-center">
                                <GitBranch className="h-4 w-4 mr-2" />
                                Bulk Inputs
                            </h3>

                            <div className="space-y-2">
                                <label htmlFor="inputs" className="text-sm font-medium">
                                    Inputs Array (JSON) *
                                </label>
                                <Textarea
                                    id="inputs"
                                    name="inputs"
                                    value={formData.inputs}
                                    onChange={handleChange}
                                    placeholder='[{"orderId": "1"}, {"orderId": "2"}]'
                                    className="font-mono text-sm min-h-[200px]"
                                    disabled={loading}
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    Provide an array of JSON objects. Each object will trigger a separate execution.
                                </p>
                            </div>
                        </div>

                        {/* Bulk Configuration Section */}
                        <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                            <h3 className="text-sm font-medium text-green-700 flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                Bulk Configuration
                            </h3>

                            <div className="space-y-2">
                                <label htmlFor="namePrefix" className="text-sm font-medium">Name Prefix *</label>
                                <Input
                                    id="namePrefix"
                                    name="namePrefix"
                                    value={formData.namePrefix}
                                    onChange={handleChange}
                                    placeholder="bulk-operation"
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
                                        placeholder="10"
                                        min="1"
                                        max="100"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="mode" className="text-sm font-medium">Mode</label>
                                    <Select
                                        value={formData.mode}
                                        onValueChange={(value) => handleSelectChange('mode', value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="concurrent">Concurrent</SelectItem>
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
                                <label htmlFor="stopOnError" className="text-sm text-gray-700">
                                    Stop on Error
                                </label>
                            </div>
                        </div>

                        {/* Micro Batch Configuration Section */}
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-700 flex items-center">
                                <GitBranch className="h-4 w-4 mr-2" />
                                Micro Batch Configuration
                            </h3>

                            <div className="flex items-center space-x-2">
                                <input
                                    id="doMicroBatch"
                                    name="doMicroBatch"
                                    type="checkbox"
                                    checked={formData.doMicroBatch}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="doMicroBatch" className="text-sm text-gray-700 font-medium">
                                    Enable Micro Batching
                                </label>
                            </div>

                            {formData.doMicroBatch && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="microBatchSize" className="text-sm font-medium">Micro Batch Size</label>
                                        <Input
                                            id="microBatchSize"
                                            name="microBatchSize"
                                            type="number"
                                            value={formData.microBatchSize}
                                            onChange={handleChange}
                                            placeholder="5"
                                            min="1"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="orchestratorId" className="text-sm font-medium">Orchestrator ID</label>
                                        <Input
                                            id="orchestratorId"
                                            name="orchestratorId"
                                            value={formData.orchestratorId}
                                            onChange={handleChange}
                                            placeholder="micro-bulk-orchestrator-v1"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Advanced Configuration Section */}
                        <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                            <h3 className="text-sm font-medium text-orange-700 flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                Advanced Configuration
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="pauseThreshold" className="text-sm font-medium">Pause Threshold</label>
                                    <Input
                                        id="pauseThreshold"
                                        name="pauseThreshold"
                                        type="number"
                                        value={formData.pauseThreshold}
                                        onChange={handleChange}
                                        placeholder="0.1"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Threshold (0-1) to trigger pause
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="resumeStrategy" className="text-sm font-medium">Resume Strategy</label>
                                    <Select
                                        value={formData.resumeStrategy}
                                        onValueChange={(value) => handleSelectChange('resumeStrategy', value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="auto">Auto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="timeoutSeconds" className="text-sm font-medium">Timeout (seconds)</label>
                                <Input
                                    id="timeoutSeconds"
                                    name="timeoutSeconds"
                                    type="number"
                                    value={formData.timeoutSeconds}
                                    onChange={handleChange}
                                    placeholder="300"
                                    min="1"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                    </div>

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
                                    Start Bulk Execution
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
