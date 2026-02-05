import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateMachines } from '@/lib/schema';
import { eq, sql, like, and, count } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema
const stateMachinesQuerySchema = z.object({
    page: z.string().optional().default('1'),
    pageSize: z.string().optional().default('20'),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const validated = stateMachinesQuerySchema.parse(Object.fromEntries(searchParams));

        const page = parseInt(validated.page);
        const pageSize = parseInt(validated.pageSize);
        const offset = (page - 1) * pageSize;

        // Build WHERE conditions
        let whereConditions: any[] = [];
        if (validated.search) {
            whereConditions.push(like(stateMachines.name, `%${validated.search}%`));
        }

        // Get total count
        const countResult = await db
            .select({ total: count() })
            .from(stateMachines)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = countResult[0]?.total || 0;

        // Fetch paginated results
        const results = await db
            .select()
            .from(stateMachines)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(
                validated.order === 'asc'
                    ? sql`${stateMachines[validated.sortBy as keyof typeof stateMachines]} ASC`
                    : sql`${stateMachines[validated.sortBy as keyof typeof stateMachines]} DESC`
            )
            .limit(pageSize)
            .offset(offset);

        return NextResponse.json({
            data: results,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('Error fetching state machines:', error);
        return NextResponse.json(
            { error: 'Failed to fetch state machines' },
            { status: 500 }
        );
    }
}
