import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { linkedExecutions } from '@/lib/schema';
import { eq, like, and, count, gte, lte, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema
const linkedExecutionsQuerySchema = z.object({
    page: z.string().optional().default('1'),
    pageSize: z.string().optional().default('25'),
    sourceStateMachineId: z.string().optional(),
    sourceExecutionId: z.string().optional(),
    sourceStateName: z.string().optional(),
    inputTransformerName: z.string().optional(),
    targetStateMachineName: z.string().optional(),
    targetExecutionId: z.string().optional(),
    createdAtFrom: z.string().optional(), // Unix timestamp in seconds
    createdAtTo: z.string().optional(),   // Unix timestamp in seconds
    sortBy: z.enum(['createdAt', 'sourceStateMachineId', 'targetStateMachineName']).optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const validated = linkedExecutionsQuerySchema.parse(Object.fromEntries(searchParams));

        // Handle list view
        const page = parseInt(validated.page);
        const pageSize = parseInt(validated.pageSize);
        const offset = (page - 1) * pageSize;

        // Build date range filters
        const dateConditions: any[] = [];

        if (validated.createdAtFrom || validated.createdAtTo) {
            if (validated.createdAtFrom) {
                dateConditions.push(gte(linkedExecutions.createdAt, new Date(parseInt(validated.createdAtFrom) * 1000)));
            }
            if (validated.createdAtTo) {
                dateConditions.push(lte(linkedExecutions.createdAt, new Date(parseInt(validated.createdAtTo) * 1000)));
            }
        }

        // Build WHERE conditions
        const whereConditions: any[] = [...dateConditions];

        if (validated.sourceStateMachineId) {
            whereConditions.push(eq(linkedExecutions.sourceStateMachineId, validated.sourceStateMachineId));
        }

        if (validated.sourceExecutionId) {
            whereConditions.push(eq(linkedExecutions.sourceExecutionId, validated.sourceExecutionId));
        }

        if (validated.sourceStateName) {
            whereConditions.push(eq(linkedExecutions.sourceStateName, validated.sourceStateName));
        }

        if (validated.inputTransformerName) {
            whereConditions.push(eq(linkedExecutions.inputTransformerName, validated.inputTransformerName));
        }

        if (validated.targetStateMachineName) {
            whereConditions.push(eq(linkedExecutions.targetStateMachineName, validated.targetStateMachineName));
        }

        if (validated.targetExecutionId) {
            whereConditions.push(eq(linkedExecutions.targetExecutionId, validated.targetExecutionId));
        }

        // Get total count
        const countResult = await db
            .select({ total: count() })
            .from(linkedExecutions)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = countResult[0]?.total || 0;

        // Determine sort column
        const sortColumn = validated.sortBy === 'createdAt'
            ? linkedExecutions.createdAt
            : validated.sortBy === 'sourceStateMachineId'
                ? linkedExecutions.sourceStateMachineId
                : linkedExecutions.targetStateMachineName;

        // Fetch paginated results
        const results = await db
            .select()
            .from(linkedExecutions)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(
                validated.order === 'asc' ? asc(sortColumn) : desc(sortColumn)
            )
            .limit(pageSize)
            .offset(offset);

        return NextResponse.json({
            results,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
            filters: {
                sourceStateMachineId: validated.sourceStateMachineId,
                sourceExecutionId: validated.sourceExecutionId,
                sourceStateName: validated.sourceStateName,
                inputTransformerName: validated.inputTransformerName,
                targetStateMachineName: validated.targetStateMachineName,
                targetExecutionId: validated.targetExecutionId,
                createdAtFrom: validated.createdAtFrom,
                createdAtTo: validated.createdAtTo,
            },
        });
    } catch (error) {
        console.error('Error fetching linked executions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch linked executions' },
            { status: 500 }
        );
    }
}
