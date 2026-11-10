# Request for Proposal (RFP) — Downstream

## Stage 1: Endpoint Catalog & Filter Extensions for the BFF Proxy Migration

**Consuming system:** State Machine AMZ Portal (Next.js 16)  
**Target system:** [`state-machine-amz-gin`](https://github.com/hussainpithawala/state-machine-amz-gin)  
**Document Version:** 1.0  
**Date:** October 14, 2026  
**Status:** Draft / For Review  
**Companion document:** Portal-side Stage 1 RFP (BFF proxy migration)

---

## 1. Executive Summary

The State Machine AMZ Portal is being migrated from direct PostgreSQL access to a pure Backend-for-Frontend (BFF) proxy that forwards **all** data requests to the downstream `state-machine-amz-gin` REST server. The portal's write operations (launch, batch, bulk execution) are already proxied; the remaining work is converting the portal's read paths.

This document specifies the downstream changes required from `state-machine-amz-gin`: **five new HTTP endpoints**, **a substantial extension of the existing `ListExecutions` filter surface**, and **cursor-based pagination for state history**. The portal team will not begin rewriting its read routes until these Gin endpoints are implemented and verified end-to-end.

**Out of scope for this RFP:** The Stage 1 static API-key / M2M trust layer between portal and Gin. That will be layered on top of this work in a follow-up change.

---

## 2. Design Principles

1. **Response shapes are a contract, not a suggestion.** The portal's React UI was built against the Drizzle ORM output that returned **camelCase** field names (because the Drizzle schema uses camelCase property names). Gin **must** return payloads that are wire-compatible with what the portal currently consumes. Any divergence requires a portal UI change, which we want to avoid.
2. **Errors forward transparently.** Gin MUST return meaningful `4xx/5xx` status codes with a JSON body. The portal will proxy these status codes verbatim to the browser.
3. **Endpoint paths stay consistent.** The base path remains `/api/v1` (already configurable via `middleware.Config.BasePath`). Portal will be configured with the Gin base URL and path prefix as `DOWNSTREAM_GIN_BASE_URL`.
4. **Cursor pagination over offset pagination** when datasets can be unbounded per key (state history, eventually linked executions). Offset pagination is acceptable for pages of records (executions, state machines) where total counts are bounded.

---

## 3. Architectural Decisions (Resolved)

These were debated during gap analysis and are locked in for this RFP:

| Question | Decision |
|---|---|
| The portal's `sql-execute` route exposed a raw SQL tool | **Remove from portal**. No equivalent endpoint on Gin. Developers should use `psql` / IDE tooling directly. |
| `linked_executions` table queries — who owns them? | **Add to Gin.** The table is shared and already written by Gin during `StartExecution` (when `sourceExecutionId` is present). Serving reads/deletes there matches writes. |
| State history cursor pagination | **Extend Gin** with `after_sequence_number` and `limit` query params. Portal's loop-detection algorithm will move to the browser and loads all states, but the endpoint must also support bounded paging for UI-driven partial fetches. |

---

## 4. Scope of Work

### 4.1 New Endpoints (5)

| # | Endpoint | Replaces portal route |
|---|---|---|
| 1 | `GET /api/v1/dashboard/stats` | `app/api/dashboard/stats/route.ts` |
| 2 | `GET /api/v1/state-machines/:stateMachineId/states` | `app/api/state-machines/[id]/states/route.ts` |
| 3 | `GET /api/v1/linked-executions` | `app/api/linked-executions/route.ts` (GET) |
| 4 | `DELETE /api/v1/linked-executions` | `app/api/linked-executions/route.ts` (DELETE) |
| 5 | `GET /api/v1/executions/:executionId/start-time` | `app/api/executions/[executionId]/start-time/route.ts` |

Each is specified in §6 (contracts).

### 4.2 Extensions to Existing Endpoints (2)

1. **`GET /api/v1/state-machines/:stateMachineId/executions` — filter expansion.** Six new query parameters plus sort/order (see §5).
2. **`GET /api/v1/executions/:executionId/history` — cursor pagination.** New `after_sequence_number` and `limit` query parameters (see §6.5).

### 4.3 Out of Scope

- API-key / `X-Portal-API-Key` middleware (deferred).
- M2M / OIDC authentication (Stage 2).
- Any change to write endpoints (launch, batch, bulk, bulk-form).
- Repository / ORM abstraction changes.

---

## 5. `ExecutionFilter` Extensions (Existing Endpoint)

The portal's current execution list supports rich filtering that the Gin handler does not. **Extend the `repository.ExecutionFilter` struct** — and the repository query behind it — to accept the following:

| Filter field | Type | SQL behaviour | Notes |
|---|---|---|---|
| `status` | `string` | `= ?` | ✅ already supported |
| `stateMachineId` | `string` | `= ?` | ✅ already supported (path param) |
| `limit`, `offset` | `int` | `LIMIT/OFFSET` | ✅ already supported |
| **`executionId`** | `string` | `= ?` | NEW — exact match |
| **`executionName`** | `string` | `LIKE %value%` | NEW — partial match |
| **`startTimeFrom`** | `int64` (unix seconds) | `start_time >= ?` | NEW |
| **`startTimeTo`** | `int64` (unix seconds) | `start_time <= ?` | NEW |
| **`stateName`** | `string` | `WHERE EXISTS (SELECT 1 FROM state_history sh WHERE sh.execution_id = e.execution_id AND sh.execution_start_time = e.start_time AND sh.state_name = ?)` | NEW — filters executions that have visited a specific state |
| **`stateStatus`** | `string` | same shape, on `sh.status` | NEW |
| **`sortBy`** | `string` enum | one of `startTime`, `endTime`, `status` | NEW — default `startTime` |
| **`order`** | `string` enum | `asc` / `desc` | NEW — default `desc` |

All new parameters are optional. If both `stateName` and `stateStatus` are supplied, they combine within the **same** EXISTS subquery (AND), not as two subqueries.

The `COUNT(*)` query used for the `total` field in `ListExecutionsResponse` MUST apply the same filter set as the listing query (so pagination metadata stays consistent).

---

## 6. Endpoint Response Contracts

### 6.1 `GET /api/v1/dashboard/stats`

Dashboard aggregation for the last 30 days of activity, plus the most recent 10 failed executions.

**Query parameters:** none (uses rolling windows).

**Response (200 OK):**
```json
{
  "statusCounts": [
    { "status": "SUCCEEDED", "count": 1423 },
    { "status": "FAILED", "count": 87 },
    { "status": "RUNNING", "count": 12 },
    { "status": "PAUSED", "count": 3 }
  ],
  "durationStats": {
    "avg_duration": 2.34,
    "max_duration": 48.91,
    "min_duration": 0.11
  },
  "totalExecutions": 1540,
  "totalStateMachines": 7,
  "recentFailures": [
    {
      "executionId": "...",
      "stateMachineId": "...",
      "name": "...",
      "status": "FAILED",
      "startTime": "2026-10-14T08:12:33Z",
      "currentState": "...",
      "error": "..."
    }
  ],
  "timestamp": "2026-10-14T10:00:00Z"
}
```

**Rules:**
- `statusCounts` includes only statuses with count > 0, over the last 30 days from `now`.
- `durationStats` is computed over **SUCCEEDED** executions in the last **7 days** with a non-null `end_time`. Fields are seconds as floats. When no qualifying rows exist, all three fields are `null`.
- `totalExecutions` = count of executions in the last 30 days (not all-time). This matches the portal's current contract.
- `totalStateMachines` = all-time count of `state_machines`.
- `recentFailures` = top 10 `status = 'FAILED'` executions, ordered by `start_time DESC`. Include `executionId`, `stateMachineId`, `name`, `status`, `startTime`, `currentState`, `error` (omit `input`/`output`/`metadata` to keep the payload small).

**Error responses:**
- `500` with `{"error": "...", "message": "...", "code": 500}` on repository failure.

---

### 6.2 `GET /api/v1/state-machines/:stateMachineId/states`

Returns the declared states from the state machine's definition, combined with the statuses that have actually been observed across executions.

**Query parameters:**
| Name | Type | Default | Notes |
|---|---|---|---|
| `limit` | int | `500` | Upper bound on state_history rows sampled. |

**Response (200 OK):**
```json
{
  "stateMachineId": "order-processing",
  "allStates": ["ValidateOrder", "ProcessPayment", "Refund"],
  "usedStates": ["ValidateOrder", "ProcessPayment"],
  "stateStatuses": {
    "ValidateOrder": ["SUCCEEDED", "FAILED"],
    "ProcessPayment": ["SUCCEEDED", "RUNNING"]
  },
  "availableStatuses": [
    "SUCCEEDED", "FAILED", "RUNNING", "CANCELLED",
    "TIMED_OUT", "RETRYING", "WAITING"
  ]
}
```

**Implementation sketch:**
1. Load `state_machines` by id; parse its `definition.States` keys → `allStates`.
2. Gather all `execution_id`s for that state machine (bounded by the `limit`).
3. `SELECT DISTINCT state_name, status FROM state_history WHERE execution_id IN (...)` → populate `usedStates` and `stateStatuses`.
4. `availableStatuses` is the static enum list (same as the portal schema).

**Error responses:**
- `404` if the state machine id does not exist.
- `500` on repository failure.

---

### 6.3 `GET /api/v1/linked-executions`

Paginated list of linked-execution records, used by the portal's "Linked Executions" page.

**Query parameters (all optional):**

| Name | Type | Notes |
|---|---|---|
| `page` | int | default `1` |
| `pageSize` | int | default `25` |
| `sourceStateMachineId` | string | exact |
| `sourceExecutionId` | string | exact |
| `sourceStateName` | string | exact |
| `inputTransformerName` | string | exact |
| `targetStateMachineName` | string | exact |
| `targetExecutionId` | string | exact |
| `createdAtFrom` | int64 (unix seconds) | `>=` |
| `createdAtTo` | int64 (unix seconds) | `<=` |
| `sortBy` | enum | `createdAt` (default), `sourceStateMachineId`, `targetStateMachineName` |
| `order` | enum | `asc`, `desc` (default) |

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "link-1",
      "sourceStateMachineId": "...",
      "sourceExecutionId": "...",
      "sourceStateName": "...",
      "inputTransformerName": "...",
      "targetStateMachineName": "...",
      "targetExecutionId": "...",
      "createdAt": "2026-10-10T14:32:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 312,
    "totalPages": 13
  },
  "filters": { ... the effective query echoed back ... }
}
```

**Files touched:** new handler `handlers/linked_execution.go`, new methods on `repository.Manager` (`ListLinkedExecutions`, `CountLinkedExecutions`).

---

### 6.4 `DELETE /api/v1/linked-executions`

Delete linked-execution records either by explicit id list, or by the same filter set used for listing, gated by `deleteByFilter: true`.

**Request body (JSON):**
```json
{
  "ids": ["link-1", "link-2"],
  "deleteByFilter": false,
  "sourceStateMachineId": "...",
  "sourceExecutionId": "...",
  "createdAtFrom": 0,
  "createdAtTo": 0
}
```

**Semantics:**
- If `ids` is a non-empty array, delete exactly those rows; ignore filter fields.
- Else if `deleteByFilter` is `true`, delete all rows matching the provided filters.

**Response (200 OK):**
```json
{
  "success": true,
  "deletedCount": 2,
  "deletedIds": ["link-1", "link-2"]
}
```

or (filter-mode):
```json
{
  "success": true,
  "deletedCount": 17,
  "expectedCount": 17
}
```

**Error responses:**
- `400` if neither `ids` nor `deleteByFilter` is provided.
- `400` if `deleteByFilter` is `true` but no filter fields are set (refuse wide delete).
- `500` on repository failure.

---

### 6.5 `GET /api/v1/executions/:executionId/start-time`

Simplest endpoint — returns only the `executionStartTime` from the earliest state-history row for the given execution.

**Response (200 OK):**
```json
{
  "executionStartTime": "2026-10-14T08:12:33Z"
}
```

**Implementation:**
```sql
SELECT execution_start_time
FROM state_history
WHERE execution_id = $1
ORDER BY sequence_number ASC
LIMIT 1
```

**Error responses:**
- `404` if no state-history rows exist.
- `500` on repository failure.

---

### 6.6 `GET /api/v1/executions/:executionId/history` — cursor pagination

**Add to existing handler:**

| Query param | Type | Default | Behaviour |
|---|---|---|---|
| `after_sequence_number` | int | unset | `WHERE sequence_number > $1` |
| `limit` | int | `100` | `LIMIT $1` (cap at 1000) |
| `order` | enum: `asc`/`desc` | `asc` | direction; clients default `asc` |

**Response additions:** when the request is paginated, include metadata alongside the existing array:
```json
{
  "states": [ ... existing StateHistoryResponse array ... ],
  "pagination": {
    "limit": 100,
    "cursor": 0,
    "nextCursor": 100,
    "hasMore": true,
    "loadedStates": 100,
    "totalStates": 523
  }
}
```

When `after_sequence_number` and `limit` are **not** supplied, the existing behavior (return all as a bare JSON array) is preserved for backward compatibility with other clients.

---

## 7. JSON Field-Naming Convention — Critical

The portal's Drizzle schema declared all columns with **camelCase property names** (`executionId`, `stateMachineId`, `startTime`, …). The portal's React components consume camelCase JSON.

**Gin MUST return camelCase field names.** Existing handlers already do this via struct tags (e.g. `` json:"executionId" ``). Audit every new model/response struct in this scope to confirm:

- All nested objects use camelCase JSON keys.
- No snake_case leakage from DB column names.
- Timestamps are rendered in ISO 8601 UTC (`2026-10-14T10:00:00Z`) — NOT unix seconds and NOT with timezone offsets.

---

## 8. Consistency with Existing Error Shape

Gin already uses `models.ErrorResponse` (`error`, `message`, `code`). New handlers MUST use the same shape. The portal's BFF proxy will forward the body unchanged; UI components key off `status` and `error`, not shape.

---

## 9. Acceptance Criteria

An implementation is accepted when all of the following hold:

1. **`go build ./...` succeeds** with no lint/vet regressions.
2. **Unit tests** exist for:
   - Each new repository method (positive, empty, repository-failure cases).
   - Each new handler (success path, 4xx path, 5xx path).
   - Filter combinations that exercise the new `ExecutionFilter` fields, including `stateName + stateStatus` together.
3. **Integration test** against a real (or testcontainer) PostgreSQL that:
   - Seeds ≥2 state machines with differing record counts.
   - Hits each of the 5 new endpoints and the 2 extended endpoints.
   - Asserts response shape and field-level values against the contracts in §6.
4. **Live sanity check** running the portal UI against the extended Gin:
   - Dashboard page loads with non-zero `statusCounts` and `recentFailures`.
   - Executions page accepts all filter combinations from the portal's filter sidebar.
   - State machine detail page shows the correct used/declared state list.
   - Linked-executions page paginates and filters correctly; deletes work.
   - State history page handles very long executions without timeouts (cursor paging).
5. **Response shape parity**: take a representative payload from the current portal route (Drizzle output), copy-paste it as the expected JSON, and compare against the new handler's response. Document any intentional divergence.
6. **No use of direct SQL strings in the portal** after this stage — when portal rewrite begins, queries must only be issued against these Gin endpoints.

---

## 10. Verifying Integration with the Portal

After Gin implementation is merged and running, the portal team (same operator) will:

1. Start the Gin server locally or in docker with a seeded DB.
2. Point `DOWNSTREAM_GIN_BASE_URL=http://localhost:8080/state-machines` at it.
3. Execute the portal's smoke walk (dashboard → state machines → executions → execution detail with state history → linked executions → create state machine).
4. Run `npm run type-check && npm run build` from the portal repo to confirm no frontend type breakage.

