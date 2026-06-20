import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { ownerGate } from '../auth';
import { deleteItem, isItemStatus, updateItem, type UpdateItemInput } from '../logic';
import { getStore, withDb } from '../store';

// GET /api/items/{id}
app.http('getItem', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'items/{id}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const id = request.params.id;
    const db = await getStore().read();
    const item = db.items.find((it) => it.id === id);
    return item ? { jsonBody: item } : { status: 404, jsonBody: { error: 'Not found' } };
  },
});

// PATCH /api/items/{id}  → agent fills price / description / strategy / status
app.http('updateItem', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'items/{id}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const id = request.params.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const patch = body as Record<string, unknown>;
    if (patch.status !== undefined && !isItemStatus(patch.status)) {
      return { status: 400, jsonBody: { error: `Invalid status: ${String(patch.status)}` } };
    }

    const updated = await withDb((db) =>
      updateItem(db, id, { ...(patch as UpdateItemInput), actor: 'agent' }),
    );
    return updated
      ? { jsonBody: updated }
      : { status: 404, jsonBody: { error: 'Not found' } };
  },
});

// DELETE /api/items/{id}
app.http('deleteItem', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'items/{id}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const id = request.params.id;
    const ok = await withDb((db) => deleteItem(db, id, 'human'));
    return ok ? { status: 204 } : { status: 404, jsonBody: { error: 'Not found' } };
  },
});
