import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stateMachines, stateHistory, executions } from '@/lib/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema
const stateMachineStatesQuerySchema = z.object({
    limit: z.string().optional().default('500'),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { searchParams } = new URL(request.url);
        const routeParams = await params;
        const validated = stateMachineStatesQuerySchema.parse(Object.fromEntries(searchParams));
        
        const stateMachineId = routeParams.id;

        // Get the state machine definition to extract all possible states
        const [stateMachine] = await db
            .select()
            .from(stateMachines)
            .where(eq(stateMachines.id, stateMachineId));

        if (!stateMachine) {
            return NextResponse.json(
                { error: `State machine "${stateMachineId}" not found` },
                { status: 404 }
            );
        }

        // Parse the state machine definition to get all states
        let definition;
        try {
            definition = JSON.parse(stateMachine.definition);
        } catch (error) {
            console.error('Error parsing state machine definition:', error);
            return NextResponse.json(
                { error: 'Invalid state machine definition' },
                { status: 500 }
            );
        }

        // Extract all state names from the definition
        const allStates = definition.States ? Object.keys(definition.States) : [];

        // Get all executions for this state machine first
        const executionRecords = await db
            .select({
                executionId: executions.executionId,
                startTime: executions.startTime,
            })
            .from(executions)
            .where(eq(executions.stateMachineId, stateMachineId))
            .limit(1000);

        if (executionRecords.length === 0) {
            // No executions yet, return just the defined states
            return NextResponse.json({
                stateMachineId,
                allStates,
                usedStates: [],
                stateStatuses: {},
                availableStatuses: ['SUCCEEDED', 'FAILED', 'RUNNING', 'CANCELLED', 'TIMED_OUT', 'RETRYING', 'WAITING'],
            });
        }

        // Build execution IDs list for filtering
        const executionIds = executionRecords.map(rec => rec.executionId);

        // Get distinct state names and statuses from state_history for these executions
        const stateHistoryData = await db
            .select({
                stateName: stateHistory.stateName,
                status: stateHistory.status,
            })
            .from(stateHistory)
            .where(
                inArray(stateHistory.executionId, executionIds)
            )
            .limit(parseInt(validated.limit));

        // Get unique state names that have been used in executions
        const usedStateNames = Array.from(new Set(stateHistoryData.map(s => s.stateName)));

        // Get unique statuses for each state
        const stateStatusesMap = new Map<string, string[]>();
        stateHistoryData.forEach(({ stateName, status }) => {
            const existing = stateStatusesMap.get(stateName) || [];
            if (!existing.includes(status)) {
                existing.push(status);
                stateStatusesMap.set(stateName, existing);
            }
        });

        return NextResponse.json({
            stateMachineId,
            allStates,
            usedStates: usedStateNames,
            stateStatuses: Object.fromEntries(stateStatusesMap),
            availableStatuses: ['SUCCEEDED', 'FAILED', 'RUNNING', 'CANCELLED', 'TIMED_OUT', 'RETRYING', 'WAITING'],
        });
    } catch (error) {
        console.error('Error fetching state machine states:', error);
        return NextResponse.json(
            { error: 'Failed to fetch state machine states' },
            { status: 500 }
        );
    }
}
