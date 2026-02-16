// app/api/transformers/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const serviceUrl = process.env.STATE_MACHINE_SERVICE_URL || 'http://localhost:9090';

        const response = await fetch(`${serviceUrl}/state-machines/api/v1/transformers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch transformers:', errorText);

            return NextResponse.json(
                { error: 'Failed to fetch transformers', details: errorText },
                { status: response.status }
            );
        }

        const transformerResponse = await response.json();

        const transformerStrings = transformerResponse.transformers;

        // ✅ Transform string array into object array
        let transformers: Array<{ id: string; name: string; description?: string }> = [];

        if (Array.isArray(transformerStrings)) {
            transformers = transformerStrings.map((transformerId: string) => ({
                id: transformerId,
                name: transformerId, // Use ID as name
                description: undefined // No description available
            }));
        }

        return NextResponse.json(transformers);
    } catch (error) {
        console.error('Error fetching transformers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transformers' },
            { status: 500 }
        );
    }
}
