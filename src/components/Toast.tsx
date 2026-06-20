import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

// Error toast — never alert()/confirm() per the React conventions.
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="toast" role="alert" aria-live="assertive">
      <span className="toast__msg">{message}</span>
      <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss error">
        ×
      </button>
    </div>
  );
}
