import { useEffect } from 'react';

export default function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'on-time': ['On Time', 'green'],
    'due-soon': ['Due Soon', 'orange'],
    overdue: ['Overdue', 'red'],
    returned: ['Returned', 'gray'],
  };
  const [text, cls] = map[status] || [status, 'gray'];
  return <span className={`badge ${cls}`}>{text}</span>;
}
