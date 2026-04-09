import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for bulk execution launch
const launchBulkExecutionSchema = z.object({
    stateMachineId: z.string().min(1, 'State Machine ID is required'),
    namePrefix: z.string().min(1, 'Name prefix is required'),
    groupEnqueue: z.boolean().optional().default(false),
    concurrency: z.number().int().min(1).optional().default(10),
    mode: z.enum(['concurrent', 'sequential']).optional().default('concurrent'),
    stopOnError: z.boolean().optional().default(false),
    inputs: z.array(z.any()).min(1, 'At least one input is required'),
    doMicroBatch: z.boolean().optional().default(true),
    microBatchSize: z.number().int().min(1).optional(),
    orchestratorId: z.string().optional(),
    pauseThreshold: z.number().min(0).max(1).optional().default(0.1),
    resumeStrategy: z.enum(['manual', 'auto']).optional().default('manual'),
    timeoutSeconds: z.number().int().min(1).optional().default(300),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = launchBulkExecutionSchema.parse(body);

        // Forward to downstream service
        const serviceUrl = process.env.STATE_MACHINE_SERVICE_URL || 'http://localhost:9090';

        const downstreamResponse = await fetch(
            `${serviceUrl}/state-machines/api/v1/state-machines/${encodeURIComponent(validated.stateMachineId)}/executions/bulk`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    namePrefix: validated.namePrefix,
                    groupEnqueue: validated.groupEnqueue,
                    concurrency: validated.concurrency,
                    mode: validated.mode,
                    stopOnError: validated.stopOnError,
                    inputs: validated.inputs,
                    doMicroBatch: validated.doMicroBatch,
                    microBatchSize: validated.doMicroBatch ? validated.microBatchSize : undefined,
                    orchestratorId: validated.orchestratorId,
                    pauseThreshold: validated.pauseThreshold,
                    resumeStrategy: validated.resumeStrategy,
                    timeoutSeconds: validated.timeoutSeconds,
                }),
                signal: AbortSignal.timeout(30000), // 30 second timeout for bulk operations
            }
        );

        if (!downstreamResponse.ok) {
            const errorText = await downstreamResponse.text();
            console.error('Downstream service error:', errorText);

            return NextResponse.json(
                {
                    error: `Failed to launch bulk execution in downstream service`,
                    details: errorText,
                    statusCode: downstreamResponse.status
                },
                { status: downstreamResponse.status }
            );
        }

        // Return the response from the downstream service
        const result = await downstreamResponse.json();
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error launching bulk execution:', error);
        return NextResponse.json(
            { error: 'Failed to launch bulk execution' },
            { status: 500 }
        );
    }
}
