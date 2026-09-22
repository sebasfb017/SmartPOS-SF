'use client';
import { useEffect, useState } from 'react';

export type ThemeOption = 'dark' | 'light' | 'emerald' | 'gold';

const THEMES: { id: ThemeOption; label: string; icon: string; bg: string; color: string }[] = [
  { id: 'dark', label: 'Noche Neón', icon: '🌌', bg: '#0b0f19', color: '#6366f1' },
  { id: 'light', label: 'Modo Claro', icon: '☀️', bg: '#ffffff', color: '#2563eb' },
  { id: 'emerald', label: 'Verde Esmeralda', icon: '🌿', bg: '#062016', color: '#10b981' },
  { id: 'gold', label: 'Oro & Neón', icon: '👑', bg: '#1a1600', color: '#f59e0b' },
];

export default function ThemeSelector({ fullWidth = false }: { fullWidth?: boolean }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>('dark');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('app-theme') as ThemeOption) || 'dark';
    setCurrentTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const changeTheme = (theme: ThemeOption) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
    setIsOpen(false);
  };

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          width: fullWidth ? '100%' : 'auto',
          padding: '0.6rem 0.85rem',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>{activeThemeObj.icon}</span>
          <span>{activeThemeObj.label}</span>
        </div>
        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              bottom: fullWidth ? 'calc(100% + 8px)' : 'auto',
              top: fullWidth ? 'auto' : 'calc(100% + 8px)',
              left: 0,
              right: 0,
              zIndex: 10000,
              minWidth: '180px',
              background: 'var(--bg-dark-secondary, #131b2f)',
              border: '1px solid var(--border-glass)',
              borderRadius: '14px',
              padding: '0.4rem',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                padding: '0.4rem 0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              🎨 Tema Visual
            </div>
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => changeTheme(theme.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.8rem',
                    border: 'none',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-glass-hover)';
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{theme.icon}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span>{theme.label}</span>
                  </div>
                  {isSelected && <span style={{ fontSize: '0.85rem' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
