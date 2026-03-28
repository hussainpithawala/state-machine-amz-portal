import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

const executeSQLSchema = z.object({
    query: z.string().min(1, 'SQL query is required'),
});

// Block dangerous operations
const blockedPatterns = [
    /\bDROP\s+DATABASE\b/i,
    /\bTRUNCATE\b/i,
    /\bALTER\s+USER\b/i,
    /\bCREATE\s+USER\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bCOPY\b/i,
    /\b\;\s*DROP\b/i,
    /\b\;\s*TRUNCATE\b/i,
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = executeSQLSchema.parse(body);

        const { query } = validated;

        // Security check - block dangerous operations
        for (const pattern of blockedPatterns) {
            if (pattern.test(query)) {
                return NextResponse.json(
                    { error: 'This query contains blocked operations for safety reasons' },
                    { status: 403 }
                );
            }
        }

        // Execute the query
        const result = await db.execute(sql.raw(query));

        // Handle different result types
        let rows: any[] = [];
        let rowCount: number | undefined;

        if (Array.isArray(result)) {
            rows = result;
            rowCount = result.length;
        } else if (result && typeof result === 'object') {
            const resultObj = result as Record<string, any>;
            if ('rows' in resultObj) {
                rows = resultObj.rows;
                rowCount = resultObj.rowCount;
            } else if ('length' in resultObj) {
                rows = resultObj as any[];
                rowCount = resultObj.length;
            } else {
                rows = [resultObj];
            }
        }

        return NextResponse.json({
            success: true,
            rows,
            rowCount,
        });
    } catch (error) {
        console.error('Error executing SQL:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0]?.message || 'Invalid request' },
                { status: 400 }
            );
        }

        // Extract meaningful error message
        let errorMessage = 'Failed to execute SQL query';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
