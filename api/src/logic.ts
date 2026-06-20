// Pure domain logic — no I/O, no model calls. Unit-tested in store.test.ts.
import {
  ACTION_TYPES,
  ITEM_STATUSES,
  type ActionType,
  type AuditEntry,
  type BoardState,
  type Db,
  type Description,
  type Item,
  type ItemStatus,
  type PriceBand,
  type ProposedAction,
} from './types';

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function emptyDb(): Db {
  return { items: [], actions: [], log: [] };
}

export function deriveState(db: Db): BoardState {
  return {
    items: db.items,
    pendingActions: db.actions.filter((a) => a.status === 'pending'),
    log: db.log,
  };
}

function addLog(db: Db, actor: AuditEntry['actor'], kind: string, summary: string, itemId?: string) {
  db.log.push({ id: newId('log'), actor, kind, summary, itemId, at: nowIso() });
}

export function isItemStatus(v: unknown): v is ItemStatus {
  return typeof v === 'string' && (ITEM_STATUSES as readonly string[]).includes(v);
}

export function isActionType(v: unknown): v is ActionType {
  return typeof v === 'string' && (ACTION_TYPES as readonly string[]).includes(v);
}

export interface CreateItemInput {
  title: string;
  photos?: string[];
  category?: string;
  condition?: string;
  currency?: string;
  actor?: 'agent' | 'human';
}

export function createItem(db: Db, input: CreateItemInput): Item {
  const ts = nowIso();
  const item: Item = {
    id: newId('item'),
    title: input.title.trim(),
    photos: input.photos ?? [],
    category: input.category,
    condition: input.condition,
    currency: input.currency ?? 'EUR',
    description: {},
    status: 'captured',
    createdAt: ts,
    updatedAt: ts,
  };
  db.items.push(item);
  addLog(db, input.actor ?? 'agent', 'create', `Captured “${item.title}”`, item.id);
  return item;
}

export interface UpdateItemInput {
  title?: string;
  photos?: string[];
  category?: string;
  condition?: string;
  currency?: string;
  priceBand?: PriceBand;
  listPrice?: number;
  description?: Description;
  strategy?: string;
  status?: ItemStatus;
  ssUrl?: string;
  actor?: 'agent' | 'human';
}

const EDITABLE_KEYS = [
  'title',
  'photos',
  'category',
  'condition',
  'currency',
  'priceBand',
  'listPrice',
  'description',
  'strategy',
  'status',
  'ssUrl',
] as const;

export function updateItem(db: Db, id: string, patch: UpdateItemInput): Item | undefined {
  const item = db.items.find((it) => it.id === id);
  if (!item) return undefined;

  const changed: string[] = [];
  for (const key of EDITABLE_KEYS) {
    const value = patch[key];
    if (value === undefined) continue;
    if (key === 'description') {
      item.description = { ...item.description, ...(value as Description) };
    } else {
      // Each key is assignable on Item; the union is validated by callers.
      (item as unknown as Record<string, unknown>)[key] = value;
    }
    changed.push(key);
  }

  if (changed.length === 0) return item;

  item.updatedAt = nowIso();
  addLog(
    db,
    patch.actor ?? 'agent',
    'update',
    `Updated “${item.title}” (${changed.join(', ')})`,
    item.id,
  );
  return item;
}

export function deleteItem(db: Db, id: string, actor: 'agent' | 'human' = 'human'): boolean {
  const idx = db.items.findIndex((it) => it.id === id);
  if (idx === -1) return false;
  const [removed] = db.items.splice(idx, 1);
  db.actions = db.actions.filter((a) => a.itemId !== id);
  addLog(db, actor, 'delete', `Removed “${removed.title}”`, id);
  return true;
}

export function proposeAction(
  db: Db,
  itemId: string,
  type: ActionType,
  payload: Record<string, unknown>,
  proposedBy: 'agent' | 'human' = 'agent',
): ProposedAction | undefined {
  const item = db.items.find((it) => it.id === itemId);
  if (!item) return undefined;
  const action: ProposedAction = {
    id: newId('act'),
    itemId,
    type,
    status: 'pending',
    payload,
    proposedBy,
    createdAt: nowIso(),
  };
  db.actions.push(action);
  addLog(db, proposedBy, 'propose', `Proposed ${type} for “${item.title}”`, itemId);
  return action;
}

function applyApproved(db: Db, action: ProposedAction): void {
  const item = db.items.find((it) => it.id === action.itemId);
  if (!item) return;

  switch (action.type) {
    case 'publish': {
      item.status = 'listed';
      if (typeof action.payload.ssUrl === 'string') item.ssUrl = action.payload.ssUrl;
      addLog(db, 'human', 'publish', `Published “${item.title}” to ss.lv`, item.id);
      break;
    }
    case 'priceDrop': {
      const to = Number(action.payload.to);
      if (!Number.isNaN(to)) item.listPrice = to;
      addLog(db, 'human', 'priceDrop', `Dropped price of “${item.title}” to €${to}`, item.id);
      break;
    }
    case 'sendReply': {
      if (item.status === 'listed') item.status = 'negotiating';
      addLog(db, 'human', 'sendReply', `Sent reply about “${item.title}”`, item.id);
      break;
    }
    default: {
      const _exhaustive: never = action.type;
      return _exhaustive;
    }
  }
  item.updatedAt = nowIso();
}

export function decideAction(
  db: Db,
  id: string,
  decision: 'approved' | 'rejected',
): ProposedAction | undefined {
  const action = db.actions.find((a) => a.id === id);
  if (!action) return undefined;
  if (action.status !== 'pending') return action;

  action.status = decision;
  action.decidedAt = nowIso();

  if (decision === 'approved') {
    applyApproved(db, action);
  } else {
    const item = db.items.find((it) => it.id === action.itemId);
    addLog(db, 'human', 'reject', `Rejected ${action.type} for “${item?.title ?? action.itemId}”`, action.itemId);
  }
  return action;
}
