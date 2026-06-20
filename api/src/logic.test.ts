import { describe, expect, it } from 'vitest';
import {
  createItem,
  decideAction,
  deleteItem,
  deriveState,
  emptyDb,
  proposeAction,
  updateItem,
} from './logic';

describe('glassBox seller-cockpit logic', () => {
  it('captures a new item in status "captured"', () => {
    const db = emptyDb();
    const item = createItem(db, { title: 'Old drone', photos: ['drone.jpg'] });
    expect(item.status).toBe('captured');
    expect(item.currency).toBe('EUR');
    expect(db.items).toHaveLength(1);
    expect(db.log.at(-1)?.kind).toBe('create');
  });

  it('lets the agent fill price + description + strategy and advance status', () => {
    const db = emptyDb();
    const item = createItem(db, { title: 'Bike' });
    const updated = updateItem(db, item.id, {
      priceBand: { low: 120, high: 180, currency: 'EUR' },
      listPrice: 160,
      description: { lv: 'Labs velosipēds' },
      strategy: 'Start at 160, drop to 140 after 10 days',
      status: 'drafted',
    });
    expect(updated?.listPrice).toBe(160);
    expect(updated?.description.lv).toBe('Labs velosipēds');
    expect(updated?.status).toBe('drafted');
  });

  it('merges description rather than replacing it', () => {
    const db = emptyDb();
    const item = createItem(db, { title: 'Sofa' });
    updateItem(db, item.id, { description: { lv: 'LV' } });
    const updated = updateItem(db, item.id, { description: { en: 'EN' } });
    expect(updated?.description).toEqual({ lv: 'LV', en: 'EN' });
  });

  it('requires approval to publish — approving sets status "listed" + ssUrl', () => {
    const db = emptyDb();
    const item = createItem(db, { title: 'Camera' });
    const action = proposeAction(db, item.id, 'publish', { ssUrl: 'https://ss.lv/x' });
    expect(action?.status).toBe('pending');
    expect(deriveState(db).pendingActions).toHaveLength(1);

    decideAction(db, action!.id, 'approved');
    const after = db.items.find((it) => it.id === item.id);
    expect(after?.status).toBe('listed');
    expect(after?.ssUrl).toBe('https://ss.lv/x');
    expect(deriveState(db).pendingActions).toHaveLength(0);
  });

  it('applies an approved price drop', () => {
    const db = emptyDb();
    const item = createItem(db, { title: 'Guitar' });
    updateItem(db, item.id, { listPrice: 200 });
    const action = proposeAction(db, item.id, 'priceDrop', { from: 200, to: 170 });
    decideAction(db, action!.id, 'approved');
    expect(db.items[0].listPrice).toBe(170);
  });

  it('rejecting an action changes nothing but is logged', () => {
    const db = emptyDb();
    const item = createItem(db, { title: 'Table' });
    const action = proposeAction(db, item.id, 'publish', {});
    decideAction(db, action!.id, 'rejected');
    expect(db.items[0].status).toBe('captured');
    expect(db.log.at(-1)?.kind).toBe('reject');
  });

  it('does not propose actions for unknown items', () => {
    const db = emptyDb();
    expect(proposeAction(db, 'missing', 'publish', {})).toBeUndefined();
  });

  it('deletes an item and its pending actions', () => {
    const db = emptyDb();
    const item = createItem(db, { title: 'Lamp' });
    proposeAction(db, item.id, 'publish', {});
    expect(deleteItem(db, item.id)).toBe(true);
    expect(db.items).toHaveLength(0);
    expect(db.actions).toHaveLength(0);
  });
});
