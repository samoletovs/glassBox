import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { ownerGate } from '../auth';
import { decideAction, deriveState, isActionType, proposeAction } from '../logic';
import { getStore, withDb } from '../store';

// POST /api/items/{id}/actions  → agent proposes an irreversible action (require-approval)
app.http('proposeAction', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'items/{id}/actions',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const itemId = request.params.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const input = body as Record<string, unknown>;
    if (!isActionType(input.type)) {
      return { status: 400, jsonBody: { error: `Invalid action type: ${String(input.type)}` } };
    }
    const payload =
      input.payload && typeof input.payload === 'object'
        ? (input.payload as Record<string, unknown>)
        : {};

    const action = await withDb((db) => proposeAction(db, itemId, input.type as never, payload));
    return action
      ? { status: 201, jsonBody: action }
      : { status: 404, jsonBody: { error: 'Item not found' } };
  },
});

// GET /api/actions  → pending approvals
app.http('listActions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'actions',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const db = await getStore().read();
    return { jsonBody: deriveState(db).pendingActions };
  },
});

// POST /api/actions/{id}/approve
app.http('approveAction', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'actions/{id}/approve',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const result = await withDb((db) => decideAction(db, request.params.id, 'approved'));
    return result
      ? { jsonBody: { ok: true, action: result } }
      : { status: 404, jsonBody: { error: 'Action not found' } };
  },
});

// POST /api/actions/{id}/reject
app.http('rejectAction', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'actions/{id}/reject',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const result = await withDb((db) => decideAction(db, request.params.id, 'rejected'));
    return result
      ? { jsonBody: { ok: true, action: result } }
      : { status: 404, jsonBody: { error: 'Action not found' } };
  },
});
