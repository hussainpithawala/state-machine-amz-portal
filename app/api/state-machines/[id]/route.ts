import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateMachines } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const [stateMachine] = await db
            .select()
            .from(stateMachines)
            .where(eq(stateMachines.id, id))
            .limit(1);

        if (!stateMachine) {
            return NextResponse.json(
                { error: `State machine with ID "${id}" not found` },
                { status: 404 }
            );
        }

        // Parse definition JSON safely
        let definition = stateMachine.definition;
        try {
            definition = JSON.parse(stateMachine.definition);
        } catch {
            // Keep as string if not valid JSON
        }

        return NextResponse.json({
            ...stateMachine,
            definition,
        });
    } catch (error) {
        console.error('Error fetching state machine:', error);
        return NextResponse.json(
            { error: 'Failed to fetch state machine details' },
            { status: 500 }
        );
    }
}
