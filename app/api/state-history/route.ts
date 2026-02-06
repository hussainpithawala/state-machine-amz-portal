import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateHistory } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema - only executionId is required
const stateHistoryQuerySchema = z.object({
    executionId: z.string().min(1, 'Execution ID is required'),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const validated = stateHistoryQuerySchema.parse(Object.fromEntries(searchParams));

        // Query using only executionId - this should be sufficient
        const historyResult = await db.execute(sql`
            SELECT 
                id,
                execution_id,
                execution_start_time,
                state_name,
                state_type,
                input,
                output,
                status,
                start_time,
                end_time,
                error,
                retry_count,
                sequence_number,
                metadata,
                created_at
            FROM state_history 
            WHERE execution_id = ${validated.executionId}
            ORDER BY sequence_number ASC
        `);

        const history = 'rows' in historyResult ? historyResult.rows : historyResult;

        if (history.length === 0) {
            return NextResponse.json(
                {
                    error: 'No state history found for this execution',
                    hint: 'Ensure the execution ID is correct and has state history records'
                },
                { status: 404 }
            );
        }

        // Calculate durations and enrich data
        const enrichedHistory = history.map(entry => ({
            ...entry,
            duration: entry.end_time
                ? new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()
                : null,
            inputPreview: entry.input ? JSON.stringify(entry.input).substring(0, 100) : null,
            outputPreview: entry.output ? JSON.stringify(entry.output).substring(0, 100) : null,
        }));

        // Get execution summary
        const firstState = enrichedHistory[0];
        const lastState = enrichedHistory[enrichedHistory.length - 1];
        const totalDuration = lastState.end_time
            ? new Date(lastState.end_time).getTime() - new Date(firstState.start_time).getTime()
            : null;

        return NextResponse.json({
            executionId: validated.executionId,
            executionStartTime: firstState.execution_start_time, // Include this for reference
            totalStates: enrichedHistory.length,
            totalDuration,
            states: enrichedHistory,
            summary: {
                succeeded: enrichedHistory.filter(s => s.status === 'SUCCEEDED').length,
                failed: enrichedHistory.filter(s => s.status === 'FAILED').length,
                retrying: enrichedHistory.filter(s => s.status === 'RETRYING').length,
                waiting: enrichedHistory.filter(s => s.status === 'WAITING').length,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error fetching state history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch state history' },
            { status: 500 }
        );
    }
}
