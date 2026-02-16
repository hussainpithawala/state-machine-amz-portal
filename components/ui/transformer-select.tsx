'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

interface Transformer {
    id: string;
    name: string;
    description?: string;
}

interface TransformerSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function TransformerSelect({
                                      value,
                                      onChange,
                                      disabled = false,
                                      placeholder = "Select a transformer..."
                                  }: TransformerSelectProps) {
    const [transformers, setTransformers] = useState<Transformer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransformers = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/transformers');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch transformers`);
            }

            const data = await response.json();
            setTransformers(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load transformers';
            console.error('Error fetching transformers:', err);
            setError(errorMessage);
            toast.error('Failed to load transformers', {
                description: 'Please try again or contact support',
                duration: 5000
            });
            setTransformers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransformers();
    }, []);

    const handleRetry = () => {
        fetchTransformers();
    };

    if (error) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded-md bg-red-50">
                    <span className="text-sm text-red-700">Failed to load transformers</span>
                    <button
                        onClick={handleRetry}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>Retry</span>
                    </button>
                </div>
                <Select value="" onValueChange={() => {}} disabled>
                    <SelectTrigger>
                        <SelectValue placeholder="No transformers available" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="error">No transformers loaded</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {loading && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Loading transformers...</span>
                </div>
            )}

            <Select
                value={value}
                onValueChange={onChange}
                disabled={disabled || loading}
            >
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {/* ✅ ONLY show transformers - NO empty string values */}
                    {transformers.map((transformer) => (
                        <SelectItem key={transformer.id} value={transformer.id}>
                            <div className="flex flex-col">
                                <span className="font-medium">{transformer.name}</span>
                                {transformer.description && (
                                    <span className="text-xs text-gray-500 mt-0.5">
                    {transformer.description}
                  </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}

                    {transformers.length > 0 && (
                        <SelectItem value="none">None</SelectItem>
                    )}

                    {/* ✅ REMOVED the problematic empty string SelectItem */}
                    {/* If you need a "None" option, use a non-empty value like "none" */}
                </SelectContent>
            </Select>

            {!loading && transformers.length === 0 && !error && (
                <p className="text-xs text-gray-500">
                    No transformers configured in the system
                </p>
            )}
        </div>
    );
}
