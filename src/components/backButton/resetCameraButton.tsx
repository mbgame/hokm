import React from 'react';

// Recenter the orbit camera to the scene's default view. Plain DOM, sits under
// the back button.
const ResetCameraButton: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <button
    onClick={onReset}
    title="Reset view"
    style={{
      position: 'fixed',
      top: 'calc(max(14px, env(safe-area-inset-top)) + 46px)',
      left: 14,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '9px 14px',
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
    ⟳ View
  </button>
);

export default ResetCameraButton;
