// lib/db-utils.ts (Pure Drizzle version)

import { db } from './db';
import { stateMachines, executions } from './schema';
import { count, eq, sql, desc, and, gte, isNotNull } from 'drizzle-orm';
import { subDays, startOfDay } from 'date-fns';

// Get execution statistics for dashboard
export async function getExecutionStats() {
    try {
        // Get total counts
        const [totalExecutionsResult] = await db.select({ count: count() }).from(executions);
        const [totalStateMachinesResult] = await db.select({ count: count() }).from(stateMachines);

        // Get recent executions (last 30 days) for status breakdown
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentExecutions = await db
            .select({ status: executions.status, count: count() })
            .from(executions)
            .where(gte(executions.startTime, thirtyDaysAgo))
            .groupBy(executions.status);

        // Get recent completed executions for duration stats (last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7);
        const durationStatsResult = await db.execute(sql`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration,
        MAX(EXTRACT(EPOCH FROM (end_time - start_time))) as max_duration,
        MIN(EXTRACT(EPOCH FROM (end_time - start_time))) as min_duration
      FROM executions
      WHERE end_time IS NOT NULL 
        AND start_time >= ${sevenDaysAgo}
    `);

        const durationStats = 'rows' in durationStatsResult
            ? durationStatsResult.rows[0]
            : durationStatsResult[0];

        return {
            statusCounts: recentExecutions,
            durationStats,
            totalExecutions: totalExecutionsResult?.count || 0,
            totalStateMachines: totalStateMachinesResult?.count || 0,
        };
    } catch (error) {
        console.error('Error in getExecutionStats:', error);
        throw error;
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
