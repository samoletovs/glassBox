import { useState } from 'react';
import type { Item } from '../types';
import { buildSsPackage } from '../ssPackage';

interface SsPostPanelProps {
  item: Item;
}

// "Post it yourself on ss.lv" — ss.lv disallows automated posting (robots.txt) and stubs bots,
// so glassBox prepares everything and the HUMAN does the final submit. Zero ss.lv contact here.
export function SsPostPanel({ item }: SsPostPanelProps) {
  const pkg = buildSsPackage(item);
  const [copied, setCopied] = useState(false);

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(pkg.bodyLv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="sspanel" data-testid={`sspanel-${item.id}`} aria-label="Post on ss.lv">
      <p className="sspanel__title">Post it yourself on ss.lv</p>
      <a
        className="sspanel__cat"
        href={pkg.category.browseUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {pkg.category.label} ↗
      </a>
      <button
        type="button"
        className="btn sspanel__copy"
        onClick={copyBody}
        aria-label="Copy the listing text to paste on ss.lv"
      >
        {copied ? 'Copied ✓' : 'Copy listing text'}
      </button>
      <p className="sspanel__hint">{pkg.howTo}</p>
    </section>
  );
}
