import { useCallback, useEffect, useState } from 'react';
import { approveAction, fetchState, rejectAction } from './api';
import type { BoardState } from './types';
import { Board } from './components/Board';
import { ApprovalInbox } from './components/ApprovalInbox';
import { ActionLog } from './components/ActionLog';
import { Toast } from './components/Toast';

const POLL_MS = 4000;

const EMPTY_STATE: BoardState = { items: [], pendingActions: [], log: [] };

export function App() {
  const [state, setState] = useState<BoardState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState();
      setState(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const onApprove = useCallback(
    async (id: string) => {
      try {
        await approveAction(id);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approve failed');
      }
    },
    [refresh],
  );

  const onReject = useCallback(
    async (id: string) => {
      try {
        await rejectAction(id);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Reject failed');
      }
    },
    [refresh],
  );

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <div className="app__brand-text">
            <h1 className="app__title">
              glass<span className="app__title-accent">Box</span>
            </h1>
            <p className="app__subtitle">
              ss.lv seller cockpit — your agent fills the board, you approve every irreversible step.
            </p>
          </div>
          <span className="app__byo" aria-label="This app ships no embedded AI">
            <span className="app__byo-dot" aria-hidden="true" />
            BYO-tokens · no embedded LLM
          </span>
        </div>

        <dl className="stats" aria-label="Board summary">
          <div className="stat">
            <dt>Items</dt>
            <dd>{state.items.length}</dd>
          </div>
          <div className="stat">
            <dt>Listed</dt>
            <dd>{state.items.filter((it) => it.status === 'listed').length}</dd>
          </div>
          <div className="stat">
            <dt>Sold</dt>
            <dd>{state.items.filter((it) => it.status === 'sold').length}</dd>
          </div>
          <div className={`stat${state.pendingActions.length > 0 ? ' stat--alert' : ''}`}>
            <dt>Awaiting you</dt>
            <dd>{state.pendingActions.length}</dd>
          </div>
        </dl>
      </header>

      <main className="app__main" aria-busy={loading}>
        <ApprovalInbox
          actions={state.pendingActions}
          items={state.items}
          onApprove={onApprove}
          onReject={onReject}
        />
        <Board items={state.items} loading={loading} />
        <ActionLog entries={state.log} />
      </main>

      {error ? <Toast message={error} onDismiss={() => setError(null)} /> : null}
    </div>
  );
}
