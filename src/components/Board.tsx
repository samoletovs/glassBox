import type { Item, ItemStatus } from '../types';
import { ITEM_STATUSES } from '../types';
import { ItemCard } from './ItemCard';

interface BoardProps {
  items: Item[];
  loading: boolean;
}

const COLUMN_LABELS: Record<ItemStatus, string> = {
  captured: 'Captured',
  priced: 'Priced',
  drafted: 'Drafted',
  listed: 'Listed',
  negotiating: 'Negotiating',
  sold: 'Sold',
  archived: 'Archived',
};

export function Board({ items, loading }: BoardProps) {
  if (loading && items.length === 0) {
    return (
      <section className="board" aria-label="Items board">
        <div className="board__skeleton" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="board board--empty" aria-label="Items board">
        <p className="board__empty-text">
          Nothing here yet. In VS Code, tell your agent: <code>“sell my old drone”</code> and add a
          photo — it will create the first item.
        </p>
      </section>
    );
  }

  return (
    <section className="board" aria-label="Items board">
      {ITEM_STATUSES.map((status) => {
        const columnItems = items.filter((it) => it.status === status);
        return (
          <div key={status} className="board__column" data-testid={`column-${status}`}>
            <h2 className="board__column-title">
              <span className={`dot dot--${status}`} aria-hidden="true" />
              {COLUMN_LABELS[status]}
              <span className="board__count" aria-label={`${columnItems.length} items`}>
                {columnItems.length}
              </span>
            </h2>
            <ul className="board__list" role="list">
              {columnItems.map((item) => (
                <li key={item.id} role="listitem">
                  <ItemCard item={item} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
