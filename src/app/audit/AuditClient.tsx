'use client';
import { useState, useEffect } from 'react';
import { getSales, saveSales, getProducts, saveProducts } from '@/lib/data';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
};

export default function AuditClient() {
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voidingSale, setVoidingSale] = useState<any | null>(null);
  const [emailModalSale, setEmailModalSale] = useState<any | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const loadData = () => {
    setSales(getSales());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('salesChange', loadData);
    return () => window.removeEventListener('salesChange', loadData);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendEmail = async (saleToMail: any, targetEmail: string) => {
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      triggerToast('⚠️ Ingrese un correo electrónico válido.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: saleToMail.id,
          customerEmail: targetEmail,
          customerName: saleToMail.customerName,
          customerDoc: saleToMail.customerDoc,
          total: saleToMail.total,
          subtotal: saleToMail.subtotal,
          discountAmount: saleToMail.discountAmount,
          tipAmount: saleToMail.tipAmount,
          items: saleToMail.items,
          paymentMethod: saleToMail.paymentMethod,
          table: saleToMail.table,
          date: saleToMail.date,
          isElectronic: saleToMail.isElectronic,
          cufe: saleToMail.cufe
        })
      });

      const data = await res.json();
      setEmailModalSale(null);

      if (data.success) {
        triggerToast(`📧 ¡Correo enviado exitosamente a ${targetEmail}!`);
      } else if (data.isConfigured === false) {
        triggerToast(`ℹ️ ${data.message}`);
      } else {
        triggerToast(`⚠️ Error al enviar: ${data.error || 'No se pudo conectar al servidor SMTP'}`);
      }
    } catch (err: any) {
      setEmailModalSale(null);
      triggerToast(`⚠️ Error en la conexión: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const activeSales = sales.filter(s => s.status !== 'cancelled');
  const totalRevenue = activeSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = activeSales.length;
  const ticketPromedio = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Breakdown by payment method
  const cashTotal = activeSales.filter(s => !s.paymentMethod || s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0);
  const nequiTotal = activeSales.filter(s => s.paymentMethod === 'nequi').reduce((sum, s) => sum + s.total, 0);
  const cardTotal = activeSales.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0);

  // Group by cashier
  const cashierStats = activeSales.reduce((acc, sale) => {
    if (!acc[sale.cashier]) {
      acc[sale.cashier] = { name: sale.cashier, operations: 0, total: 0 };
    }
    acc[sale.cashier].operations += 1;
    acc[sale.cashier].total += sale.total;
    return acc;
  }, {} as Record<string, { name: string, operations: number, total: number }>);

  const cashierList = Object.values(cashierStats);

  const handleExport = () => {
    triggerToast('📊 Descargando Reporte_Caja_General.xlsx...');
  };

  const confirmCloseBox = () => {
    setShowConfirmModal(false);
    window.open('/invoice', '_blank');
  };

  const confirmVoidSale = () => {
    if (!voidingSale) return;

    // 1. Reestablecer el inventario descontado por esta venta
    const currentProducts = getProducts();
    const updatedProducts = currentProducts.map((p: any) => {
      const itemToRestore = voidingSale.items.find((c: any) => c.product.id === p.id);
      if (itemToRestore) {
        return { ...p, stock: p.stock + itemToRestore.quantity };
      }
      return p;
    });
    saveProducts(updatedProducts);

    // 2. Marcar la venta como anulada
    const currentSales = getSales();
    const updatedSales = currentSales.map((s: any) => 
      s.id === voidingSale.id ? { ...s, status: 'cancelled' } : s
    );
    saveSales(updatedSales);
    setSales(updatedSales);

    // 3. Notificar cambios
    window.dispatchEvent(new Event('productsChange'));
    triggerToast(`❌ Venta #${voidingSale.id.toString().slice(-6)} anulada. Inventario reestablecido.`);
    setVoidingSale(null);
  };

  const filteredSales = sales.filter(s => {
    const q = search.toLowerCase();
    const idMatch = s.id.toString().includes(q);
    const cashierMatch = (s.cashier || '').toLowerCase().includes(q);
    const tableMatch = (s.table || '').toLowerCase().includes(q);
    return idMatch || cashierMatch || tableMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Confirm Void Modal */}
      {voidingSale && (
        <div className="modal-overlay" onClick={() => setVoidingSale(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid var(--danger)',
                color: 'var(--danger)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                ❌
              </div>
            </div>
            <h2 style={{ textAlign: 'center', fontSize: '1.3rem', color: 'white', marginBottom: '0.5rem' }}>
              ¿Anular Venta #VTA-{voidingSale.id.toString().slice(-6)}?
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Se devolverán las existencias al inventario y se ajustará la recaudación del día ({formatCurrency(voidingSale.total)}).
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setVoidingSale(null)}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmVoidSale}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Sí, Anular Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Confirm Close Box Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '2px solid var(--accent)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                📋
              </div>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: '1.4rem', color: 'white', marginBottom: '0.5rem' }}>
              ¿Cerrar Caja del Día?
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Se consolidarán todas las ventas registradas por los cajeros y se generará la factura oficial en PDF.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ 
                  flex: 1, 
                  padding: '0.85rem', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-glass)', 
                  background: 'transparent', 
                  color: 'var(--text-muted)', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmCloseBox}
                className="btn-primary" 
                style={{ flex: 1, padding: '0.85rem' }}
              >
                Generar PDF y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid-dashboard" style={{ marginTop: 0 }}>
        <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--bg-dark-secondary) 100%)' }}>
          <span className="stat-title" style={{ color: 'rgba(255,255,255,0.8)' }}>Ingresos Brutos Hoy</span>
          <span className="stat-value" style={{ color: 'white' }}>{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-title">Ticket Promedio</span>
          <span className="stat-value">{formatCurrency(ticketPromedio)}</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-title">Transacciones Totales</span>
          <span className="stat-value">{totalTransactions}</span>
        </div>
      </div>

      {/* Payment Methods Cash Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-title">💵 Efectivo en Caja (Cajón Físico)</span>
          <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.5rem' }}>{formatCurrency(cashTotal)}</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #a855f7' }}>
          <span className="stat-title">📱 Nequi / Daviplata</span>
          <span className="stat-value" style={{ color: '#a855f7', fontSize: '1.5rem' }}>{formatCurrency(nequiTotal)}</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="stat-title">💳 Tarjetas Débito / Crédito</span>
          <span className="stat-value" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{formatCurrency(cardTotal)}</span>
        </div>
      </div>

      {/* Cashier Summary */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Reporte de Caja - Desglose por Empleado</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
              <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Cajero</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Operaciones</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Total Cobrado</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Estado de Caja</th>
            </tr>
          </thead>
          <tbody>
            {cashierList.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No hay ventas registradas el día de hoy.</td>
              </tr>
            ) : (
              cashierList.map((c: any) => (
                <tr key={c.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '1rem 0' }}>{c.operations}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--success)', fontWeight: 'bold' }}>{formatCurrency(c.total)}</td>
                  <td style={{ padding: '1rem 0' }}><span style={{ color: 'var(--success)' }}>Cuadrada</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction History & Ticket Reprinting / Voiding */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📜 Historial de Ventas del Día</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>Consulta, reimprime o anula cualquier transacción registrada</p>
          </div>
          
          <input
            type="text"
            placeholder="🔍 Buscar por ID, cajero o mesa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-dark-secondary)',
              color: 'white',
              width: '260px',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recibo ID</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hora</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cajero</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mesa</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pago</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estado</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay ventas en el historial.</td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const isCancelled = sale.status === 'cancelled';
                  return (
                    <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: isCancelled ? 0.5 : 1 }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>#VTA-{sale.id.toString().slice(-6)}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(sale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{sale.cashier}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sale.table || 'Para Llevar'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ background: 'var(--bg-dark-secondary)', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {sale.paymentMethod === 'nequi' ? '📱 Nequi' : sale.paymentMethod === 'tarjeta' ? '💳 Tarjeta' : '💵 Efectivo'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: isCancelled ? 'var(--text-muted)' : 'var(--success)' }}>
                        {formatCurrency(sale.total)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {isCancelled ? (
                          <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>❌ Anulada</span>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>✓ Completada</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => window.open(`/invoice?saleId=${sale.id}`, '_blank')}
                            style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                            title="Reimprimir Ticket"
                          >
                            📄 Ticket
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => {
                                setEmailModalSale(sale);
                                setEmailInput(sale.customerEmail || '');
                              }}
                              style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--accent)', background: 'rgba(99, 102, 241, 0.15)', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                              title="Enviar por Correo"
                            >
                              📧 Correo
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              onClick={() => setVoidingSale(sale)}
                              style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                              title="Anular esta Venta"
                            >
                              ❌ Anular
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Invoice Modal */}
      {emailModalSale && (
        <div className="modal-overlay" onClick={() => setEmailModalSale(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '2px solid var(--accent)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                📧
              </div>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
              Enviar Factura por Correo
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Factura #VTA-{emailModalSale.id.toString().slice(-6)} • Total: <strong style={{ color: 'var(--success)' }}>{formatCurrency(emailModalSale.total)}</strong>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendEmail(emailModalSale, emailInput);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Correo Electrónico del Cliente *
                </label>
                <input
                  type="email"
                  required
                  disabled={isSendingEmail}
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="ejemplo@cliente.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--accent)',
                    background: 'var(--bg-dark-secondary)',
                    color: 'white',
                    fontSize: '0.95rem'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => setEmailModalSale(null)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    background: 'transparent',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '0.75rem' }}
                >
                  {isSendingEmail ? '⏳ Enviando...' : '🚀 Enviar Comprobante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button onClick={handleExport} className="glass-panel" style={{ padding: '1rem 2rem', color: 'var(--text-main)', border: '1px solid var(--border-glass)', background: 'transparent', cursor: 'pointer' }}>
          Exportar a Excel
        </button>
        <button onClick={() => setShowConfirmModal(true)} disabled={activeSales.length === 0} className="btn-primary" style={{ padding: '1rem 2rem' }}>
          Generar Factura y Cerrar Caja
        </button>
      </div>
    </div>
  );
}


