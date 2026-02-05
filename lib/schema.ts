import { pgTable, varchar, text, jsonb, timestamp, integer, primaryKey, index, foreignKey, pgEnum, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Execution status enum (matches DB CHECK constraint)
export const executionStatusEnum = pgEnum('execution_status', [
    'RUNNING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED',
    'TIMED_OUT',
    'ABORTED',
    'PAUSED',
]);

// State history status enum (matches DB CHECK constraint)
export const stateHistoryStatusEnum = pgEnum('state_history_status', [
    'SUCCEEDED',
    'FAILED',
    'RUNNING',
    'CANCELLED',
    'TIMED_OUT',
    'RETRYING',
    'WAITING',
]);

// State Machines Table
export const stateMachines = pgTable('state_machines', {
    id: varchar('id', { length: 255 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    definition: text('definition').notNull(),
    type: varchar('type', { length: 50 }),
    version: varchar('version', { length: 50 }).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
}, (table) => ({
    nameIdx: index('idx_state_machines_name').on(table.name),
}));

// Executions Table (partitioned by start_time)
export const executions = pgTable('executions', {
    executionId: varchar('execution_id', { length: 255 }).notNull(),
    stateMachineId: varchar('state_machine_id', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    input: jsonb('input'),
    output: jsonb('output'),
    status: executionStatusEnum('status').notNull(),
    startTime: timestamp('start_time', { mode: 'date', withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { mode: 'date', withTimezone: true }),
    currentState: varchar('current_state', { length: 255 }).notNull(),
    error: text('error'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.executionId, table.startTime] }),
    statusCheck: check('executions_status_check', sql`${table.status} IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT', 'ABORTED', 'PAUSED')`),
    statusIdx: index('idx_executions_status')
        .on(table.status)
        .where(sql`${table.status} IN ('RUNNING', 'FAILED')`),
    startTimeIdx: index('idx_executions_start_time').on(table.startTime),
    stateMachineIdx: index('idx_executions_state_machine').on(table.stateMachineId, table.startTime),
    endTimeIdx: index('idx_executions_end_time')
        .on(table.endTime)
        .where(sql`${table.endTime} IS NOT NULL`),
    nameIdx: index('idx_executions_name')
        .on(table.name)
        .where(sql`${table.name} IS NOT NULL`),
    metadataIdx: index('idx_executions_metadata_gin')
        .on(table.metadata),
}));

// State History Table (partitioned by start_time)
export const stateHistory = pgTable('state_history', {
    id: varchar('id', { length: 255 }).notNull(),
    executionId: varchar('execution_id', { length: 255 }).notNull(),
    executionStartTime: timestamp('execution_start_time', { mode: 'date', withTimezone: true }).notNull(),
    stateName: varchar('state_name', { length: 255 }).notNull(),
    stateType: varchar('state_type', { length: 50 }).notNull(),
    input: jsonb('input'),
    output: jsonb('output'),
    status: stateHistoryStatusEnum('status').notNull(),
    startTime: timestamp('start_time', { mode: 'date', withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { mode: 'date', withTimezone: true }),
    error: text('error'),
    retryCount: integer('retry_count').default(0).notNull(),
    sequenceNumber: integer('sequence_number').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.id, table.startTime] }),
    retryCountCheck: check('state_history_retry_count_check', sql`${table.retryCount} >= 0`),
    sequenceNumberCheck: check('state_history_sequence_number_check', sql`${table.sequenceNumber} >= 0`),
    statusCheck: check('state_history_status_check', sql`${table.status} IN ('SUCCEEDED', 'FAILED', 'RUNNING', 'CANCELLED', 'TIMED_OUT', 'RETRYING', 'WAITING')`),
    executionIdx: index('idx_state_history_execution').on(table.executionId, table.startTime),
    sequenceIdx: index('idx_state_history_sequence').on(table.executionId, table.sequenceNumber),
    startTimeIdx: index('idx_state_history_start_time').on(table.startTime),
    stateNameIdx: index('idx_state_history_state_name').on(table.stateName),
    statusIdx: index('idx_state_history_status')
        .on(table.status)
        .where(sql`${table.status} IN ('FAILED', 'RETRYING')`),
    fkExecution: foreignKey({
        columns: [table.executionId, table.executionStartTime],
        foreignColumns: [executions.executionId, executions.startTime],
        name: 'fk_execution',
    })
        .onUpdate('cascade')
        .onDelete('cascade'),
}));

// Message Correlations Table
export const messageCorrelations = pgTable('message_correlations', {
    id: varchar('id', { length: 255 }).primaryKey(),
    executionId: varchar('execution_id', { length: 255 }).notNull(),
    executionStartTime: timestamp('execution_start_time', { mode: 'date', withTimezone: true }).notNull(),
    stateMachineId: varchar('state_machine_id', { length: 255 }).notNull(),
    stateName: varchar('state_name', { length: 255 }).notNull(),
    correlationKey: varchar('correlation_key', { length: 255 }).notNull(),
    correlationValue: jsonb('correlation_value').notNull(),
    createdAt: varchar('created_at', { length: 255 }).notNull(), // Stored as bigint string in DB
    timeoutAt: varchar('timeout_at', { length: 255 }), // Stored as bigint string in DB
    status: varchar('status', { length: 50 })
        .default('WAITING')
        .notNull(),
}, (table) => ({
    correlationKeyIdx: index('idx_message_correlations_correlation_key').on(table.correlationKey),
    statusIdx: index('idx_message_correlations_status').on(table.status),
    executionIdIdx: index('idx_message_correlations_execution_id').on(table.executionId),
    timeoutAtIdx: index('idx_message_correlations_timeout_at')
        .on(table.timeoutAt)
        .where(sql`${table.timeoutAt} IS NOT NULL`),
    keyValueStatusIdx: index('idx_message_correlations_key_value_status')
        .on(table.correlationKey, table.correlationValue, table.status),
    fkExecution: foreignKey({
        columns: [table.executionId, table.executionStartTime],
        foreignColumns: [executions.executionId, executions.startTime],
        name: 'fk_execution_message',
    }).onDelete('cascade'),
}));
