import type { ActionType, Item, ProposedAction } from '../types';

interface ApprovalInboxProps {
  actions: ProposedAction[];
  items: Item[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ACTION_LABEL: Record<ActionType, string> = {
  publish: 'Publish to ss.lv',
  priceDrop: 'Drop the price',
  sendReply: 'Send reply to buyer',
};

function describePayload(type: ActionType, payload: Record<string, unknown>): string {
  switch (type) {
    case 'publish':
      return typeof payload.target === 'string' ? `Target: ${payload.target}` : 'Target: ss.lv';
    case 'priceDrop':
      return `From €${String(payload.from ?? '?')} to €${String(payload.to ?? '?')}`;
    case 'sendReply':
      return typeof payload.body === 'string'
        ? `“${payload.body.slice(0, 120)}”`
        : 'Drafted reply';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function ApprovalInbox({ actions, items, onApprove, onReject }: ApprovalInboxProps) {
  if (actions.length === 0) {
    return null;
  }

  const titleFor = (itemId: string) => items.find((it) => it.id === itemId)?.title ?? itemId;

  return (
    <section className="inbox" aria-label="Approval inbox" data-testid="approval-inbox">
      <h2 className="inbox__title">
        Needs your approval
        <span className="inbox__count" aria-label={`${actions.length} pending`}>
          {actions.length}
        </span>
      </h2>
      <ul className="inbox__list" role="list">
        {actions.map((action) => (
          <li key={action.id} className="inbox__item" data-testid={`action-${action.id}`}>
            <div className="inbox__info">
              <span className="inbox__action">{ACTION_LABEL[action.type]}</span>
              <span className="inbox__subject">{titleFor(action.itemId)}</span>
              <span className="inbox__detail">{describePayload(action.type, action.payload)}</span>
            </div>
            <div className="inbox__buttons">
              <button
                type="button"
                className="btn btn--approve"
                onClick={() => onApprove(action.id)}
                aria-label={`Approve: ${ACTION_LABEL[action.type]} for ${titleFor(action.itemId)}`}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn--reject"
                onClick={() => onReject(action.id)}
                aria-label={`Reject: ${ACTION_LABEL[action.type]} for ${titleFor(action.itemId)}`}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
