import AuditClient from './AuditClient';

export default function Audit() {
  return (
    <div className="dashboard">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Auditoría y Cierre</h1>
        <p style={{ color: 'var(--text-muted)' }}>Reporte diario de ventas y cuadre de caja.</p>
      </header>
      <AuditClient />
    </div>
  );
}
