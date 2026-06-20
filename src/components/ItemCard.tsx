import { useState } from 'react';
import type { Item } from '../types';

interface ItemCardProps {
  item: Item;
}

function looksLikeImage(src: string): boolean {
  return /^(https?:|data:image\/)/i.test(src) || /\.(png|jpe?g|webp|gif)$/i.test(src);
}

function formatPrice(value: number | undefined, currency: string): string {
  if (value === undefined) return '—';
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(value);
}

export function ItemCard({ item }: ItemCardProps) {
  const {
    title,
    photos,
    priceBand,
    listPrice,
    currency,
    description,
    strategy,
    ssUrl,
    status,
    category,
    condition,
  } = item;
  const cover = photos[0];
  const blurb = description.lv ?? description.en ?? description.ru;
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(cover) && looksLikeImage(cover) && !imgFailed;

  return (
    <article className="card" data-testid={`item-${item.id}`} aria-label={`Item: ${title}`}>
      <div className="card__media">
        {showImage ? (
          <img
            className="card__img"
            src={cover}
            alt={title}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="card__placeholder" aria-hidden="true">
            📦
          </span>
        )}
        <span className={`badge badge--${status}`}>
          <span className={`dot dot--${status}`} aria-hidden="true" />
          {status}
        </span>
      </div>

      <div className="card__body">
        <h3 className="card__title">{title}</h3>

        {category || condition ? (
          <div className="card__chips">
            {category ? <span className="chip">{category}</span> : null}
            {condition ? <span className="chip chip--muted">{condition}</span> : null}
          </div>
        ) : null}

        <dl className="card__meta">
          <div className="card__row">
            <dt>List price</dt>
            <dd data-testid={`price-${item.id}`}>{formatPrice(listPrice, currency)}</dd>
          </div>
          {priceBand ? (
            <div className="card__row">
              <dt>Market</dt>
              <dd>
                {formatPrice(priceBand.low, priceBand.currency)}–
                {formatPrice(priceBand.high, priceBand.currency)}
              </dd>
            </div>
          ) : null}
        </dl>

        {blurb ? <p className="card__blurb">{blurb}</p> : null}
        {strategy ? (
          <p className="card__strategy">
            <strong>Strategy:</strong> {strategy}
          </p>
        ) : null}

        <footer className="card__footer">
          {ssUrl ? (
            <a className="card__link" href={ssUrl} target="_blank" rel="noopener noreferrer">
              View on ss.lv ↗
            </a>
          ) : (
            <span className="card__hint">not posted yet</span>
          )}
        </footer>
      </div>
    </article>
  );
}
