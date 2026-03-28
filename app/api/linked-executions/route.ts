import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { linkedExecutions } from '@/lib/schema';
import { eq, like, and, count, gte, lte, desc, asc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for GET
const linkedExecutionsQuerySchema = z.object({
    page: z.string().optional().default('1'),
    pageSize: z.string().optional().default('25'),
    sourceStateMachineId: z.string().optional(),
    sourceExecutionId: z.string().optional(),
    sourceStateName: z.string().optional(),
    inputTransformerName: z.string().optional(),
    targetStateMachineName: z.string().optional(),
    targetExecutionId: z.string().optional(),
    createdAtFrom: z.string().optional(),
    createdAtTo: z.string().optional(),
    sortBy: z.enum(['createdAt', 'sourceStateMachineId', 'targetStateMachineName']).optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Validation schema for DELETE by IDs
const deleteLinkedExecutionsByIdsSchema = z.object({
    ids: z.array(z.string()).min(1, 'At least one ID is required'),
});

// Validation schema for DELETE by filters
const deleteLinkedExecutionsByFiltersSchema = z.object({
    ids: z.array(z.string()).optional(),
    deleteByFilter: z.boolean().optional().default(false),
    sourceStateMachineId: z.string().optional(),
    sourceExecutionId: z.string().optional(),
    sourceStateName: z.string().optional(),
    inputTransformerName: z.string().optional(),
    targetStateMachineName: z.string().optional(),
    targetExecutionId: z.string().optional(),
    createdAtFrom: z.string().optional(),
    createdAtTo: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const validated = linkedExecutionsQuerySchema.parse(Object.fromEntries(searchParams));

        const page = parseInt(validated.page);
        const pageSize = parseInt(validated.pageSize);
        const offset = (page - 1) * pageSize;

        const dateConditions: any[] = [];

        if (validated.createdAtFrom || validated.createdAtTo) {
            if (validated.createdAtFrom) {
                dateConditions.push(gte(linkedExecutions.createdAt, new Date(parseInt(validated.createdAtFrom) * 1000)));
            }
            if (validated.createdAtTo) {
                dateConditions.push(lte(linkedExecutions.createdAt, new Date(parseInt(validated.createdAtTo) * 1000)));
            }
        }

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

        const countResult = await db
            .select({ total: count() })
            .from(linkedExecutions)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = countResult[0]?.total || 0;

        const sortColumn = validated.sortBy === 'createdAt'
            ? linkedExecutions.createdAt
            : validated.sortBy === 'sourceStateMachineId'
                ? linkedExecutions.sourceStateMachineId
                : linkedExecutions.targetStateMachineName;

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

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = deleteLinkedExecutionsByFiltersSchema.parse(body);

        let deleteWhereConditions: any[] = [];

        // Delete by specific IDs
        if (validated.ids && validated.ids.length > 0) {
            const deletedCount = await db
                .delete(linkedExecutions)
                .where(inArray(linkedExecutions.id, validated.ids))
                .returning({ id: linkedExecutions.id });

            return NextResponse.json({
                success: true,
                deletedCount: deletedCount.length,
                deletedIds: deletedCount.map(d => d.id),
            });
        }

        // Delete by filters
        if (validated.deleteByFilter) {
            // Build date range filters
            if (validated.createdAtFrom) {
                deleteWhereConditions.push(gte(linkedExecutions.createdAt, new Date(parseInt(validated.createdAtFrom) * 1000)));
            }
            if (validated.createdAtTo) {
                deleteWhereConditions.push(lte(linkedExecutions.createdAt, new Date(parseInt(validated.createdAtTo) * 1000)));
            }

            // Build WHERE conditions
            if (validated.sourceStateMachineId) {
                deleteWhereConditions.push(eq(linkedExecutions.sourceStateMachineId, validated.sourceStateMachineId));
            }

            if (validated.sourceExecutionId) {
                deleteWhereConditions.push(eq(linkedExecutions.sourceExecutionId, validated.sourceExecutionId));
            }

            if (validated.sourceStateName) {
                deleteWhereConditions.push(eq(linkedExecutions.sourceStateName, validated.sourceStateName));
            }

            if (validated.inputTransformerName) {
                deleteWhereConditions.push(eq(linkedExecutions.inputTransformerName, validated.inputTransformerName));
            }

            if (validated.targetStateMachineName) {
                deleteWhereConditions.push(eq(linkedExecutions.targetStateMachineName, validated.targetStateMachineName));
            }

            if (validated.targetExecutionId) {
                deleteWhereConditions.push(eq(linkedExecutions.targetExecutionId, validated.targetExecutionId));
            }

            // Get count before deletion
            const countResult = await db
                .select({ total: count() })
                .from(linkedExecutions)
                .where(deleteWhereConditions.length > 0 ? and(...deleteWhereConditions) : undefined);

            const totalToDelete = countResult[0]?.total || 0;

            // Perform deletion
            const deletedRecords = await db
                .delete(linkedExecutions)
                .where(deleteWhereConditions.length > 0 ? and(...deleteWhereConditions) : undefined)
                .returning({ id: linkedExecutions.id });

            return NextResponse.json({
                success: true,
                deletedCount: deletedRecords.length,
                expectedCount: totalToDelete,
            });
        }

        return NextResponse.json(
            { error: 'Either "ids" or "deleteByFilter" must be provided' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error deleting linked executions:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0]?.message || 'Invalid request' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete linked executions' },
            { status: 500 }
        );
    }
}
