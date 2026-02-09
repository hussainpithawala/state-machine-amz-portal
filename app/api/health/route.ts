import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Basic health check
    return NextResponse.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'state-machine-amz-portal',
        version: process.env.npm_package_version || 'unknown'
    });
}
