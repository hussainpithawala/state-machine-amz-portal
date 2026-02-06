// Create app/api/executions/[executionId]/start-time/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateHistory } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ executionId: string }> }
) {
    try {
        const { executionId } = await params;

        const [firstState] = await db
            .select({ executionStartTime: stateHistory.executionStartTime })
            .from(stateHistory)
            .where(eq(stateHistory.executionId, executionId))
            .orderBy(asc(stateHistory.sequenceNumber))
            .limit(1);

        if (!firstState) {
            return NextResponse.json(
                { error: 'No state history found for this execution' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            executionStartTime: firstState.executionStartTime
        });
    } catch (error) {
        console.error('Error fetching execution start time:', error);
        return NextResponse.json(
            { error: 'Failed to fetch execution start time' },
            { status: 500 }
        );
    }
}
