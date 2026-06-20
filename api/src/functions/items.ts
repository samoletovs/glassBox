import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { ownerGate } from '../auth';
import { createItem, deriveState } from '../logic';
import { getStore, withDb } from '../store';

// GET /api/items  → list all items
app.http('listItems', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'items',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const db = await getStore().read();
    return { jsonBody: deriveState(db).items };
  },
});

// POST /api/items  → capture a new item ("sell this")
app.http('createItem', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'items',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const input = body as Record<string, unknown>;
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) {
      return { status: 400, jsonBody: { error: 'title is required' } };
    }

    const photos = Array.isArray(input.photos)
      ? input.photos.filter((p): p is string => typeof p === 'string')
      : undefined;

    const item = await withDb((db) =>
      createItem(db, {
        title,
        photos,
        category: typeof input.category === 'string' ? input.category : undefined,
        condition: typeof input.condition === 'string' ? input.condition : undefined,
        currency: typeof input.currency === 'string' ? input.currency : undefined,
        actor: 'agent',
      }),
    );

    context.log(`Captured item ${item.id}: ${item.title}`);
    return { status: 201, jsonBody: item };
  },
});