Any endpoint behavioral differences found during this walk will be triaged as either:
- **Gin contract clarification** (this RFP needed an update — amend and re-implement), or
- **Portal normalization** (small client adapter reshaping the payload).

Preference is resolving divergences at the Gin layer to keep the portal thin.

---

## 11. Repository Abstraction Notes

Where the new repository methods live:

- `ListStateMachines` and `ListExecutions` already live on `repository.Manager`.
- Add analogous manager methods for the five new endpoints. Do not expose repository instances directly to handlers.
- For cross-table aggregations (`dashboard/stats`), a dedicated aggregation method on the manager is preferred over composition of smaller queries — one DB round-trip where possible.
- `linked_executions` queries go under the existing `state_history`-adjacent query helpers; keep them with other per-execution metadata.

If the underlying `repository.Manager` interface does not currently expose the required query primitives (e.g., grouped counts, aggregation, EXISTS subqueries), add them as new repository methods rather than bypassing the manager. The repository is the seam that will later be swapped for `sluice-go`.

---

## 12. Open Items / Questions to Resolve Before Development

1. **Portal's `state_machine_states` endpoint** (RFP §6.2) enumerates states across up to `limit` executions. For state machines with thousands of executions, we cap the execution sample. Confirm the `limit` default of `500` is acceptable; raise if a specific state machine justifies a higher cap.
2. **Linked-execution deletes** are destructive and will be reachable to anyone with portal access. Plan to add a soft-delete flag or an audit row? Decision deferred — implement hard delete for now, matching portal spec.
3. **Dashboard stats** — the rolling window (`now - 30 days` / `now - 7 days`) is computed at handler time. If the Gin server runs far behind UTC via clock skew, results drift. Recommend computing windows in the repository using the DB's `NOW()` rather than Go's `time.Now()`.

