import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { executions } from '@/lib/schema';
import {
    eq,
    sql,
    like,
    and,
    count,
    gte,
    lte,
    inArray,
    desc,
    asc
} from 'drizzle-orm';
import { z } from 'zod';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Validation schema
const executionsQuerySchema = z.object({
    page: z.string().optional().default('1'),
    pageSize: z.string().optional().default('25'),
    stateMachineId: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    dateRange: z.enum(['today', '7d', '30d', '90d']).optional(),
    sortBy: z.enum(['startTime', 'endTime', 'status']).optional().default('startTime'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    executionId: z.string().optional(), // For single execution lookup
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const validated = executionsQuerySchema.parse(Object.fromEntries(searchParams));

        // Handle single execution lookup
        if (validated.executionId) {
            const [execution] = await db
                .select()
                .from(executions)
                .where(eq(executions.executionId, validated.executionId))
                .orderBy(desc(executions.startTime))
                .limit(1);

            if (!execution) {
                return NextResponse.json(
                    { error: `Execution with ID "${validated.executionId}" not found` },
                    { status: 404 }
                );
            }
            return NextResponse.json(execution);
        }

        const page = parseInt(validated.page);
        const pageSize = parseInt(validated.pageSize);
        const offset = (page - 1) * pageSize;

        // Build date range filters
        let dateConditions: any[] = [];
        const now = new Date();

        if (validated.dateRange) {
            let startDate: Date;
            switch (validated.dateRange) {
                case 'today':
                    startDate = startOfDay(now);
                    break;
                case '7d':
                    startDate = subDays(now, 7);
                    break;
                case '30d':
                    startDate = subDays(now, 30);
                    break;
                case '90d':
                    startDate = subDays(now, 90);
                    break;
                default:
                    startDate = subDays(now, 30);
            }
            dateConditions.push(gte(executions.startTime, startDate));
        } else {
            if (validated.startDate) {
                dateConditions.push(gte(executions.startTime, new Date(validated.startDate)));
            }
            if (validated.endDate) {
                dateConditions.push(lte(executions.startTime, new Date(validated.endDate)));
            }
        }

        // Build WHERE conditions
        let whereConditions: any[] = [...dateConditions];

        if (validated.stateMachineId) {
            whereConditions.push(eq(executions.stateMachineId, validated.stateMachineId));
        }

        if (validated.status) {
            whereConditions.push(eq(executions.status, validated.status));
        }

        if (validated.search) {
            whereConditions.push(
                like(executions.name, `%${validated.search}%`)
            );
        }

        // Get total count
        const countResult = await db
            .select({ total: count() })
            .from(executions)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = countResult[0]?.total || 0;

        // Determine sort column
        const sortColumn = validated.sortBy === 'startTime'
            ? executions.startTime
            : validated.sortBy === 'endTime'
                ? executions.endTime
                : executions.status;

        // Fetch paginated results
        const results = await db
            .select()
            .from(executions)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(
                validated.order === 'asc' ? asc(sortColumn) : desc(sortColumn)
            )
            .limit(pageSize)
            .offset(offset);

        return NextResponse.json({
            results,                 // ✅ Just 'results' (not wrapped in 'data')
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
            filters: {
                stateMachineId: validated.stateMachineId,
                status: validated.status,
                dateRange: validated.dateRange,
            },
        });
    } catch (error) {
        console.error('Error fetching executions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch executions' },
            { status: 500 }
        );
    }
}

