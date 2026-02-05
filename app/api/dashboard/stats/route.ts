import { NextResponse } from 'next/server';
import { getExecutionStats, getRecentFailures } from '@/lib/db-utils';

export async function GET() {
    try {
        const [stats, recentFailures] = await Promise.all([
            getExecutionStats(),
            getRecentFailures(5)
        ]);

        return NextResponse.json({
            ...stats,
            recentFailures,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard statistics' },
            { status: 500 }
        );
    }
}
