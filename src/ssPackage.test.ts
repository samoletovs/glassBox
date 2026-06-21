import { describe, expect, it } from 'vitest';
import { buildSsPackage, resolveCategory } from './ssPackage';
import type { Item } from './types';

function makeItem(over: Partial<Item> = {}): Item {
  return {
    id: 'i1',
    title: 'DJI Mini 2 drone',
    photos: [],
    currency: 'EUR',
    description: {},
    status: 'drafted',
    createdAt: '2026-06-21T00:00:00Z',
    updatedAt: '2026-06-21T00:00:00Z',
    ...over,
  };
}

describe('ssPackage (local listing prep — no ss.lv contact)', () => {
  it('routes known categories directly', () => {
    expect(resolveCategory('furniture').browseUrl).toContain('furniture-interior');
    expect(resolveCategory('phones').browseUrl).toContain('mobile-telephones');
  });

  it('fuzzy-routes free-text categories', () => {
    expect(resolveCategory('Used iPhone').browseUrl).toContain('mobile-telephones');
    expect(resolveCategory('Mountain bike').browseUrl).toContain('bicycle');
    expect(resolveCategory('Camera/drone').browseUrl).toContain('audio-video');
  });

  it('falls back to the homepage for unknown categories', () => {
    expect(resolveCategory('something weird').browseUrl).toBe('https://www.ss.lv/lv/');
    expect(resolveCategory(undefined).browseUrl).toBe('https://www.ss.lv/lv/');
  });

  it('builds a Latvian body with condition + price', () => {
    const pkg = buildSsPackage(
      makeItem({
        category: 'Electronics',
        condition: 'lietots',
        listPrice: 160,
        description: { lv: 'Labs drons ar 3 baterijām' },
      }),
    );
    expect(pkg.bodyLv).toContain('Labs drons');
    expect(pkg.bodyLv).toContain('Stāvoklis: lietots');
    expect(pkg.bodyLv).toContain('Cena: 160 EUR');
    expect(pkg.category.browseUrl).toContain('electronics');
    expect(pkg.howTo).toContain('Pievienot sludinājumu');
  });

  it('handles missing price and description gracefully', () => {
    const pkg = buildSsPackage(makeItem());
    expect(pkg.priceLine).toBe('Cena: vienoties');
    expect(pkg.bodyLv).toBe('Cena: vienoties');
    expect(pkg.bodyRu).toBeUndefined();
  });
});
