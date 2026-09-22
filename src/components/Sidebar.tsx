'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import './Sidebar.css';

import ThemeSelector from './ThemeSelector';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<string>('all');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const sessionStart = useRef<number>(Date.now());

  useEffect(() => {
    const isPublicPage = pathname === '/login' || pathname === '/menu' || pathname === '/invoice';
    const storedRole = localStorage.getItem('role');

    if (!storedRole && !isPublicPage) {
      router.replace('/login');
      return;
    }
    setRole(storedRole || 'PUBLIC');
    setUsername(localStorage.getItem('username') || 'Invitado');
    setActiveBusiness(localStorage.getItem('business') || 'all');

    // Read stored session start or set new one
    const stored = localStorage.getItem('sessionStart');
    if (stored) {
      sessionStart.current = parseInt(stored);
    } else {
      const now = Date.now();
      sessionStart.current = now;
      localStorage.setItem('sessionStart', String(now));
    }
  }, [pathname]);

  // Session timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setActiveBusiness(val);
    localStorage.setItem('business', val);
    window.dispatchEvent(new Event('businessChange'));
  };

  const doLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('sessionStart');
    router.replace('/login');
  };

  // Hide sidebar on public / login pages
  if (pathname === '/menu' || pathname === '/invoice' || pathname === '/login') return null;
  if (!role || role === 'PUBLIC') return null;

  const isAdmin = role === 'ADMIN';

  const links = isAdmin
    ? [
        { name: 'Dashboard',      href: '/',          icon: '📊' },
        { name: 'Punto de Venta', href: '/pos',        icon: '🛒' },
        { name: 'Inventario',     href: '/inventory',  icon: '📦' },
        { name: 'Nómina',         href: '/payroll',    icon: '👥' },
        { name: 'Auditoría',      href: '/audit',      icon: '📈' },
      ]
    : [
        { name: 'Punto de Venta', href: '/pos', icon: '🛒' },
      ];

  return (
    <>
      {/* ─── Logout Confirmation Modal ─────────────────────────────── */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: 'rgba(8,12,22,0.75)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--modal-bg)', border: '1px solid var(--border-glass)',
              borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '380px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
              animation: 'modalScale 0.3s cubic-bezier(0.16,1,0.3,1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
            }}
          >
            <div style={{ fontSize: '3rem' }}>🚪</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: 0 }}>
              ¿Cerrar Sesión?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', margin: 0 }}>
              Estás a punto de salir. Tu sesión ha durado{' '}
              <strong style={{ color: 'var(--text-main)' }}>{formatDuration(sessionSeconds)}</strong>.
            </p>

            {/* Session info chip */}
            <div style={{
              background: 'var(--bg-dark-secondary)', borderRadius: '10px', padding: '0.6rem 1.2rem',
              display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0'
            }}>
              <span>👤 {username}</span>
              <span>🔑 {isAdmin ? 'Admin' : 'Cajero'}</span>
              <span>⏱ {formatDuration(sessionSeconds)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: '12px',
                  border: '1px solid var(--border-glass)', background: 'transparent',
                  color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={doLogout}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
                }}
              >
                🚪 Salir
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2>Parador <span className="text-accent">Pro</span></h2>
        </div>

        <div className="business-selector">
          <label>Negocio Activo</label>
          <select className="glass-select" value={activeBusiness} onChange={handleBusinessChange}>
            <option value="all">Todos los Negocios</option>
            <option value="restaurante">Restaurante Principal</option>
            <option value="tienda">Tienda de Conveniencia</option>
          </select>

          <label style={{ marginTop: '0.75rem' }}>Tema Visual</label>
          <ThemeSelector fullWidth />
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Public menu link */}
        <div style={{ padding: '0.5rem 0.75rem', marginTop: '0.25rem' }}>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none',
              padding: '0.5rem 0.75rem', borderRadius: '8px',
              border: '1px dashed var(--border-glass)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
          >
            <span>🌐</span> Ver Menú Público
          </a>
        </div>

        <div className="sidebar-footer">
          {/* Session timer chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-dark-secondary)', borderRadius: '10px', padding: '0.5rem 0.75rem',
            marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)'
          }}>
            <span>⏱</span>
            <span>Sesión activa: <strong style={{ color: 'var(--text-main)' }}>{formatDuration(sessionSeconds)}</strong></span>
          </div>

          <div className="user-info">
            <div className="avatar">
              {isAdmin ? 'AD' : username?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'CJ'}
            </div>
            <div className="details">
              <span className="name">{isAdmin ? 'Admin User' : username}</span>
              <span className="role">{isAdmin ? 'Administrador' : 'Punto de Venta'}</span>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem',
              padding: '0.6rem 0.75rem', borderRadius: '10px', transition: 'all 0.2s',
              border: '1px solid transparent', background: 'transparent',
              cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 500
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
