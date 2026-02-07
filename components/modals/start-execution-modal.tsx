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
import { Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

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
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

        if (!validateInput(formData.input)) {
            setError('Invalid JSON in execution input');
            return;
        }

        if (!formData.name.trim()) {
            setError('Execution name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/executions/launch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stateMachineId: stateMachineId,
                    name: formData.name.trim(),
                    input: JSON.parse(formData.input),
                }),
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
            // Reset form
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
            });

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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Start New Execution</DialogTitle>
                    <DialogDescription>
                        Launch a new execution for state machine: <strong>{stateMachineName}</strong>
                    </DialogDescription>
                </DialogHeader>
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
                        <label htmlFor="input" className="text-sm font-medium">Execution Input (JSON)</label>
                        <Textarea
                            id="input"
                            name="input"
                            value={formData.input}
                            onChange={handleChange}
                            placeholder="Enter valid JSON input data"
                            className="font-mono text-sm h-64"
                            disabled={loading}
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Must be valid JSON that matches your state machine's expected input format
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
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
                                    Start Execution
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
