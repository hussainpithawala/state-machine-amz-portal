import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for batch execution launch
const launchBatchExecutionSchema = z.object({
    stateMachineId: z.string().min(1, 'State Machine ID is required'),
    filter: z.object({
        sourceStateMachineId: z.string().min(1, 'Source State Machine ID is required'),
        status: z.enum(['RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT', 'ABORTED', 'PAUSED']).optional(),
        startTimeFrom: z.number().int().optional(),
        startTimeTo: z.number().int().optional(),
        namePattern: z.string().optional(),
        limit: z.number().int().min(1).max(1000).optional().default(10),
    }),
    namePrefix: z.string().min(1, 'Name prefix is required'),
    concurrency: z.number().int().min(1).max(100).optional().default(5),
    mode: z.enum(['distributed', 'concurrent', 'sequential']).optional().default('concurrent'),
    stopOnError: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = launchBatchExecutionSchema.parse(body);

        // Forward to downstream service
        const serviceUrl = process.env.STATE_MACHINE_SERVICE_URL || 'http://localhost:9090';

        const downstreamResponse = await fetch(
            `${serviceUrl}/state-machines/api/v1/state-machines/${encodeURIComponent(validated.stateMachineId)}/executions/batch`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filter: validated.filter,
                    namePrefix: validated.namePrefix,
                    concurrency: validated.concurrency,
                    mode: validated.mode,
                    stopOnError: validated.stopOnError,
                }),
                signal: AbortSignal.timeout(15000), // 15 second timeout for batch operations
            }
        );

        if (!downstreamResponse.ok) {
            const errorText = await downstreamResponse.text();
            console.error('Downstream service error:', errorText);

            return NextResponse.json(
                {
                    error: `Failed to launch batch execution in downstream service`,
                    details: errorText,
                    statusCode: downstreamResponse.status
                },
                { status: downstreamResponse.status }
            );
        }

        // Return the response from the downstream service directly
        const launched = await downstreamResponse.json();
        return NextResponse.json(launched, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error launching batch execution:', error);
        return NextResponse.json(
            { error: 'Failed to launch batch execution' },
            { status: 500 }
        );
    }
}
