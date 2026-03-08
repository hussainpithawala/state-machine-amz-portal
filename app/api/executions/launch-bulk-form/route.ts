import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Parse form-data
        const formData = await request.formData();
        
        // Get stateMachineId from query params
        const searchParams = request.nextUrl.searchParams;
        const stateMachineId = searchParams.get('stateMachineId');
        
        if (!stateMachineId) {
            return NextResponse.json(
                { error: 'State Machine ID is required' },
                { status: 400 }
            );
        }

        // Get the inputs file
        const inputsFile = formData.get('inputs') as File;
        if (!inputsFile) {
            return NextResponse.json(
                { error: 'Inputs file is required' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!inputsFile.name.endsWith('.json') && !inputsFile.type.includes('json')) {
            return NextResponse.json(
                { error: 'Inputs file must be a JSON file' },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (inputsFile.size > maxSize) {
            return NextResponse.json(
                { error: 'File size must be less than 10MB' },
                { status: 400 }
            );
        }

        // Read and parse the JSON file
        const fileText = await inputsFile.text();
        let inputs;
        try {
            inputs = JSON.parse(fileText);
        } catch (parseError) {
            return NextResponse.json(
                { error: 'Invalid JSON in inputs file', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
                { status: 400 }
            );
        }

        // Validate inputs is an array
        if (!Array.isArray(inputs)) {
            return NextResponse.json(
                { error: 'Inputs file must contain a JSON array' },
                { status: 400 }
            );
        }

        // Get other form fields
        const namePrefix = formData.get('namePrefix') as string || `bulk-${Date.now()}`;
        const concurrency = parseInt(formData.get('concurrency') as string) || 10;
        const mode = formData.get('mode') as string || 'concurrent';
        const stopOnError = formData.get('stopOnError') === 'true';
        const doMicroBatch = formData.get('doMicroBatch') === 'true';
        const microBatchSize = parseInt(formData.get('microBatchSize') as string) || 100;
        const orchestratorId = formData.get('orchestratorId') as string || undefined;

        // Forward to downstream service
        const serviceUrl = process.env.STATE_MACHINE_SERVICE_URL || 'http://localhost:9090';

        // Don't set Content-Type header - let fetch set it with boundary automatically
        const downstreamResponse = await fetch(
            `${serviceUrl}/state-machines/api/v1/state-machines/${encodeURIComponent(stateMachineId)}/executions/bulk-form`,
            {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(60000), // 60 second timeout for file uploads
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
        console.error('Error launching bulk execution from form:', error);
        
        if (error instanceof Error && error.name === 'JSONParseError') {
            return NextResponse.json(
                { error: 'Invalid JSON in inputs file' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to launch bulk execution' },
            { status: 500 }
        );
    }
}
