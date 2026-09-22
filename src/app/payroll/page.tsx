import PayrollClient from './PayrollClient';

export default function Payroll() {
  return (
    <div className="dashboard">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nómina y Turnos</h1>
        <p style={{ color: 'var(--text-muted)' }}>Control de asistencia y registro de personal.</p>
      </header>
      <PayrollClient />
    </div>
  );
}
