import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateHistory } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema
const stateHistoryQuerySchema = z.object({
    executionId: z.string().min(1, 'Execution ID is required'),
    executionStartTime: z.string().min(1, 'Execution start time is required'),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const validated = stateHistoryQuerySchema.parse(Object.fromEntries(searchParams));

        // Convert ISO string to Date
        const startTime = new Date(validated.executionStartTime);

        // Fetch state history entries
        const history = await db
            .select()
            .from(stateHistory)
            .where(
                and(
                    eq(stateHistory.executionId, validated.executionId),
                    eq(stateHistory.executionStartTime, startTime)
                )
            )
            .orderBy(asc(stateHistory.sequenceNumber));

        if (history.length === 0) {
            return NextResponse.json(
                {
                    error: 'No state history found for this execution',
                    hint: 'Ensure executionStartTime matches exactly with database value'
                },
                { status: 404 }
            );
        }

        // Calculate durations and enrich data
        const enrichedHistory = history.map(entry => ({
            ...entry,
            duration: entry.endTime
                ? new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()
                : null,
            inputPreview: entry.input ? JSON.stringify(entry.input).substring(0, 100) : null,
            outputPreview: entry.output ? JSON.stringify(entry.output).substring(0, 100) : null,
        }));

        // Get execution summary
        const firstState = enrichedHistory[0];
        const lastState = enrichedHistory[enrichedHistory.length - 1];
        const totalDuration = lastState.endTime
            ? new Date(lastState.endTime).getTime() - new Date(firstState.startTime).getTime()
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
