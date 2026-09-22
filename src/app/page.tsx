import Link from 'next/link';

export default function Home() {
  return (
    <div className="dashboard">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Bienvenido, aquí tienes un resumen de hoy.</p>
        </div>
        <Link href="/pos" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">+ Nueva Venta</button>
        </Link>
      </header>

      <div className="grid-dashboard">
        {/* Ventas del Día */}
        <div className="stat-card glass-panel">
          <span className="stat-title">Ventas de Hoy</span>
          <span className="stat-value text-accent">$ 4.250.000</span>
          <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>↑ 12%</span> vs ayer
          </div>
        </div>

        {/* Productos Vendidos */}
        <div className="stat-card glass-panel">
          <span className="stat-title">Artículos Vendidos</span>
          <span className="stat-value">142</span>
          <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>↑ 5%</span> vs ayer
          </div>
        </div>

        {/* Alertas de Inventario */}
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="stat-title">Alertas Inventario</span>
          <span className="stat-value">3</span>
          <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Requieren atención
          </div>
        </div>
        
        {/* Empleados Activos */}
        <div className="stat-card glass-panel">
          <span className="stat-title">Turno Actual</span>
          <span className="stat-value">4 <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>empleados</span></span>
          <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Cierre en 4h 30m
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Ventas Recientes</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)', fontWeight: 500 }}>Hora</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)', fontWeight: 500 }}>Cajero</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)', fontWeight: 500 }}>Total</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1rem 0' }}>10:42 AM</td>
                <td style={{ padding: '1rem 0' }}>Carlos M.</td>
                <td style={{ padding: '1rem 0' }}>$ 120.000</td>
                <td style={{ padding: '1rem 0' }}><span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>Pagado</span></td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border-glass)' }}>
                <td style={{ padding: '1rem 0' }}>10:15 AM</td>
                <td style={{ padding: '1rem 0' }}>Ana R.</td>
                <td style={{ padding: '1rem 0' }}>$ 45.500</td>
                <td style={{ padding: '1rem 0' }}><span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>Pagado</span></td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border-glass)' }}>
                <td style={{ padding: '1rem 0' }}>09:30 AM</td>
                <td style={{ padding: '1rem 0' }}>Carlos M.</td>
                <td style={{ padding: '1rem 0' }}>$ 230.000</td>
                <td style={{ padding: '1rem 0' }}><span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>Pagado</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Acciones Rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/inventory" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-dark-secondary)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '1.5rem' }}>📦</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Recibir Mercancía</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actualizar inventario</div>
                </div>
              </div>
            </Link>
            <Link href="/payroll" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-dark-secondary)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '1.5rem' }}>👥</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Cambio de Turno</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registrar entrada/salida</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
