'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Play, Link2, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
// ✅ Import the new reusable component
import { TransformerSelect } from '@/components/ui/transformer-select';

interface StartExecutionModalProps {
    stateMachineId: string;
    stateMachineName: string;
    onSuccess?: () => void;
}

export function StartExecutionModal({
                                        stateMachineId,
                                        stateMachineName,
                                        onSuccess
                                    }: StartExecutionModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: `execution-${stateMachineName.replace(/\s+/g, '-')}-${Date.now()}`,
        input: JSON.stringify({
            "order": {
                "orderId": `ORD-${Date.now()}`,
                "customerId": "CUST-001",
                "items": ["item_1", "item_2"],
                "timestamp": Math.floor(Date.now() / 1000),
                "total": 150
            }
        }, null, 2),
        sourceExecutionId: '',
        sourceStateName: '',
        sourceInputTransformer: '', // ✅ Now only accepts transformer IDs from dropdown
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleTransformerChange = (value: string) => {
        // Convert "none" to empty string for API compatibility
        // This ensures sourceInputTransformer is not sent when "None" is selected
        const actualValue = value === "none" ? "" : value;
        setFormData(prev => ({ ...prev, sourceInputTransformer: actualValue }));
        setError(null);
    };

    const validateInput = (input: string): boolean => {
        try {
            JSON.parse(input);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Execution name is required');
            return;
        }

        const hasInput = formData.input.trim() !== '';
        const hasSourceExecutionId = formData.sourceExecutionId.trim() !== '';

        if (!hasInput && !hasSourceExecutionId) {
            setError('Either Execution Input OR Source Execution ID must be provided');
            return;
        }

        if (hasInput && !validateInput(formData.input)) {
            setError('Invalid JSON in execution input');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const requestBody: any = {
                stateMachineId: stateMachineId,
                name: formData.name.trim(),
            };

            if (hasInput) {
                requestBody.input = JSON.parse(formData.input);
            }

            if (hasSourceExecutionId) {
                requestBody.sourceExecutionId = formData.sourceExecutionId.trim();
            }

            if (formData.sourceStateName.trim()) {
                requestBody.sourceStateName = formData.sourceStateName.trim();
            }

            // ✅ Only send transformer if selected (not empty string)
            if (formData.sourceInputTransformer.trim()) {
                requestBody.sourceInputTransformer = formData.sourceInputTransformer.trim();
            }

            const response = await fetch('/api/executions/launch', {
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

            toast.success(`Execution "${launched.name}" started successfully!`, {
                description: `Execution ID: ${launched.executionId}`,
            });

            if (onSuccess) {
                onSuccess();
            }

            setOpen(false);
            setFormData({
                name: `execution-${stateMachineName.replace(/\s+/g, '-')}-${Date.now()}`,
                input: JSON.stringify({
                    "order": {
                        "orderId": `ORD-${Date.now()}`,
                        "customerId": "CUST-001",
                        "items": ["item_1", "item_2"],
                        "timestamp": Math.floor(Date.now() / 1000),
                        "total": 150
                    }
                }, null, 2),
                sourceExecutionId: '',
                sourceStateName: '',
                sourceInputTransformer: '',
            });
            setShowAdvancedOptions(false);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to launch execution';
            setError(errorMessage);

            toast.error('Failed to start execution', {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Start Execution
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Start New Execution</DialogTitle>
                    <DialogDescription>
                        Launch a new execution for state machine: <strong>{stateMachineName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Execution Name</label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="execution-order-processing-123"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="input" className="text-sm font-medium">
                                Execution Input (JSON) - <em>Required if not using Source Execution</em>
                            </label>
                            <Textarea
                                id="input"
                                name="input"
                                value={formData.input}
                                onChange={handleChange}
                                placeholder="Enter valid JSON input data (leave empty if using Source Execution)"
                                className="font-mono text-sm min-h-[200px]"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500">
                                Provide input data as JSON, OR leave empty and use Source Execution below
                            </p>
                        </div>

                        {/* Advanced Options Toggle */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                                <GitBranch className="h-3 w-3 ml-1" />
                            </button>
                        </div>

                        {/* Advanced Options */}
                        {showAdvancedOptions && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Resume from Another Execution (Optional)
                                </h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Provide a Source Execution ID to resume execution from another workflow.
                                    Source State Name and Input Transformer are optional.
                                </p>

                                <div className="space-y-2">
                                    <label htmlFor="sourceExecutionId" className="text-sm font-medium">
                                        Source Execution ID - <em>Required if not providing Input</em>
                                    </label>
                                    <Input
                                        id="sourceExecutionId"
                                        name="sourceExecutionId"
                                        value={formData.sourceExecutionId}
                                        onChange={handleChange}
                                        placeholder="state-machine-A-exec-123456789"
                                        disabled={loading}
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
                                </div>

                                {/* ✅ REUSABLE TRANSFORMER SELECT COMPONENT */}
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
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                    </form>
                </div>

                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} onClick={handleSubmit}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Execution
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
