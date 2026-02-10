import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// Define the actual database row type (what comes from raw SQL query)
interface StateHistoryDBRow {
    id: string;
    execution_id: string;
    execution_start_time: string;
    state_name: string;
    state_type: string;
    input: unknown; // Raw JSON from database
    output: unknown; // Raw JSON from database
    status: string;
    start_time: string;
    end_time: string | null;
    error: string;
    retry_count: number;
    sequence_number: number;
    metadata: unknown;
    created_at: string;
}


// Validation schema - only executionId is required
const stateHistoryQuerySchema = z.object({
    executionId: z.string().min(1, 'Execution ID is required'),
    executionStartTime: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const validated = stateHistoryQuerySchema.parse(Object.fromEntries(searchParams));

        // Query using only executionId - this should be sufficient
        const historyResult = await db.execute(sql`
            SELECT id,
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

        // Type assert the history array
        const typedHistory = history as unknown as StateHistoryDBRow[];

        // Calculate durations and enrich data
        const enrichedHistory = typedHistory.map(entry => {
            // Safely handle date parsing
            const parseDate = (dateStr: string | null): Date | null => {
                if (!dateStr) return null;
                try {
                    return new Date(dateStr);
                } catch {
                    return null;
                }
            };

            const endTime = parseDate(entry.end_time);
            const startTime = parseDate(entry.start_time);

            const duration = endTime && startTime
                ? endTime.getTime() - startTime.getTime()
                : null;

            // Safely stringify JSON fields
            const stringifySafe = (obj: unknown): string | null => {
                if (obj === null || obj === undefined) return null;
                try {
                    return JSON.stringify(obj);
                } catch {
                    return String(obj);
                }
            };

            return {
                ...entry,
                duration,
                inputPreview: stringifySafe(entry.input)?.substring(0, 100) || null,
                outputPreview: stringifySafe(entry.output)?.substring(0, 100) || null,
            };
        });

        // Get execution summary
        const firstState = enrichedHistory[0];
        const lastState = enrichedHistory[enrichedHistory.length - 1];

        const totalDuration = lastState.end_time && firstState.start_time
            ? new Date(lastState.end_time).getTime() - new Date(firstState.start_time).getTime()
            : null;

        return NextResponse.json({
            executionId: validated.executionId,
            executionStartTime: validated.executionStartTime,
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
