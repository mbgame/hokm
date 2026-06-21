import React from 'react';

// Small fixed "back to menu" pill shown over every game scene. Plain DOM,
// rendered outside the Canvas.
const BackButton: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <button
    onClick={onBack}
    style={{
      position: 'fixed',
      top: 'max(14px, env(safe-area-inset-top))',
      left: 14,
      zIndex: 200,
      padding: '9px 16px',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.2)',
      background: 'rgba(12,16,22,0.6)',
      color: '#fff',
      fontWeight: 800,
      letterSpacing: 1,
      fontSize: 14,
      cursor: 'pointer',
      backdropFilter: 'blur(6px)',
      fontFamily: "'Trebuchet MS','Segoe UI',system-ui,sans-serif",
    }}
  >
    ◂ Menu
  </button>
);

export default BackButton;
