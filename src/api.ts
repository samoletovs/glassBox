import type { BoardState } from './types';

// Carries the HTTP status so the UI can treat 401 (auth) differently from transient errors.
export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Thin fetch wrapper. The app makes NO model calls — it only talks to its own API.
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${url} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchState(): Promise<BoardState> {
  return getJson<BoardState>('/api/state.json');
}

export async function approveAction(id: string): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>(`/api/actions/${encodeURIComponent(id)}/approve`);
}

export async function rejectAction(id: string): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>(`/api/actions/${encodeURIComponent(id)}/reject`);
}
