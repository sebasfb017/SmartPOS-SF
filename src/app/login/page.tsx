'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const DEFAULT_EMPLOYEES = [
  { name: 'Carlos Mendoza', cedula: '1098765432' },
  { name: 'Ana Ramírez', cedula: '1023456789' },
  { name: 'Luis Pérez', cedula: '1122334455' },
];

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const doLogin = (user: string, pass: string) => {
    const u = (user || '').trim().toLowerCase();
    const p = (pass || '').trim();

    if (!u || !p) {
      setError('Por favor ingrese usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    // ── ADMIN ──────────────────────────────────────────────────
    if (u === ADMIN_USER) {
      if (p !== ADMIN_PASS) {
        setError('Contraseña incorrecta para Administrador.');
        setLoading(false);
        return;
      }
      localStorage.setItem('role', 'ADMIN');
      localStorage.setItem('username', 'Admin User');
      router.push('/');
      return;
    }

    // ── CASHIER ────────────────────────────────────────────────
    const stored = localStorage.getItem('employees');
    const employees: { name: string; cedula: string }[] = stored
      ? JSON.parse(stored)
      : DEFAULT_EMPLOYEES;

    const employee = employees.find(
      (emp) => emp.cedula === u || emp.cedula === (user || '').trim()
    );

    if (!employee) {
      setError('El número de cédula no se encuentra registrado.');
      setLoading(false);
      return;
    }

    const expectedPass = employee.cedula + '*';
    if (p !== expectedPass) {
      setError('Contraseña incorrecta. La contraseña es su cédula seguida de *');
      setLoading(false);
      return;
    }

    localStorage.setItem('role', 'CASHIER');
    localStorage.setItem('username', employee.name);
    router.push('/pos');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = userRef.current?.value ?? '';
    const p = passRef.current?.value ?? '';
    doLogin(u, p);
  };

  const quickLogin = (user: string, pass: string) => {
    if (userRef.current) userRef.current.value = user;
    if (passRef.current) passRef.current.value = pass;
    doLogin(user, pass);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-dark)',
      position: 'fixed',
      top: 0, left: 0, zIndex: 100000
    }}>
      <div
        className="glass-panel"
        style={{
          width: '420px',
          maxWidth: '95vw',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
      >
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem', color: 'white' }}>
          Parador <span style={{ color: 'var(--accent)' }}>Pro</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          Ingresa a tu cuenta para continuar
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Usuario o Cédula
            </label>
            <input
              ref={userRef}
              name="username"
              type="text"
              autoComplete="username"
              defaultValue=""
              placeholder="Ej. admin o 1098765432"
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '10px',
                border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)',
                color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Contraseña
            </label>
            <input
              ref={passRef}
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue=""
              placeholder="••••••••"
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '10px',
                border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)',
                color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Ingresando...' : '🔑 Iniciar Sesión'}
          </button>

          {error && (
            <div style={{
              color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem',
              borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600
            }}>
              {error}
            </div>
          )}
        </form>

        {/* Quick Demo Login Buttons */}
        <div style={{ marginTop: '1.75rem', width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <div style={{
            fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
            marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            Acceso Rápido de Prueba
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => quickLogin('admin', 'admin123')}
              style={{
                padding: '0.6rem', borderRadius: '8px',
                border: '1px solid var(--accent)', background: 'rgba(99, 102, 241, 0.15)',
                color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              👑 Mod. Admin
            </button>
            <button
              type="button"
              onClick={() => quickLogin('1098765432', '1098765432*')}
              style={{
                padding: '0.6rem', borderRadius: '8px',
                border: '1px solid var(--border-glass)', background: 'var(--bg-glass-hover)',
                color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🛒 Mod. Cajero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
