import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateMachines, executions } from '@/lib/schema';
import {count, desc, eq, gte, sql, and, isNotNull} from 'drizzle-orm';

export async function GET() {
    try {
        // Calculate date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        // Get total counts with 30-day filter for performance
        const [totalExecutionsResult] = await db
            .select({ count: count() })
            .from(executions)
            .where(gte(executions.startTime, thirtyDaysAgo));
        
        const [totalStateMachinesResult] = await db
            .select({ count: count() })
            .from(stateMachines);

        // Get recent failures (limit to avoid issues)
        let recentFailures: { name: string; metadata: unknown; createdAt: Date; updatedAt: Date; executionId: string; stateMachineId: string; input: unknown; output: unknown; status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT" | "ABORTED" | "PAUSED"; startTime: Date; endTime: Date | null; currentState: string; error: string | null; }[] = [];
        try {
            recentFailures = await db.query.executions.findMany({
                where: eq(executions.status, 'FAILED'),
                orderBy: [desc(executions.startTime)],
                limit: 10,
            });
        } catch (error) {
            console.warn('Failed to fetch recent failures:', error);
            recentFailures = [];
        }

        // Get status counts for last 30 days
        let statusCountsResult: { status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT" | "ABORTED" | "PAUSED"; count: number; }[] = [];
        try {
            statusCountsResult = await db
                .select({
                    status: executions.status,
                    count: sql<number>`count(*)::int`,
                })
                .from(executions)
                .where(gte(executions.startTime, thirtyDaysAgo))
                .groupBy(executions.status);
        } catch (error) {
            console.warn('Failed to fetch status counts:', error);
            statusCountsResult = [];
        }

        // Get duration stats for last 7 days
        let durationStats = {
            avg_duration: null as number | null,
            max_duration: null as number | null,
            min_duration: null as number | null,
        };
        try {
            const [durationResult] = await db
                .select({
                    avg_duration: sql<number>`EXTRACT(EPOCH FROM avg(end_time - start_time))::numeric(10,2)`,
                    max_duration: sql<number>`EXTRACT(EPOCH FROM max(end_time - start_time))::numeric(10,2)`,
                    min_duration: sql<number>`EXTRACT(EPOCH FROM min(end_time - start_time))::numeric(10,2)`,
                })
                .from(executions)
                .where(
                    and(
                        eq(executions.status, 'SUCCEEDED'),
                        gte(executions.startTime, sevenDaysAgo),
                        isNotNull(executions.endTime)
                    )
                );
            
            durationStats = {
                avg_duration: durationResult?.avg_duration || null,
                max_duration: durationResult?.max_duration || null,
                min_duration: durationResult?.min_duration || null,
            };
        } catch (error) {
            console.warn('Failed to fetch duration stats:', error);
        }

        return NextResponse.json({
            statusCounts: statusCountsResult,
            durationStats,
            totalExecutions: totalExecutionsResult?.count || 0,
            totalStateMachines: totalStateMachinesResult?.count || 0,
            recentFailures,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('Critical error in dashboard stats:', error);

        // Return minimal fallback data even if everything fails
        return NextResponse.json({
            statusCounts: [],
            durationStats: {
                avg_duration: null,
                max_duration: null,
                min_duration: null,
            },
            totalExecutions: 0,
            totalStateMachines: 0,
            recentFailures: [],
            timestamp: new Date().toISOString(),
        });
    }
}
