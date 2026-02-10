import {NextResponse} from 'next/server';

export async function GET() {
    try {
        const serviceUrl = process.env.STATE_MACHINE_SERVICE_URL || 'http://localhost:9090';

        const response = await fetch(`${serviceUrl}/state-machines/api/v1/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            return NextResponse.json({
                status: 'DOWN',
                statusCode: response.status,
                message: `Service returned ${response.status} ${response.statusText}`,
                timestamp: new Date().toISOString(),
            }, {status: 200});
        }

        const healthData = await response.json();

        return NextResponse.json({
            status: 'UP',
            statusCode: response.status,
            data: healthData,
            timestamp: new Date().toISOString(),
        }, {status: 200});

    } catch (error) {
        console.error('Error fetching service health:', error);

        let message = 'Unknown error';
        if (error instanceof Error) {
            message = error.message;
        }

        return NextResponse.json({
            status: 'DOWN',
            statusCode: null,
            message: message,
            timestamp: new Date().toISOString(),
        }, {status: 200});
    }
}
