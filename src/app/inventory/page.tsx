import InventoryClient from './InventoryClient';

export default function Inventory() {
  return (
    <div className="dashboard">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Inventario</h1>
        <p style={{ color: 'var(--text-muted)' }}>Administra los productos y existencias de este negocio.</p>
      </header>
      <InventoryClient />
    </div>
  );
}
