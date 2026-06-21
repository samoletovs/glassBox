import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, approveAction, fetchState, rejectAction } from './api';
import type { BoardState } from './types';
import { Board } from './components/Board';
import { ApprovalInbox } from './components/ApprovalInbox';
import { ActionLog } from './components/ActionLog';
import { Toast } from './components/Toast';

const POLL_MS = 4000;
// Don't flash a toast for a single hiccup — only surface after this many consecutive failures.
const ERROR_THRESHOLD = 2;

const EMPTY_STATE: BoardState = { items: [], pendingActions: [], log: [] };

export function App() {
  const [state, setState] = useState<BoardState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const failuresRef = useRef(0);

  const handleFailure = useCallback((err: unknown) => {
    failuresRef.current += 1;
    // Ignore a single hiccup (e.g. a token refresh) — wait for it to persist.
    if (failuresRef.current < ERROR_THRESHOLD) return;
    if (err instanceof ApiError && err.status === 401) {
      // Persistent 401 → session expired or signed-in account isn't the owner.
      setAuthError(true);
      setError(null);
      return;
    }
    setError(err instanceof Error ? err.message : 'Something went wrong');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState();
      setState(next);
      setError(null);
      setAuthError(false);
      failuresRef.current = 0;
    } catch (err) {
      handleFailure(err);
    } finally {
      setLoading(false);
    }
  }, [handleFailure]);

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
        handleFailure(err);
      }
    },
    [refresh, handleFailure],
  );

  const onReject = useCallback(
    async (id: string) => {
      try {
        await rejectAction(id);
        await refresh();
      } catch (err) {
        handleFailure(err);
      }
    },
    [refresh, handleFailure],
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
        {authError ? (
          <section className="authbar" role="alert">
            <div className="authbar__text">
              <strong>Not authorized.</strong> Your session expired, or the account you're signed in
              with isn't the owner. Check who you are at{' '}
              <a href="/.auth/me" target="_blank" rel="noopener noreferrer">
                /.auth/me
              </a>
              .
            </div>
            <div className="authbar__actions">
              <a className="btn" href="/.auth/logout">
                Sign out
              </a>
              <a className="btn btn--approve" href="/.auth/login/aad?post_login_redirect_uri=/">
                Sign in as owner
              </a>
            </div>
          </section>
        ) : null}

        <ApprovalInbox
          actions={state.pendingActions}
          items={state.items}
          onApprove={onApprove}
          onReject={onReject}
        />
        <Board items={state.items} loading={loading} />
        <ActionLog entries={state.log} />
      </main>

      {error && !authError ? <Toast message={error} onDismiss={() => setError(null)} /> : null}
    </div>
  );
}
