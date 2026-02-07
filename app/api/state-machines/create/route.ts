import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateMachines } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for state machine creation
const createStateMachineSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    definition: z.record(z.any()), // Accept any valid JSON object
    type: z.string().optional().default('STANDARD'),
    version: z.string().optional().default('1.0'),
    metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = createStateMachineSchema.parse(body);

        // Forward to downstream service (which handles persistence)
        const serviceUrl = process.env.STATE_MACHINE_SERVICE_URL || 'http://localhost:9090';

        const downstreamResponse = await fetch(`${serviceUrl}/state-machines/api/v1/state-machines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validated),
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!downstreamResponse.ok) {
            const errorText = await downstreamResponse.text();
            console.error('Downstream service error:', errorText);

            return NextResponse.json(
                {
                    error: `Failed to create state machine in downstream service`,
                    details: errorText,
                    statusCode: downstreamResponse.status
                },
                { status: downstreamResponse.status }
            );
        }

        // Return the response from the downstream service directly
        const created = await downstreamResponse.json();
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating state machine:', error);
        return NextResponse.json(
            { error: 'Failed to create state machine' },
            { status: 500 }
        );
    }
}
