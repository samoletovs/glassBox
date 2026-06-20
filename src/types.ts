// Domain types for the glassBox seller cockpit (Phase 1).
// Kept in sync with api/src/types.ts by hand (SWA has no shared package yet).

export const ITEM_STATUSES = [
  'captured',
  'priced',
  'drafted',
  'listed',
  'negotiating',
  'sold',
  'archived',
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ACTION_TYPES = ['publish', 'priceDrop', 'sendReply'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export type ActionStatus = 'pending' | 'approved' | 'rejected';

export interface PriceBand {
  low: number;
  high: number;
  currency: string;
  evidence?: string;
}

export interface Description {
  lv?: string;
  ru?: string;
  en?: string;
}

export interface Metrics {
  views?: number;
  position?: number;
  ageDays?: number;
}

export interface Item {
  id: string;
  title: string;
  photos: string[];
  category?: string;
  condition?: string;
  currency: string;
  priceBand?: PriceBand;
  listPrice?: number;
  description: Description;
  strategy?: string;
  status: ItemStatus;
  ssUrl?: string;
  metrics?: Metrics;
  createdAt: string;
  updatedAt: string;
}

export interface ProposedAction {
  id: string;
  itemId: string;
  type: ActionType;
  status: ActionStatus;
  payload: Record<string, unknown>;
  proposedBy: 'agent' | 'human';
  createdAt: string;
  decidedAt?: string;
}

export interface AuditEntry {
  id: string;
  itemId?: string;
  actor: 'agent' | 'human';
  kind: string;
  summary: string;
  at: string;
}

export interface BoardState {
  items: Item[];
  pendingActions: ProposedAction[];
  log: AuditEntry[];
}
