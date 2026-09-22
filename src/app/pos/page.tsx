import PosClient from './PosClient';

export default function POS() {
  return (
    <div className="dashboard">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Punto de Venta</h1>
      </header>
      <PosClient />
    </div>
  );
}
