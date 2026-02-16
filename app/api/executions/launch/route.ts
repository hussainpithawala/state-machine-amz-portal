import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Custom validation function for input vs sourceExecutionId
const launchExecutionSchema = z.object({
    stateMachineId: z.string().min(1, 'State Machine ID is required'),
    name: z.string().min(1, 'Execution name is required'),
    input: z.record(z.any()).optional(), // Now optional
    sourceExecutionId: z.string().optional(), // Optional
    sourceStateName: z.string().optional(), // Optional
    sourceInputTransformer: z.string().optional(), // ✅ NEW FIELD
}).refine(
    (data) => {
        // Either input OR sourceExecutionId must be provided (or both)
        return data.input !== undefined || data.sourceExecutionId !== undefined;
    },
    {
        message: "Either 'input' or 'sourceExecutionId' must be provided",
        path: ['input', 'sourceExecutionId'],
    }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = launchExecutionSchema.parse(body);

        // Forward to downstream service
        const serviceUrl = process.env.STATE_MACHINE_SERVICE_URL || 'http://localhost:9090';

        const downstreamResponse = await fetch(
            `${serviceUrl}/state-machines/api/v1/state-machines/${encodeURIComponent(validated.stateMachineId)}/executions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: validated.name,
                    // Include input only if provided
                    ...(validated.input !== undefined && { input: validated.input }),
                    // Include source fields only if provided
                    ...(validated.sourceExecutionId && { sourceExecutionId: validated.sourceExecutionId }),
                    ...(validated.sourceStateName && { sourceStateName: validated.sourceStateName }),
                    ...(validated.sourceInputTransformer && { sourceInputTransformer: validated.sourceInputTransformer }), // ✅ NEW FIELD
                }),
                signal: AbortSignal.timeout(10000), // 10 second timeout
            }
        );

        if (!downstreamResponse.ok) {
            const errorText = await downstreamResponse.text();
            console.error('Downstream service error:', errorText);

            return NextResponse.json(
                {
                    error: `Failed to launch execution in downstream service`,
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

        console.error('Error launching execution:', error);
        return NextResponse.json(
            { error: 'Failed to launch execution' },
            { status: 500 }
        );
    }
}
