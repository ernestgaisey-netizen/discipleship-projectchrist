import { useState } from 'react';

/**
 * Password input with show/hide toggle.
 * Accepts all standard <input> props — just renders type="text" or "password" depending on state.
 */
export default function PasswordInput({ className = 'dp-input', style, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ width: '100%', paddingRight: 44 }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, color: 'var(--dp-gray)', fontSize: 17, lineHeight: 1,
          display: 'flex', alignItems: 'center',
        }}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  );
}
