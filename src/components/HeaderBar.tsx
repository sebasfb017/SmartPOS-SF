'use client';
import { usePathname } from 'next/navigation';
import ThemeSelector from './ThemeSelector';

export default function HeaderBar() {
  const pathname = usePathname();

  // Hide header on public pages like /menu, /invoice, /login
  if (pathname === '/menu' || pathname === '/invoice' || pathname === '/login') return null;

  const getTitle = () => {
    switch (pathname) {
      case '/':
        return '📊 Panel Principal';
      case '/pos':
        return '🛒 Punto de Venta (POS)';
      case '/inventory':
        return '📦 Gestión de Inventario';
      case '/payroll':
        return '👥 Gestión de Nómina';
      case '/audit':
        return '📈 Auditoría y Cierre de Caja';
      default:
        return 'Parador Pro';
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        marginBottom: '1.5rem',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          {getTitle()}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeSelector />
      </div>
    </header>
  );
}
