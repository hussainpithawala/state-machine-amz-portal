// lib/db-utils.ts (Pure Drizzle version)

import { db } from './db';
import { stateMachines, executions } from './schema';
import { count, eq, sql, desc, and, gte, isNotNull } from 'drizzle-orm';
import { subDays, startOfDay } from 'date-fns';

// Get execution statistics for dashboard

// Get execution statistics for dashboard
export async function getExecutionStats() {
    try {
        // Get total counts using Drizzle query builder (type-safe)
        const [totalExecutionsResult] = await db.select({ count: count() }).from(executions);
        const [totalStateMachinesResult] = await db.select({ count: count() }).from(stateMachines);

        // Get recent executions (last 30 days) for status breakdown
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentExecutionsQuery = await db
            .select({
                status: executions.status,
                count: count().as('count')
            })
            .from(executions)
            .where(sql`${executions.startTime} >= ${thirtyDaysAgo}`)
            .groupBy(executions.status);

        const recentExecutions = Array.isArray(recentExecutionsQuery) ? recentExecutionsQuery : [];

        // For duration stats, use a simpler approach without raw SQL
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const completedExecutionsQuery = await db
            .select({
                startTime: executions.startTime,
                endTime: executions.endTime
            })
            .from(executions)
            .where(and(
                sql`${executions.endTime} IS NOT NULL`,
                sql`${executions.startTime} >= ${sevenDaysAgo}`
            ))
            .limit(1000);

        // Handle undefined/empty results
        const completedExecutions = Array.isArray(completedExecutionsQuery) ? completedExecutionsQuery : [];

        let durationStats = { avg_duration: null, max_duration: null, min_duration: null };

        if (completedExecutions.length > 0) {
            const durations = completedExecutions
                .map(exec => {
                    if (exec.endTime && exec.startTime) {
                        return (new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()) / 1000;
                    }
                    return null;
                })
                .filter((duration): duration is number => duration !== null);

            if (durations.length > 0) {
                durationStats.avg_duration = durations.reduce((a, b) => a + b, 0) / durations.length;
                durationStats.max_duration = Math.max(...durations);
                durationStats.min_duration = Math.min(...durations);
            }
        }

        // Get recent failures
        const recentFailuresQuery = await db.query.executions.findMany({
            where: eq(executions.status, 'FAILED'),
            orderBy: [{ column: executions.startTime, direction: 'desc' }],
            limit: 10,
        });

        const recentFailures = Array.isArray(recentFailuresQuery) ? recentFailuresQuery : [];

        return {
            statusCounts: recentExecutions,
            durationStats,
            totalExecutions: totalExecutionsResult?.count || 0,
            totalStateMachines: totalStateMachinesResult?.count || 0,
            recentFailures,
        };
    } catch (error) {
        console.error('Error in getExecutionStats:', error);
        throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Get recent failed executions
export async function getRecentFailures(limit = 10) {
    try {
        const failures = await db.query.executions.findMany({
            where: eq(executions.status, 'FAILED'),
            orderBy: [desc(executions.startTime)],
            limit,
        });
        return failures;
    } catch (error) {
        console.error('Error in getRecentFailures:', error);
        throw error;
    }
}
