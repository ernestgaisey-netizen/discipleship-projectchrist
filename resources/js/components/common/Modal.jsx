import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 520 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="dp-modal dp-fade-in" style={{ maxWidth }}>
        {title && (
          <div className="dp-modal__header">
            <h3 className="dp-modal__title">{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--dp-gray)', lineHeight: 1 }}>×</button>
          </div>
        )}
        <div className="dp-modal__body">{children}</div>
        {footer && <div className="dp-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
