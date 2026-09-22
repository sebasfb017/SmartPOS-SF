'use client';
import { useState, useEffect, useRef } from 'react';
import { getProducts, saveProducts } from '@/lib/data';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

const LOW_STOCK_THRESHOLD = 15;
const CRITICAL_STOCK_THRESHOLD = 5;

export default function InventoryClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAlertBanner, setShowAlertBanner] = useState(true);

  // Modal & Toast
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning' | 'danger'>('success');

  // Bulk stock entry modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProduct, setBulkProduct] = useState<any | null>(null);
  const [bulkQty, setBulkQty] = useState('');
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', price: '', stock: '', category: 'Bebidas', business: 'restaurante'
  });

  const triggerToast = (msg: string, type: 'success' | 'warning' | 'danger' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => setProducts(getProducts());

  useEffect(() => {
    loadData();
    window.addEventListener('productsChange', loadData);
    return () => window.removeEventListener('productsChange', loadData);
  }, []);

  const updateProductList = (newProducts: any[]) => {
    setProducts(newProducts);
    saveProducts(newProducts);
    window.dispatchEvent(new Event('productsChange'));
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', stock: '', category: 'Bebidas', business: 'restaurante' });
    setShowModal(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name, price: String(product.price),
      stock: String(product.stock), category: product.category, business: product.business
    });
    setShowModal(true);
  };

  const openBulkModal = (product: any) => {
    setBulkProduct(product);
    setBulkQty('');
    setShowBulkModal(true);
    setTimeout(() => bulkInputRef.current?.focus(), 100);
  };

  const confirmBulkEntry = () => {
    const qty = parseInt(bulkQty);
    if (!bulkProduct || isNaN(qty) || qty <= 0) return;
    const updated = products.map(p =>
      p.id === bulkProduct.id ? { ...p, stock: p.stock + qty } : p
    );
    updateProductList(updated);
    triggerToast(`📦 +${qty} unidades agregadas a "${bulkProduct.name}"`);
    setShowBulkModal(false);
    setBulkProduct(null);
  };

  const confirmDelete = () => {
    if (!deletingProduct) return;
    const updated = products.filter(p => p.id !== deletingProduct.id);
    updateProductList(updated);
    triggerToast(`🗑️ "${deletingProduct.name}" eliminado.`, 'danger');
    setDeletingProduct(null);
  };

  const handleQuickStock = (productId: number, delta: number) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stock + delta);
        return { ...p, stock: newStock };
      }
      return p;
    });
    updateProductList(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const currentProducts = getProducts();
    if (editingId) {
      const updated = currentProducts.map((p: any) =>
        p.id === editingId ? {
          ...p, name: formData.name, price: Number(formData.price),
          stock: Number(formData.stock), category: formData.category, business: formData.business
        } : p
      );
      updateProductList(updated);
      triggerToast(`✅ "${formData.name}" actualizado.`);
    } else {
      const newProduct = {
        id: Date.now(), name: formData.name, price: Number(formData.price),
        stock: Number(formData.stock), category: formData.category, business: formData.business
      };
      updateProductList([...currentProducts, newProduct]);
      triggerToast(`✨ Nuevo producto "${formData.name}" agregado.`);
    }
    setShowModal(false);
    setEditingId(null);
  };

  // KPIs
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockItems = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.stock > 0);
  const criticalStockItems = products.filter(p => p.stock <= CRITICAL_STOCK_THRESHOLD && p.stock > 0);
  const outOfStockItems = products.filter(p => p.stock === 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesBusiness = selectedBusiness === 'all' || p.business === selectedBusiness;
    const matchesStock =
      stockFilter === 'all' ? true :
      stockFilter === 'out' ? p.stock === 0 :
      stockFilter === 'critical' ? p.stock <= CRITICAL_STOCK_THRESHOLD :
      stockFilter === 'low' ? p.stock <= LOW_STOCK_THRESHOLD :
      p.stock > LOW_STOCK_THRESHOLD;
    return matchesSearch && matchesCategory && matchesBusiness && matchesStock;
  });

  const inputStyle = {
    padding: '0.75rem', borderRadius: '10px',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-dark-secondary)',
    color: 'white', width: '100%', fontSize: '0.95rem'
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'var(--danger)';
    if (stock <= CRITICAL_STOCK_THRESHOLD) return '#f97316';
    if (stock <= LOW_STOCK_THRESHOLD) return 'var(--warning)';
    return 'var(--success)';
  };

  const getStockBg = (stock: number) => {
    if (stock === 0) return 'rgba(239, 68, 68, 0.15)';
    if (stock <= CRITICAL_STOCK_THRESHOLD) return 'rgba(249, 115, 22, 0.15)';
    if (stock <= LOW_STOCK_THRESHOLD) return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(16, 185, 129, 0.12)';
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) return '🚫 Sin stock';
    if (stock <= CRITICAL_STOCK_THRESHOLD) return '🔴 Crítico';
    if (stock <= LOW_STOCK_THRESHOLD) return '⚠️ Bajo';
    return '✅ OK';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999999,
          background: toastType === 'danger' ? 'rgba(239,68,68,0.15)' : toastType === 'warning' ? 'rgba(245,158,11,0.15)' : 'var(--bg-dark-secondary)',
          color: 'var(--text-main)',
          border: `1px solid ${toastType === 'danger' ? 'rgba(239,68,68,0.4)' : toastType === 'warning' ? 'rgba(245,158,11,0.4)' : 'var(--border-glass)'}`,
          padding: '1rem 1.5rem', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideInRight 0.3s ease', backdropFilter: 'blur(12px)',
          fontWeight: 600, fontSize: '0.9rem'
        }}>
          {toastMessage}
        </div>
      )}

      {/* ─── STOCK ALERT BANNER ─────────────────────────────────────── */}
      {(outOfStockItems.length > 0 || criticalStockItems.length > 0) && showAlertBanner && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(249,115,22,0.12) 100%)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '16px', padding: '1.25rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fca5a5' }}>
                  Alerta de Inventario — Acción Requerida
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  {outOfStockItems.length > 0 && `${outOfStockItems.length} producto(s) sin stock`}
                  {outOfStockItems.length > 0 && criticalStockItems.length > 0 && ' • '}
                  {criticalStockItems.length > 0 && `${criticalStockItems.length} producto(s) en nivel crítico`}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAlertBanner(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
            >✕</button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[...outOfStockItems, ...criticalStockItems.filter(p => !outOfStockItems.includes(p))].slice(0, 6).map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '0.4rem 0.8rem',
                border: `1px solid ${p.stock === 0 ? 'rgba(239,68,68,0.4)' : 'rgba(249,115,22,0.4)'}`,
                fontSize: '0.82rem', fontWeight: 600
              }}>
                <span style={{ color: p.stock === 0 ? 'var(--danger)' : '#f97316' }}>
                  {p.stock === 0 ? '🚫' : '🔴'}
                </span>
                <span style={{ color: 'white' }}>{p.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>({p.stock} u.)</span>
                <button
                  onClick={() => openBulkModal(p)}
                  style={{
                    background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: '6px', color: 'var(--accent)', cursor: 'pointer', padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem', fontWeight: 700
                  }}
                >
                  + Reponer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay" onClick={() => setDeletingProduct(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)', border: '2px solid var(--danger)',
                color: 'var(--danger)', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.8rem'
              }}>🗑️</div>
            </div>
            <h2 style={{ textAlign: 'center', fontSize: '1.3rem', color: 'white', marginBottom: '0.5rem' }}>
              ¿Eliminar Producto?
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              ¿Seguro que deseas eliminar <strong>"{deletingProduct.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDeletingProduct(null)} style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Stock Entry Modal */}
      {showBulkModal && bulkProduct && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>📦</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>Entrada de Stock</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {bulkProduct.name}
              </p>
            </div>

            <div style={{ background: 'var(--bg-dark-secondary)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Stock actual:</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: getStockColor(bulkProduct.stock) }}>
                {bulkProduct.stock} unidades
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                Cantidad a agregar:
              </label>
              <input
                ref={bulkInputRef}
                type="number"
                min="1"
                value={bulkQty}
                onChange={e => setBulkQty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmBulkEntry()}
                placeholder="Ej. 50"
                style={{ ...inputStyle, fontSize: '1.4rem', textAlign: 'center', fontWeight: 700 }}
              />
              {/* Quick amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                {[10, 20, 50, 100].map(qty => (
                  <button
                    key={qty}
                    onClick={() => setBulkQty(String(qty))}
                    style={{
                      padding: '0.5rem', borderRadius: '8px',
                      border: bulkQty === String(qty) ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
                      background: bulkQty === String(qty) ? 'rgba(99,102,241,0.2)' : 'var(--bg-dark-secondary)',
                      color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                    }}
                  >+{qty}</button>
                ))}
              </div>
            </div>

            {bulkQty && parseInt(bulkQty) > 0 && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Stock final: <strong style={{ color: 'var(--success)' }}>{bulkProduct.stock + parseInt(bulkQty)} unidades</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowBulkModal(false)} style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button
                onClick={confirmBulkEntry}
                disabled={!bulkQty || parseInt(bulkQty) <= 0}
                className="btn-primary"
                style={{ flex: 1, padding: '0.85rem' }}
              >
                ✅ Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.4rem', fontWeight: 700, borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              {editingId ? '✏️ Editar Producto' : '✨ Agregar Nuevo Producto'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Nombre del Producto</label>
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Café Capuchino" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Precio (COP)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Ej. 6000" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Stock Inicial</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} placeholder="Ej. 40" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Categoría</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                    <option value="Bebidas">🥤 Bebidas</option>
                    <option value="Comida">🥪 Comida</option>
                    <option value="Snacks">🍿 Snacks</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Negocio</label>
                  <select value={formData.business} onChange={e => setFormData({ ...formData, business: e.target.value })} style={inputStyle}>
                    <option value="restaurante">🍽️ Restaurante</option>
                    <option value="tienda">🏪 Tienda</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '10px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel stat-card">
          <span className="stat-title">Total Productos</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-value">{totalProducts}</span>
            <span style={{ fontSize: '1.8rem' }}>📦</span>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-title">Valor Inventario</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.4rem' }}>{formatCurrency(totalValue)}</span>
            <span style={{ fontSize: '1.8rem' }}>💰</span>
          </div>
        </div>
        <div
          className="glass-panel stat-card"
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          style={{ cursor: 'pointer', border: lowStockItems.length > 0 ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border-glass)' }}
        >
          <span className="stat-title">Stock Bajo (≤{LOW_STOCK_THRESHOLD})</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-value" style={{ color: lowStockItems.length > 0 ? 'var(--warning)' : 'white' }}>{lowStockItems.length}</span>
            <span style={{ fontSize: '1.8rem' }}>⚠️</span>
          </div>
        </div>
        <div
          className="glass-panel stat-card"
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          style={{ cursor: 'pointer', border: outOfStockItems.length > 0 ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-glass)' }}
        >
          <span className="stat-title">Sin Stock</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-value" style={{ color: outOfStockItems.length > 0 ? 'var(--danger)' : 'white' }}>{outOfStockItems.length}</span>
            <span style={{ fontSize: '1.8rem' }}>🚫</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text" placeholder="🔍 Buscar por nombre..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white', fontSize: '0.9rem' }}
            />
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Stock filter */}
            <div style={{ display: 'flex', background: 'var(--bg-dark-secondary)', borderRadius: '10px', padding: '3px', border: '1px solid var(--border-glass)' }}>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'low', label: '⚠️ Bajo' },
                { key: 'critical', label: '🔴 Crítico' },
                { key: 'out', label: '🚫 Sin stock' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStockFilter(f.key)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none',
                    background: stockFilter === f.key ? 'var(--accent)' : 'transparent',
                    color: stockFilter === f.key ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >{f.label}</button>
              ))}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', background: 'var(--bg-dark-secondary)', borderRadius: '10px', padding: '3px', border: '1px solid var(--border-glass)' }}>
              {['all', 'Bebidas', 'Comida', 'Snacks'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none',
                    background: selectedCategory === cat ? 'var(--accent)' : 'transparent',
                    color: selectedCategory === cat ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s'
                  }}
                >{cat === 'all' ? 'Todas' : cat}</button>
              ))}
            </div>

            {/* View mode */}
            <div style={{ display: 'flex', background: 'var(--bg-dark-secondary)', borderRadius: '10px', padding: '3px', border: '1px solid var(--border-glass)' }}>
              {[{ k: 'table', l: '📋 Tabla' }, { k: 'grid', l: '🎴 Tarjetas' }].map(v => (
                <button
                  key={v.k}
                  onClick={() => setViewMode(v.k as 'table' | 'grid')}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: viewMode === v.k ? 'var(--accent)' : 'transparent', color: viewMode === v.k ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                >{v.l}</button>
              ))}
            </div>

            <button className="btn-primary" onClick={handleOpenNew} style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}>
              + Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      {/* Table / Grid */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔍</div>
            <p style={{ fontSize: '1.1rem' }}>No se encontraron productos con el filtro aplicado.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  {['Producto', 'Categoría', 'Negocio', 'Precio Unit.', 'Stock', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{product.category === 'Bebidas' ? '🥤' : product.category === 'Comida' ? '🥪' : '🍿'}</span>
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'var(--bg-dark-secondary)', padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid var(--border-glass)' }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {product.business === 'restaurante' ? '🍽️ Restaurante' : '🏪 Tienda'}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {formatCurrency(product.price)}
                    </td>
                    {/* Stock adjuster */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleQuickStock(product.id, -1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 700, color: getStockColor(product.stock), background: getStockBg(product.stock), padding: '0.15rem 0.4rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                          {product.stock}
                        </span>
                        <button onClick={() => handleQuickStock(product.id, +1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                        <button onClick={() => openBulkModal(product)} style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass-hover)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} title="Entrada masiva de stock">📦 Entrada</button>
                      </div>
                    </td>
                    {/* Status badge */}
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.3rem 0.7rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, background: getStockBg(product.stock), color: getStockColor(product.stock), border: `1px solid ${getStockColor(product.stock)}40` }}>
                        {getStockLabel(product.stock)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(product)} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>✏️ Editar</button>
                        <button onClick={() => setDeletingProduct(product)} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  border: `1px solid ${getStockColor(product.stock)}30`, transition: 'transform 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>
                      {product.category === 'Bebidas' ? '🥤' : product.category === 'Comida' ? '🥪' : '🍿'}
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, background: getStockBg(product.stock), color: getStockColor(product.stock) }}>
                      {getStockLabel(product.stock)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>{product.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    {product.business === 'restaurante' ? '🍽️ Restaurante' : '🏪 Tienda'} • {product.category}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>
                    {formatCurrency(product.price)}
                  </div>
                </div>
                <div>
                  <div style={{ background: 'var(--bg-dark-secondary)', padding: '0.75rem', borderRadius: '10px', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Stock:</span>
                      <strong style={{ color: getStockColor(product.stock) }}>{product.stock} u.</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => handleQuickStock(product.id, -1)} style={{ flex: 1, padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'white', cursor: 'pointer' }}>-1</button>
                      <button onClick={() => handleQuickStock(product.id, +1)} style={{ flex: 1, padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'white', cursor: 'pointer' }}>+1</button>
                      <button onClick={() => openBulkModal(product)} style={{ flex: 2, padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass-hover)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>📦 Entrada</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenEdit(product)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>✏️ Editar</button>
                    <button onClick={() => setDeletingProduct(product)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>🗑️ Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
