// app/dashboard/linked-executions/page.tsx
import { Suspense } from 'react';
import { LinkedExecutionsFilters } from './LinkedExecutionsFilters';
import { LinkedExecutionsList } from './LinkedExecutionsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon } from 'lucide-react';

export default async function LinkedExecutionsPage({
    searchParams,
}: {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        sourceStateMachineId?: string;
        sourceExecutionId?: string;
        sourceStateName?: string;
        inputTransformerName?: string;
        targetStateMachineName?: string;
        targetExecutionId?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
    }>;
}) {
    const resolvedSearchParams = await searchParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Linked Executions</h1>
                <p className="text-gray-500 mt-1">
                    Track execution links between state machines
                </p>
            </div>

            {/* Filters */}
            <Suspense fallback={
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </CardContent>
                </Card>
            }>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LinkedExecutionsFilters />
                    </CardContent>
                </Card>
            </Suspense>

            {/* Linked Executions List */}
            <Suspense fallback={
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <LinkIcon className="h-5 w-5 mr-2 text-blue-500"/>
                            Linked Executions List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
                                    <div className="space-y-2 flex-1">
                                        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"/>
                                        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"/>
                                    </div>
                                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"/>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            }>
                <LinkedExecutionsList searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    );
}
