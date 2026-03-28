'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, CircleCheck, CircleX, Loader2, Trash2, Save, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface QueryResult {
    success: boolean;
    data?: any[];
    error?: string;
    rowCount?: number;
    duration?: number;
}

interface SavedQuery {
    name: string;
    query: string;
    createdAt: string;
}

export default function SQLPage() {
    const [sqlQuery, setSqlQuery] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<QueryResult | null>(null);
    const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
    const [queryName, setQueryName] = useState('');
    const [fontSize, setFontSize] = useState('14');

    const executeSQL = async () => {
        if (!sqlQuery.trim()) {
            toast.error('SQL query is empty', {
                description: 'Please enter a SQL query to execute',
            });
            return;
        }

        setIsExecuting(true);
        setResult(null);

        try {
            const startTime = performance.now();
            
            const response = await fetch('/api/sql-execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: sqlQuery }),
            });

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            setResult({
                success: true,
                data: data.rows,
                rowCount: data.rowCount,
                duration,
            });

            toast.success('Query executed successfully', {
                description: `${data.rowCount || 0} rows returned in ${duration}ms`,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to execute query';
            setResult({
                success: false,
                error: errorMessage,
            });

            toast.error('Query execution failed', {
                description: errorMessage,
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const formatSQL = () => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'UNIQUE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'NOT', 'NULL', 'AS', 'IN', 'BETWEEN', 'LIKE', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];
        
        let formatted = sqlQuery;
        keywords.forEach(keyword => {
            formatted = formatted.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), keyword);
        });
        
        setSqlQuery(formatted);
    };

    const clearAll = () => {
        setSqlQuery('');
        setResult(null);
    };

    const saveQuery = () => {
        if (!queryName.trim()) {
            toast.error('Query name is required', {
                description: 'Please enter a name for this query',
            });
            return;
        }

        const newSavedQuery: SavedQuery = {
            name: queryName,
            query: sqlQuery,
            createdAt: new Date().toISOString(),
        };

        const updated = [...savedQueries, newSavedQuery];
        setSavedQueries(updated);
        setQueryName('');

        // Save to localStorage
        localStorage.setItem('savedSqlQueries', JSON.stringify(updated));

        toast.success('Query saved', {
            description: `"${newSavedQuery.name}" has been saved`,
        });
    };

    const loadQuery = (query: string) => {
        setSqlQuery(query);
    };

    const deleteSavedQuery = (index: number) => {
        const updated = savedQueries.filter((_, i) => i !== index);
        setSavedQueries(updated);
        localStorage.setItem('savedSqlQueries', JSON.stringify(updated));
        toast.success('Query deleted');
    };

    const exportResults = () => {
        if (!result?.data || result.data.length === 0) {
            toast.error('No results to export');
            return;
        }

        const csv = [
            Object.keys(result.data[0]).join(','),
            ...result.data.map(row => 
                Object.values(row).map(value => 
                    typeof value === 'object' ? JSON.stringify(value) : String(value)
                ).join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-results-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Results exported', {
            description: 'Downloaded as CSV file',
        });
    };

    const sampleQueries = [
        { label: 'Count all linked executions', query: 'SELECT COUNT(*) FROM linked_executions;' },
        { label: 'Recent linked executions', query: 'SELECT * FROM linked_executions ORDER BY created_at DESC LIMIT 10;' },
        { label: 'State machines count', query: 'SELECT COUNT(*) as total, type FROM state_machines GROUP BY type;' },
        { label: 'Running executions', query: "SELECT execution_id, state_machine_id, name, status, start_time FROM executions WHERE status = 'RUNNING' LIMIT 10;" },
        { label: 'Execution status distribution', query: "SELECT status, COUNT(*) as count FROM executions GROUP BY status ORDER BY count DESC;" },
        { label: 'Latest state history', query: 'SELECT * FROM state_history ORDER BY start_time DESC LIMIT 10;' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">SQL Query Executor</h1>
                <p className="text-gray-500 mt-1">
                    Execute SQL queries directly against the database. Use with caution.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Query Area */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Sample Queries */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Sample Queries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {sampleQueries.map((sample, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadQuery(sample.query)}
                                        className="text-xs"
                                    >
                                        {sample.label}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* SQL Input */}
                    <Card>
                        <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">SQL Query</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Select value={fontSize} onValueChange={setFontSize}>
                                        <SelectTrigger className="w-20 h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="12">12px</SelectItem>
                                            <SelectItem value="14">14px</SelectItem>
                                            <SelectItem value="16">16px</SelectItem>
                                            <SelectItem value="18">18px</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="sm" onClick={formatSQL} disabled={isExecuting}>
                                        Format
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={clearAll} disabled={isExecuting}>
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={sqlQuery}
                                onChange={(e) => setSqlQuery(e.target.value)}
                                placeholder="Enter your SQL query here..."
                                className="font-mono min-h-[250px] resize-none"
                                style={{ fontSize: `${fontSize}px` }}
                                disabled={isExecuting}
                            />
                            <div className="flex items-center gap-2 mt-4">
                                <Button
                                    onClick={executeSQL}
                                    disabled={isExecuting || !sqlQuery.trim()}
                                    className="gap-2"
                                    size="lg"
                                >
                                    {isExecuting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Executing...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4" />
                                            Execute Query
                                        </>
                                    )}
                                </Button>
                                {result && (
                                    <Badge variant={result.success ? 'default' : 'destructive'} className="gap-2">
                                        {result.success ? (
                                            <>
                                                <CircleCheck className="h-4 w-4" />
                                                Success
                                            </>
                                        ) : (
                                            <>
                                                <CircleX className="h-4 w-4" />
                                                Failed
                                            </>
                                        )}
                                    </Badge>
                                )}
                                {result?.duration && (
                                    <span className="text-sm text-gray-500">
                                        Duration: {result.duration}ms
                                    </span>
                                )}
                                {result?.rowCount !== undefined && (
                                    <span className="text-sm text-gray-500">
                                        Rows: {result.rowCount}
                                    </span>
                                )}
                                {result?.success && result.data && result.data.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={exportResults} className="ml-auto">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    {result && (
                        <Card>
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-medium">
                                    Results {result.success && result.data ? `(${result.data.length} rows)` : ''}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="max-h-[500px] border rounded-md">
                                    {result.success ? (
                                        result.data && result.data.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            {Object.keys(result.data[0]).map((key) => (
                                                                <th
                                                                    key={key}
                                                                    className="px-4 py-2 text-left font-medium text-gray-700 border-b whitespace-nowrap"
                                                                >
                                                                    {key}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {result.data.map((row, rowIndex) => (
                                                            <tr
                                                                key={rowIndex}
                                                                className="border-b last:border-b-0 hover:bg-gray-50"
                                                            >
                                                                {Object.values(row).map((value: any, colIndex) => (
                                                                    <td
                                                                        key={colIndex}
                                                                        className="px-4 py-2 text-gray-700 max-w-xs truncate whitespace-nowrap"
                                                                        title={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                    >
                                                                        {value === null ? (
                                                                            <span className="text-gray-400 italic">NULL</span>
                                                                        ) : typeof value === 'object' ? (
                                                                            <code className="text-xs bg-gray-100 px-1 rounded">
                                                                                {JSON.stringify(value)}
                                                                            </code>
                                                                        ) : (
                                                                            String(value)
                                                                        )}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                Query executed successfully. No rows returned.
                                            </div>
                                        )
                                    ) : (
                                        <div className="p-8">
                                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                                <p className="text-red-800 font-mono text-sm whitespace-pre-wrap">
                                                    {result.error}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Saved Queries */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Save Query</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <input
                                type="text"
                                placeholder="Query name..."
                                value={queryName}
                                onChange={(e) => setQueryName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                            <Button onClick={saveQuery} className="w-full" size="sm">
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Saved Queries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                {savedQueries.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No saved queries
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {savedQueries.map((saved, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                                            >
                                                <button
                                                    onClick={() => loadQuery(saved.query)}
                                                    className="flex-1 text-left text-sm truncate"
                                                >
                                                    {saved.name}
                                                </button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => deleteSavedQuery(index)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
