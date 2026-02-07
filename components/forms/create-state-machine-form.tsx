'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, AlertCircle, CheckCircle2} from 'lucide-react';
import {toast} from "sonner"; // ✅ Import from sonner

interface CreateStateMachineFormProps {
    onSuccess?: (stateMachineId: string) => void;
}

export function CreateStateMachineForm({onSuccess}: CreateStateMachineFormProps) {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        definition: JSON.stringify({
            "Comment": "Enter your state machine definition",
            "StartAt": "InitialState",
            "States": {
                "InitialState": {
                    "Type": "Pass",
                    "End": true
                }
            }
        }, null, 2),
        type: 'STANDARD',
        version: '1.0',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setError(null);
        setSuccess(false);
    };

    const validateDefinition = (definition: string): boolean => {
        try {
            JSON.parse(definition);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateDefinition(formData.definition)) {
            setError('Invalid JSON in state machine definition');
            return;
        }

        if (!formData.id.trim()) {
            setError('State machine ID is required');
            return;
        }

        if (!formData.name.trim()) {
            setError('State machine name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/state-machines/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: formData.id.trim(),
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    definition: JSON.parse(formData.definition),
                    type: formData.type || 'STANDARD',
                    version: formData.version || '1.0',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const created = await response.json();
            setSuccess(true);
            // ✅ Use Sonner toast
            toast.success(`State machine "${created.name}" created successfully!`);

            if (onSuccess) {
                onSuccess(created.id);
            }

            // Reset form after successful creation
            setFormData({
                id: '',
                name: '',
                description: '',
                definition: JSON.stringify({
                    "Comment": "Enter your state machine definition",
                    "StartAt": "InitialState",
                    "States": {
                        "InitialState": {
                            "Type": "Pass",
                            "End": true
                        }
                    }
                }, null, 2),
                type: 'STANDARD',
                version: '1.0',
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create state machine';
            setError(errorMessage);
            toast.error(`error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New State Machine</CardTitle>
                <CardDescription>
                    Define a new state machine workflow that can be executed through the system.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert variant="default" className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>State machine created successfully!</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="id" className="text-sm font-medium">State Machine ID</label>
                        <Input
                            id="id"
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            placeholder="order-processing-flow"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Order Processing Flow"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <Input
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="A state machine to simulate order flow"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="type" className="text-sm font-medium">Type</label>
                        <Input
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            placeholder="STANDARD"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="version" className="text-sm font-medium">Version</label>
                        <Input
                            id="version"
                            name="version"
                            value={formData.version}
                            onChange={handleChange}
                            placeholder="1.0"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="definition" className="text-sm font-medium">State Machine Definition
                            (JSON)</label>
                        <Textarea
                            id="definition"
                            name="definition"
                            value={formData.definition}
                            onChange={handleChange}
                            placeholder="Enter valid JSON state machine definition"
                            className="font-mono text-sm h-96"
                            disabled={loading}
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Must be valid AWS Step Functions-compatible JSON definition
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                Creating...
                            </>
                        ) : (
                            'Create State Machine'
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
