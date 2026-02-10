export type ExecutionStatus =
    | 'RUNNING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'CANCELLED'
    | 'TIMED_OUT'
    | 'ABORTED'
    | 'PAUSED';

export type StateHistoryStatus =
    | 'SUCCEEDED'
    | 'FAILED'
    | 'RUNNING'
    | 'CANCELLED'
    | 'TIMED_OUT'
    | 'RETRYING'
    | 'WAITING';

// export type StateType =
//     | 'Task'
//     | 'Choice'
//     | 'Parallel'
//     | 'Map'
//     | 'Wait'
//     | 'Succeed'
//     | 'Fail'
//     | 'Pass';

// Define a generic JSON value type
// export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Alternative: If you want to be more flexible, use unknown instead of any
export type Json = Record<string, unknown>;

export interface StateMachine {
    id: string;
    name: string;
    description?: string;
    definition: string;
    type?: string;
    version: string;
    metadata: Json; // ✅ Replaced Record<string, any>
    createdAt: Date;
    updatedAt: Date;
}

export interface Execution {
    executionId: string;
    stateMachineId: string;
    name: string;
    input?: Json; // ✅ Replaced Record<string, any>
    output?: Json; // ✅ Replaced Record<string, any>
    status: ExecutionStatus;
    startTime: string; // ✅ Should be string, not Date
    endTime?: string;  // ✅ Should be string, not Date
    currentState: string;
    error?: string;
    metadata: Json; // ✅ Replaced Record<string, any>
    createdAt: string;   // ✅ All timestamps as strings
    updatedAt: string;
}

export interface StateHistoryEntry {
    id: string;
    executionId: string;
    executionStartTime: Date;
    stateName: string;
    stateType: string;
    input?: Json; // ✅ Replaced Record<string, any>
    output?: Json; // ✅ Replaced Record<string, any>
    status: StateHistoryStatus;
    startTime: Date;
    endTime?: Date;
    error?: string;
    retryCount: number;
    sequenceNumber: number;
    metadata: Json; // ✅ Replaced Record<string, any>
    createdAt: Date;
}