---

## 13. Timeline & Coordination

- **Gin implementation** to be completed against this RFP and released as a tagged version (suggested `v1.1.0` since this is additive).
- **Portal rewrite** begins once the tagged Gin image is available for smoke testing.
- **API-key injection** follows in a subsequent change once both sides confirm a working clear-text flow.

---

## Appendix A — Example Portal Filter Style that Must Map Through

This is the portal's Zod validation schema for `GET /api/executions`. Gin's filter surface (§5) must be able to accept every combination seen here:

```
?page=1
&pageSize=25
&stateMachineId=order-processing
&status=RUNNING
&executionId=exec-abc-123
&executionName=order-98765
&startTimeFrom=1729000000
&startTimeTo=1729086400
&stateName=ProcessPayment
&stateStatus=WAITING
&sortBy=startTime
&order=desc
```

All fields are optional; any combination is valid.

## Appendix B — Execution Hourglass Table

Quick lookup of what Gin returns for what the portal currently sends to the DB:

| Portal read route | Portal currently queries | After Stage 1 | Gin implements? |
|---|---|---|---|
| `GET /api/dashboard/stats` | Aggregations on executions/state_machines | Proxied | ✅ New §6.1 |
| `GET /api/executions` | Filtered, paginated, joined with state_history | Proxied | ✅ Existing + §5 |
| `GET /api/executions/:id` | Single row | Proxied | ✅ Existing |
| `GET /api/executions/:id/start-time` | First state_history row | Proxied | ✅ New §6.5 |
| `GET /api/state-machines` | List with search/sort/pagination | Proxied | ✅ Existing |
| `GET /api/state-machines/:id` | Single row + parsed definition | Proxied | ✅ Existing |
| `GET /api/state-machines/:id/states` | State machine + executions + state_history | Proxied | ✅ New §6.2 |
| `POST /api/state-machines/create` | Already proxied | Unchanged | — |
| `GET /api/state-history` | Custom cursor + loop detection | Proxied, loop detection moved to client | ✅ Existing + §6.6 |
| `GET /api/linked-executions` | Custom filters + pagination | Proxied | ✅ New §6.3 |
| `DELETE /api/linked-executions` | By ids or by filters | Proxied | ✅ New §6.4 |
| `GET /api/service-health` | Ping downstream | Proxied | ✅ Existing |
| `GET /api/transformers` | Already proxied | Unchanged | — |
| `POST /api/executions/launch*` (4 routes) | Already proxied | Unchanged (+ API key later) | — |
| `POST /api/sql-execute` | Direct Drizzle SQL | **Removed from portal** | — |
