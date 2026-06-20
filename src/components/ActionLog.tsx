import type { AuditEntry } from '../types';

interface ActionLogProps {
  entries: AuditEntry[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-IE');
}

export function ActionLog({ entries }: ActionLogProps) {
  if (entries.length === 0) {
    return null;
  }

  const recent = [...entries].slice(-25).reverse();

  return (
    <section className="log" aria-label="Action log" data-testid="action-log">
      <h2 className="log__title">Action log</h2>
      <ol className="log__list" role="list">
        {recent.map((entry) => (
          <li key={entry.id} className="log__entry">
            <span className={`log__actor log__actor--${entry.actor}`}>{entry.actor}</span>
            <span className="log__summary">{entry.summary}</span>
            <time className="log__time" dateTime={entry.at}>
              {formatTime(entry.at)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
