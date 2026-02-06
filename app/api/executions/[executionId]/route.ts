import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { executions } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ executionId: string }> }
) {
    try {
        const { executionId } = await params;

        const [execution] = await db
            .select()
            .from(executions)
            .where(eq(executions.executionId, executionId))
            .orderBy(desc(executions.startTime))
            .limit(1);

        if (!execution) {
            return NextResponse.json(
                { error: `Execution with ID "${executionId}" not found` },
                { status: 404 }
            );
        }

        return NextResponse.json(execution);
    } catch (error) {
        console.error('Error fetching execution:', error);
        return NextResponse.json(
            { error: 'Failed to fetch execution details' },
            { status: 500 }
        );
    }
}
