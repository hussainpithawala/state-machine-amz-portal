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

export type StateType =
    | 'Task'
    | 'Choice'
    | 'Parallel'
    | 'Map'
    | 'Wait'
    | 'Succeed'
    | 'Fail'
    | 'Pass';

export interface StateMachine {
    id: string;
    name: string;
    description?: string;
    definition: string;
    type?: string;
    version: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface Execution {
    executionId: string;
    stateMachineId: string;
    name: string;
    input?: Record<string, any>;
    output?: Record<string, any>;
    status: ExecutionStatus;
    startTime: Date;
    endTime?: Date;
    currentState: string;
    error?: string;
    meta Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface StateHistoryEntry {
    id: string;
    executionId: string;
    executionStartTime: Date;
    stateName: string;
    stateType: string;
    input?: Record<string, any>;
    output?: Record<string, any>;
    status: StateHistoryStatus;
    startTime: Date;
    endTime?: Date;
    error?: string;
    retryCount: number;
    sequenceNumber: number;
    metadata: Record<string, any>;
    createdAt: Date;
}
