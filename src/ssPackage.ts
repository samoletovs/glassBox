// Local listing-prep — turns a board item into a copy-paste-ready ss.lv listing package.
// IMPORTANT: this touches ss.lv ZERO times. ss.lv disallows the post flow in robots.txt and
// stubs automated reads, so posting + price-checking stay HUMAN actions. This only formats text
// and points the human at the right category page to open themselves.
import type { Item } from './types';

export interface SsCategory {
  label: string;
  /** Public ss.lv category page (lv). The human opens it and clicks "Pievienot sludinājumu". */
  browseUrl: string;
}

// A small, hand-curated map of common categories → ss.lv lv sections. Extend as needed.
const SS_CATEGORIES: Record<string, SsCategory> = {
  electronics: { label: 'Elektronika', browseUrl: 'https://www.ss.lv/lv/electronics/' },
  phones: {
    label: 'Mobilie telefoni',
    browseUrl: 'https://www.ss.lv/lv/electronics/mobile-telephones/',
  },
  computers: { label: 'Datori', browseUrl: 'https://www.ss.lv/lv/electronics/computers/' },
  'audio-video': {
    label: 'Audio/Video',
    browseUrl: 'https://www.ss.lv/lv/electronics/audio-video/',
  },
  appliances: {
    label: 'Sadzīves tehnika',
    browseUrl: 'https://www.ss.lv/lv/household-goods/home-electric-appliances/',
  },
  furniture: {
    label: 'Mēbeles / interjers',
    browseUrl: 'https://www.ss.lv/lv/household-goods/furniture-interior/',
  },
  sports: { label: 'Sports / atpūta', browseUrl: 'https://www.ss.lv/lv/sport/' },
  bikes: { label: 'Velosipēdi', browseUrl: 'https://www.ss.lv/lv/transport/bicycle/' },
  clothing: { label: 'Apģērbi / apavi', browseUrl: 'https://www.ss.lv/lv/clothes-footwear/' },
  kids: { label: 'Bērnu preces', browseUrl: 'https://www.ss.lv/lv/childrens-goods/' },
  tools: { label: 'Darbarīki / tehnika', browseUrl: 'https://www.ss.lv/lv/work-clothes-tools/' },
  auto: { label: 'Auto rezerves daļas', browseUrl: 'https://www.ss.lv/lv/transport/spare-parts/' },
};

const DEFAULT_CATEGORY: SsCategory = {
  label: 'Visi sludinājumi',
  browseUrl: 'https://www.ss.lv/lv/',
};

/** Best-effort map of a free-text category to an ss.lv section. Falls back to the homepage. */
export function resolveCategory(category: string | undefined): SsCategory {
  if (!category) return DEFAULT_CATEGORY;
  const c = category.toLowerCase();
  const direct = SS_CATEGORIES[c];
  if (direct) return direct;
  // fuzzy keyword routing
  const has = (...kw: string[]) => kw.some((k) => c.includes(k));
  if (has('phone', 'telefon', 'mobil')) return SS_CATEGORIES.phones;
  if (has('comput', 'laptop', 'dator', 'pc')) return SS_CATEGORIES.computers;
  if (has('camera', 'photo', 'audio', 'video', 'tv', 'drone', 'dron')) return SS_CATEGORIES['audio-video'];
  if (has('electro', 'elektro', 'gadget')) return SS_CATEGORIES.electronics;
  if (has('appliance', 'tehnika', 'fridge', 'washer')) return SS_CATEGORIES.appliances;
  if (has('furnitur', 'mēbel', 'mebel', 'sofa', 'table', 'chair')) return SS_CATEGORIES.furniture;
  if (has('bike', 'bicycl', 'velo')) return SS_CATEGORIES.bikes;
  if (has('sport', 'fitness')) return SS_CATEGORIES.sports;
  if (has('cloth', 'apģērb', 'apgerb', 'shoe', 'apav')) return SS_CATEGORIES.clothing;
  if (has('kid', 'child', 'bērn', 'bern', 'baby')) return SS_CATEGORIES.kids;
  if (has('tool', 'darbarīk', 'drill')) return SS_CATEGORIES.tools;
  if (has('auto', 'car', 'spare', 'rezerves')) return SS_CATEGORIES.auto;
  return DEFAULT_CATEGORY;
}

export interface SsPackage {
  category: SsCategory;
  priceLine: string;
  /** Listing body, ready to paste — prefers Latvian, includes condition + price. */
  bodyLv: string;
  bodyRu?: string;
  /** One-line how-to for the human. */
  howTo: string;
}

function priceLine(item: Item): string {
  if (item.listPrice === undefined) return 'Cena: vienoties';
  return `Cena: ${item.listPrice} ${item.currency}`;
}

function composeBody(text: string | undefined, item: Item): string | undefined {
  if (!text) return undefined;
  const parts = [text.trim()];
  if (item.condition) parts.push(`Stāvoklis: ${item.condition}`);
  parts.push(priceLine(item));
  return parts.join('\n\n');
}

/**
 * Build everything a human needs to post this item on ss.lv themselves.
 * No network — pure formatting. The human opens `category.browseUrl` and submits.
 */
export function buildSsPackage(item: Item): SsPackage {
  const category = resolveCategory(item.category);
  const bodyLv = composeBody(item.description.lv ?? item.description.en, item) ?? priceLine(item);
  const bodyRu = composeBody(item.description.ru, item);
  return {
    category,
    priceLine: priceLine(item),
    bodyLv,
    bodyRu,
    howTo: `Atver “${category.label}” (${category.browseUrl}), spied “Pievienot sludinājumu”, ielīmē virsrakstu, aprakstu un cenu, pievieno foto un publicē.`,
  };
}
