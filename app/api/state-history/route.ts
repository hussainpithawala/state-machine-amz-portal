import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {stateHistory} from '@/lib/schema';
import {sql} from 'drizzle-orm';
import {z} from 'zod';

interface StateHistoryRow {
    id: string;
    execution_id: string;
    execution_start_time: string;
    state_name: string;
    state_type: string;
    input: Record<string, any> | null;
    output: Record<string, any> | null;
    status: string;
    start_time: string;
    end_time: string | null;
    error: string;
    retry_count: number;
    sequence_number: number;
    metadata: Record<string, any>;
    created_at: string;
}

interface EnrichedStateHistoryEntry extends StateHistoryRow {
    duration: number | null;
    inputPreview: string | null;
    outputPreview: string | null;
}

interface DetectedLoop {
    startIndex: number;
    patternLength: number;
    repeatCount: number;
}

// Validation schema with pagination support
const stateHistoryQuerySchema = z.object({
    executionId: z.string().min(1, 'Execution ID is required'),
    executionStartTime: z.string().optional(),
    cursor: z.string().optional(), // sequence_number to start from
    limit: z.string().optional().default('100'), // page size
    detectLoop: z.string().optional().default('true'), // enable loop detection
});

function getStateSignature(state: EnrichedStateHistoryEntry): string {
    return `${state.state_name}::${state.state_type}`;
}

function matchesPattern(
    signatures: string[],
    startIndex: number,
    patternLength: number,
    repeatOffset: number
): boolean {
    const candidateStart = startIndex + repeatOffset * patternLength;

    for (let i = 0; i < patternLength; i++) {
        if (signatures[startIndex + i] !== signatures[candidateStart + i]) {
            return false;
        }
    }

    return true;
}

function detectRepeatedLoop(states: EnrichedStateHistoryEntry[]): DetectedLoop | null {
    if (states.length < 2) {
        return null;
    }

    const signatures = states.map(getStateSignature);
    let bestLoop: DetectedLoop | null = null;

    for (let startIndex = 0; startIndex < signatures.length - 1; startIndex++) {
        const maxPatternLength = Math.floor((signatures.length - startIndex) / 2);

        for (let patternLength = 1; patternLength <= maxPatternLength; patternLength++) {
            let repeatCount = 1;

            while (
                startIndex + (repeatCount + 1) * patternLength <= signatures.length &&
                matchesPattern(signatures, startIndex, patternLength, repeatCount)
            ) {
                repeatCount++;
            }

            if (repeatCount < 2) {
                continue;
            }

            const candidateCoverage = repeatCount * patternLength;
            const bestCoverage = bestLoop ? bestLoop.repeatCount * bestLoop.patternLength : 0;
            const isBetterCoverage = candidateCoverage > bestCoverage;
            const isEarlierAtSameCoverage =
                !!bestLoop && candidateCoverage === bestCoverage && startIndex < bestLoop.startIndex;
            const isShorterAtSameCoverageAndStart =
                !!bestLoop &&
                candidateCoverage === bestCoverage &&
                startIndex === bestLoop.startIndex &&
                patternLength < bestLoop.patternLength;

            if (!bestLoop || isBetterCoverage || isEarlierAtSameCoverage || isShorterAtSameCoverageAndStart) {
                bestLoop = {startIndex, patternLength, repeatCount};
            }
        }
    }

    return bestLoop;
}

