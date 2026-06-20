import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { ownerGate } from '../auth';
import { deriveState } from '../logic';
import { getStore } from '../store';

// GET /api/state.json  → the whole board in one read (the agent's cheap read surface).
app.http('state', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'state.json',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const denied = ownerGate(request);
    if (denied) return denied;
    const db = await getStore().read();
    return { jsonBody: deriveState(db) };
  },
});
