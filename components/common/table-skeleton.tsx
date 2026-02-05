import { Card } from '@/components/ui/card';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({ rows = 10, columns = 6 }: TableSkeletonProps) {
    return (
        <div className="space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <Card className="overflow-hidden">
                <table className="w-full">
                    <thead>
                    <tr className="border-b border-gray-200">
                        {[...Array(columns)].map((_, i) => (
                            <th key={i} className="h-12 px-4 text-left">
                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {[...Array(rows)].map((_, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                            {[...Array(columns)].map((_, colIndex) => (
                                <td key={colIndex} className="h-16 px-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
