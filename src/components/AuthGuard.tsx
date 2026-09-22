'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PUBLIC_PATHS = ['/login', '/menu', '/invoice'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // null = checking, true = authorized, false = not authorized
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isPublic) {
      setAuthorized(true);
      return;
    }

    const role = localStorage.getItem('role');

    if (!role) {
      // Not logged in → redirect to login
      router.replace('/login');
      return;
    }

    // Cashier restricted to POS only
    if (role === 'CASHIER' && pathname !== '/pos') {
      router.replace('/pos');
      return;
    }

    setAuthorized(true);
  }, [pathname]);

  // Public pages: always render immediately
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return <>{children}</>;

  // Still checking auth
  if (authorized === null) {
    return (
      <div style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        color: 'var(--text-muted)',
        fontSize: '1rem',
      }}>
        <span>Cargando...</span>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
