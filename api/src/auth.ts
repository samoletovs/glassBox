// Single-user owner gate. On SWA Free we cannot use custom roles, so we check the
// authenticated email (x-ms-client-principal) against OWNER_EMAIL. Locally, with no
// OWNER_EMAIL set, access is open so the cockpit runs without auth wiring.
import type { HttpRequest, HttpResponseInit } from '@azure/functions';

interface ClientPrincipal {
  userDetails?: string;
}

function readPrincipal(request: HttpRequest): ClientPrincipal | undefined {
  const header = request.headers.get('x-ms-client-principal');
  if (!header) return undefined;
  try {
    const json = Buffer.from(header, 'base64').toString('utf8');
    return JSON.parse(json) as ClientPrincipal;
  } catch {
    return undefined;
  }
}

/** Returns a 401 response when the caller is not the owner, otherwise null. */
export function ownerGate(request: HttpRequest): HttpResponseInit | null {
  const owner = process.env.OWNER_EMAIL;
  if (!owner) return null; // local dev — open

  const principal = readPrincipal(request);
  if (principal?.userDetails && principal.userDetails.toLowerCase() === owner.toLowerCase()) {
    return null;
  }
  return { status: 401, jsonBody: { error: 'Not authorized' } };
}