export async function GET(request: NextRequest) {
    try {
        const {searchParams} = new URL(request.url);
        const validated = stateHistoryQuerySchema.parse(Object.fromEntries(searchParams));
        
        const limit = Math.min(parseInt(validated.limit, 10), 1000); // Max 1000 per page
        const cursor = validated.cursor ? parseInt(validated.cursor, 10) : undefined;
        const shouldDetectLoop = validated.detectLoop === 'true';

        // Query with cursor-based pagination
        let history: StateHistoryRow[];
        if (cursor !== undefined) {
            history = await db.execute(sql`
                SELECT id,
                       execution_id,
                       execution_start_time,
                       state_name,
                       state_type,
                       input,
                       output,
                       status,
                       start_time,
                       end_time,
                       error,
                       retry_count,
                       sequence_number,
                       metadata,
                       created_at
                FROM state_history
                WHERE execution_id = ${validated.executionId}
                  AND sequence_number > ${cursor}
                ORDER BY sequence_number ASC
                LIMIT ${limit}
            `).then(r => 'rows' in r ? r.rows : r) as StateHistoryRow[];
        } else {
            history = await db.execute(sql`
                SELECT id,
                       execution_id,
                       execution_start_time,
                       state_name,
                       state_type,
                       input,
                       output,
                       status,
                       start_time,
                       end_time,
                       error,
                       retry_count,
                       sequence_number,
                       metadata,
                       created_at
                FROM state_history
                WHERE execution_id = ${validated.executionId}
                ORDER BY sequence_number ASC
                LIMIT ${limit}
            `).then(r => 'rows' in r ? r.rows : r) as StateHistoryRow[];
        }

        // Get total count for pagination metadata
        const countResult = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM state_history
            WHERE execution_id = ${validated.executionId}
        `);
        const totalCount = Number(('rows' in countResult ? countResult.rows : countResult)[0].count);

        if (history.length === 0 && cursor === undefined) {
            return NextResponse.json(
                {
                    error: 'No state history found for this execution',
                    hint: 'Ensure the execution ID is correct and has state history records'
                },
                {status: 404}
            );
        }

        // Calculate durations and enrich data
        const enrichedHistory: EnrichedStateHistoryEntry[] = history.map(entry => ({
            ...entry,
            duration: (entry as any).end_time
                ? new Date((entry as any).end_time).getTime() - new Date((entry as any).start_time).getTime()
                : null,
            endTime: (entry as any).end_time,
            startTime: (entry as any).start_time,
            stateType: (entry as any).state_type,
            stateName: (entry as any).state_name,
            inputPreview: (entry as any).input ? JSON.stringify((entry as any).input).substring(0, 100) : null,
            outputPreview: (entry as any).output ? JSON.stringify((entry as any).output).substring(0, 100) : null,
        }));

        // Detect loops if requested and we have data
        let detectedLoop: DetectedLoop | null = null;
        let loopDetectionStatus: 'none' | 'detected' | 'not_found' = 'none';
        
        if (shouldDetectLoop && enrichedHistory.length > 0) {
            detectedLoop = detectRepeatedLoop(enrichedHistory);
            loopDetectionStatus = detectedLoop ? 'detected' : 'not_found';
        }

        // Determine if there are more pages
        const hasMore = history.length === limit;
        const nextCursor = hasMore ? enrichedHistory[enrichedHistory.length - 1].sequence_number : null;

        // Get execution summary from fetched states
        const summary = {
            succeeded: enrichedHistory.filter((s: any) => s.status === 'SUCCEEDED').length,
            failed: enrichedHistory.filter((s: any) => s.status === 'FAILED').length,
            retrying: enrichedHistory.filter((s: any) => s.status === 'RETRYING').length,
            waiting: enrichedHistory.filter((s: any) => s.status === 'WAITING').length,
        };

        return NextResponse.json({
            executionId: validated.executionId,
            executionStartTime: validated.executionStartTime,
            totalStates: totalCount,
            states: enrichedHistory,
            pagination: {
                limit,
                cursor: cursor ?? null,
                nextCursor,
                hasMore,
                loadedStates: enrichedHistory.length,
            },
            loopDetection: shouldDetectLoop ? {
                detected: detectedLoop !== null,
                loop: detectedLoop,
                status: loopDetectionStatus,
                message: detectedLoop
                    ? `Loop detected: pattern of ${detectedLoop.patternLength} states repeating ${detectedLoop.repeatCount} times starting from state ${detectedLoop.startIndex}`
                    : 'No repeating patterns detected in loaded states',
            } : null,
            summary,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {error: 'Validation failed', details: error.errors},
                {status: 400}
            );
        }
        console.error('Error fetching state history:', error);
        return NextResponse.json(
            {error: 'Failed to fetch state history'},
            {status: 500}
        );
    }
}
