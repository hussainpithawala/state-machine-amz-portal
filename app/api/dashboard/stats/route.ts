import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateMachines, executions } from '@/lib/schema';
import {count, desc, eq, gte, sql} from 'drizzle-orm';

export async function GET() {
    try {
        // Get total counts (these should always work)
        const [totalExecutionsResult] = await db.select({ count: count() }).from(executions);
        const [totalStateMachinesResult] = await db.select({ count: count() }).from(stateMachines);

        // Get recent failures (limit to avoid issues)
        let recentFailures: { name: string; metadata: unknown; createdAt: Date; updatedAt: Date; executionId: string; stateMachineId: string; input: unknown; output: unknown; status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT" | "ABORTED" | "PAUSED"; startTime: Date; endTime: Date | null; currentState: string; error: string | null; }[] = [];
        try {
            recentFailures = await db.query.executions.findMany({
                where: eq(executions.status, 'FAILED'),
                orderBy: [desc(executions.startTime)], // ✅ Correct syntax
                limit: 5,
            });
        } catch (error) {
            console.warn('Failed to fetch recent failures:', error);
            recentFailures = [];
        }

        // Get status counts (simplified)
        let statusCounts: { status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT" | "ABORTED" | "PAUSED"; count: number; }[] = [];
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const statusCounts = await db
                .select({
                    status: executions.status,
                    count: sql<number>`count(*)::int`.mapWith(Number),
                })
                .from(executions)
                .where(gte(executions.startTime, thirtyDaysAgo)) // ✅ Correct syntax
                .groupBy(executions.status);
            console.log('statusCounts:', statusCounts);
        } catch (error) {
            console.warn('Failed to fetch status counts:', error);
            statusCounts = [];
        }

        return NextResponse.json({
            statusCounts: statusCounts || [],
            durationStats: {
                avg_duration: null,
                max_duration: null,
                min_duration: null,
            },
            totalExecutions: totalExecutionsResult?.count || 0,
            totalStateMachines: totalStateMachinesResult?.count || 0,
            recentFailures: recentFailures || [],
            timestamp: new Date().toISOString(),
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
