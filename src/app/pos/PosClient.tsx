'use client';
import { useState, useEffect } from 'react';
import { getProducts, saveProducts, getSales, saveSales } from '@/lib/data';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
};

export default function PosClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [activeBusiness, setActiveBusiness] = useState('all');
  const [popId, setPopId] = useState<number | null>(null);

  // Table, Discount & Tip states
  const [table, setTable] = useState('Para Llevar');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [tipEnabled, setTipEnabled] = useState(false);

  // Payment Modal & Change Calculator states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi' | 'tarjeta'>('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  // DIAN Electronic Invoice states
  const [isElectronic, setIsElectronic] = useState(false);
  const [customerDoc, setCustomerDoc] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Floating Confirmation Modal & Toast States
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [emailModalSale, setEmailModalSale] = useState<any | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const loadData = () => {
    setProducts(getProducts());
    setActiveBusiness(localStorage.getItem('business') || 'all');
  };

  useEffect(() => {
    loadData();
    window.addEventListener('businessChange', loadData);
    window.addEventListener('productsChange', loadData);
    return () => {
      window.removeEventListener('businessChange', loadData);
      window.removeEventListener('productsChange', loadData);
    };
  }, []);

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      triggerToast('⚠️ ¡Producto agotado en el inventario!');
      return;
    }

    setPopId(product.id);
    setTimeout(() => setPopId(null), 300);

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          triggerToast('⚠️ No hay suficiente stock disponible.');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tipAmount = tipEnabled ? Math.round(subtotalAfterDiscount * 0.1) : 0;
  const finalTotal = subtotalAfterDiscount + tipAmount;

  const cashVal = Number(cashReceived) || 0;
  const changeGiven = paymentMethod === 'efectivo' ? Math.max(0, cashVal - finalTotal) : 0;

  // Tax breakdown (INC 8% for prepared food, IVA 19% for store goods)
  const incAmount = Math.round(subtotalAfterDiscount * 0.08 / 1.08);
  const ivaAmount = Math.round(subtotalAfterDiscount * 0.19 / 1.19);
  const taxableBase = Math.max(0, subtotalAfterDiscount - incAmount - ivaAmount);

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) return;
    setCashReceived(String(finalTotal)); // Pre-fill with exact amount
    setTransactionRef('');
    setPaymentModalOpen(true);
  };

  const handleFinalizeSale = () => {
    if (paymentMethod === 'efectivo' && cashVal < finalTotal) {
      triggerToast('⚠️ El efectivo recibido es menor al total a pagar.');
      return;
    }

    if (isElectronic && (!customerDoc.trim() || !customerName.trim())) {
      triggerToast('⚠️ Por favor ingrese el NIT/Cédula y Nombre para la Factura Electrónica.');
      return;
    }

    // 1. Descontar del inventario
    const currentProducts = getProducts();
    const updatedProducts = currentProducts.map((p: any) => {
      const cartItem = cart.find(c => c.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });
    saveProducts(updatedProducts);
    setProducts(updatedProducts);

    // 2. Generar CUFE si es electrónica
    const cufe = isElectronic 
      ? `fe${Date.now()}dian${Math.random().toString(36).substr(2, 12)}paradorpro9008765431`
      : '';

    // 3. Registrar la venta
    const currentSales = getSales();
    const cashierName = localStorage.getItem('username') || 'Desconocido';
    const newSale = {
      id: Date.now(),
      cashier: cashierName,
      items: [...cart],
      subtotal,
      discountPercent,
      discountAmount,
      tipAmount,
      total: finalTotal,
      paymentMethod,
      cashReceived: paymentMethod === 'efectivo' ? cashVal : finalTotal,
      changeGiven,
      transactionRef: paymentMethod === 'nequi' ? transactionRef : '',
      table,
      business: activeBusiness === 'restaurant' ? 'Restaurante' : activeBusiness === 'store' ? 'Tienda' : 'General',
      status: 'completed',
      date: new Date().toISOString(),
      
      // DIAN Electronic Invoice Data
      isElectronic,
      customerDoc: isElectronic ? customerDoc : '',
      customerName: isElectronic ? customerName : '',
      customerEmail: isElectronic ? customerEmail : '',
      taxableBase,
      incAmount,
      ivaAmount,
      cufe
    };
    saveSales([...currentSales, newSale]);

    // Abrir ventana flotante con los detalles de la venta
    setPaymentModalOpen(false);
    setCompletedSale(newSale);

    // Limpiar formulario y carrito
    setCart([]);
    setDiscountPercent(0);
    setTipEnabled(false);
    setTable('Para Llevar');
    setIsElectronic(false);
    setCustomerDoc('');
    setCustomerName('');
    setCustomerEmail('');
  };

  const handleCancelSale = (restoreToCart: boolean = true) => {
    if (!completedSale) return;

    // 1. Reestablecer el inventario descontado
    const currentProducts = getProducts();
    const updatedProducts = currentProducts.map((p: any) => {
      const itemToRestore = completedSale.items.find((c: any) => c.product.id === p.id);
      if (itemToRestore) {
        return { ...p, stock: p.stock + itemToRestore.quantity };
      }
      return p;
    });
    saveProducts(updatedProducts);
    setProducts(updatedProducts);

    // 2. Eliminar la venta del historial
    const currentSales = getSales();
    const updatedSales = currentSales.filter((s: any) => s.id !== completedSale.id);
    saveSales(updatedSales);

    window.dispatchEvent(new Event('productsChange'));

    if (restoreToCart) {
      setCart(completedSale.items);
      setDiscountPercent(completedSale.discountPercent || 0);
      setTipEnabled(Boolean(completedSale.tipAmount));
      setTable(completedSale.table || 'Para Llevar');
      triggerToast(`🔄 Venta #${completedSale.id.toString().slice(-6)} anulada. Inventario devuelto y productos colocados en carrito.`);
    } else {
      triggerToast(`❌ Venta #${completedSale.id.toString().slice(-6)} anulada e inventario reestablecido.`);
    }

    setCompletedSale(null);
  };

  const displayedProducts = products.filter(p => {
    if (activeBusiness !== 'all' && p.business !== activeBusiness) return false;
    if (filter !== 'Todos' && p.category !== filter) return false;
    return true;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', height: 'calc(100vh - 8rem)', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Payment Selection & Calculator Modal */}
      {paymentModalOpen && (
        <div className="modal-overlay" onClick={() => setPaymentModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.4rem', color: 'white', marginBottom: '0.25rem' }}>
              💳 Procesar Pago de Venta
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Mesa / Destino: <strong style={{ color: 'var(--accent)' }}>{table}</strong> • Total a Cobrar: <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>{formatCurrency(finalTotal)}</strong>
            </p>

            {/* Payment Method Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[
                { key: 'efectivo', label: '💵 Efectivo', icon: '💵' },
                { key: 'nequi', label: '📱 Nequi / Davi', icon: '📱' },
                { key: 'tarjeta', label: '💳 Tarjeta', icon: '💳' }
              ].map(method => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method.key as any);
                    if (method.key === 'efectivo') setCashReceived(String(finalTotal));
                  }}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '12px',
                    border: paymentMethod === method.key ? '2px solid var(--accent)' : '1px solid var(--border-glass)',
                    background: paymentMethod === method.key ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-dark-secondary)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {/* EFECTIVO CALCULATOR */}
            {paymentMethod === 'efectivo' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Efectivo Recibido (COP)
                </label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="Ej. 50000"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--accent)',
                    background: 'var(--bg-dark-secondary)',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    marginBottom: '0.75rem'
                  }}
                />

                {/* Quick Bills Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {[finalTotal, 10000, 20000, 50000, 100000].map((bill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashReceived(String(bill))}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'var(--bg-glass-hover)',
                        color: 'white',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {bill === finalTotal ? 'Exacto' : `$ ${bill.toLocaleString('es-CO')}`}
                    </button>
                  ))}
                </div>

                {/* Change Result Display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-glass)' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Cambio / Devuelta:</span>
                  <span style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 700, 
                    color: cashVal >= finalTotal ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    {cashVal >= finalTotal ? formatCurrency(changeGiven) : 'Falta dinero'}
                  </span>
                </div>
              </div>
            )}

            {/* NEQUI / DAVIPLATA */}
            {paymentMethod === 'nequi' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Nº de Comprobante / Transacción Nequi / Daviplata
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="Ej. NQ-98472301"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--bg-dark-secondary)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
            )}

            {/* TARJETA */}
            {paymentMethod === 'tarjeta' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-glass)', marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Pase la tarjeta por el datáfono. Una vez aprobado el pago, haga clic en Confirmar.
                </p>
              </div>
            )}

            {/* DIAN Electronic Invoice Toggle & Inputs */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setIsElectronic(!isElectronic)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  <span>🧾 Factura Electrónica DIAN</span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--accent)', padding: '0.1rem 0.5rem', borderRadius: '10px', color: 'white' }}>DIAN</span>
                </div>
                <input
                  type="checkbox"
                  checked={isElectronic}
                  onChange={e => setIsElectronic(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {isElectronic && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-glass)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>NIT / Cédula *</label>
                      <input
                        type="text"
                        required
                        value={customerDoc}
                        onChange={e => setCustomerDoc(e.target.value)}
                        placeholder="Ej. 901.234.567-8"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nombre / Razón Social *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Ej. Transportes Sol S.A.S."
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Correo Electrónico de Envío</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="Ej. facturacion@empresa.com"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark-secondary)', color: 'white', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFinalizeSale}
                className="btn-primary"
                style={{ flex: 1.5, padding: '0.85rem', fontSize: '1rem' }}
                disabled={paymentMethod === 'efectivo' && cashVal < finalTotal}
              >
                ✓ Confirmar Pago ({formatCurrency(finalTotal)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sale Confirmation Modal */}
      {completedSale && (
        <div className="modal-overlay" onClick={() => setCompletedSale(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid var(--success)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
              }}>
                ✓
              </div>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
              ¡Venta Registrada Exitosamente!
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              La transacción ha sido procesada e inventario actualizado.
            </p>

            {/* Details Box */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Comprobante: <strong style={{ color: 'var(--text-main)' }}>#VTA-{completedSale.id.toString().slice(-6)}</strong></span>
                <span>{new Date(completedSale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                <span>Cajero: <strong style={{ color: 'var(--text-main)' }}>{completedSale.cashier}</strong></span>
                <span>Destino: <strong style={{ color: 'var(--accent)' }}>{completedSale.table || 'Para Llevar'}</strong></span>
              </div>

              {/* Itemized summary */}
              <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {completedSale.items.map((item: any) => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{item.product.name} <span style={{ color: 'var(--text-muted)' }}>(x{item.quantity})</span></span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                {completedSale.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
                    <span>Descuento ({completedSale.discountPercent}%):</span>
                    <span>-{formatCurrency(completedSale.discountAmount)}</span>
                  </div>
                )}
                {completedSale.tipAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                    <span>Propina Sugerida (10%):</span>
                    <span>+{formatCurrency(completedSale.tipAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, paddingTop: '0.4rem', borderTop: '1px solid var(--border-glass)', marginTop: '0.2rem' }}>
                  <span>Total Cobrado:</span>
                  <span style={{ color: 'var(--success)' }}>{formatCurrency(completedSale.total)}</span>
                </div>

                {/* Payment Detail */}
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-dark-secondary)', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Medio de Pago: <strong style={{ textTransform: 'capitalize' }}>{completedSale.paymentMethod}</strong></span>
                  {completedSale.paymentMethod === 'efectivo' ? (
                    <span>Cambio: <strong style={{ color: 'var(--success)' }}>{formatCurrency(completedSale.changeGiven)}</strong></span>
                  ) : (
                    <span>Ref: <strong>{completedSale.transactionRef || 'OK'}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button 
                  onClick={() => window.open(`/invoice?saleId=${completedSale.id}`, '_blank')}
                  style={{ 
                    padding: '0.85rem', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-glass)', 
                    background: 'var(--bg-glass-hover)', 
                    color: 'white', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    fontSize: '0.85rem'
                  }}
                >
                  📄 Ticket PDF
                </button>

                <button 
                  onClick={() => {
                    setEmailModalSale(completedSale);
                    setEmailInput(completedSale.customerEmail || '');
                  }}
                  style={{ 
                    padding: '0.85rem', 
                    borderRadius: '10px', 
                    border: '1px solid var(--accent)', 
                    background: 'rgba(99, 102, 241, 0.15)', 
                    color: 'white', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    fontSize: '0.85rem'
                  }}
                >
                  📧 Enviar por Correo
                </button>
              </div>

              <button 
                onClick={() => setCompletedSale(null)} 
                className="btn-primary" 
                style={{ width: '100%', padding: '0.85rem' }}
              >
                ✓ Nueva Venta
              </button>

              <button 
                onClick={() => handleCancelSale(true)} 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: 'var(--danger)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              >
                ✏️ Anular Venta y Modificar Carrito
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* QR Code Modal for Customer Digital Menu */}
      {qrModalOpen && (
        <div className="modal-overlay" onClick={() => setQrModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '420px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
              Menú Digital QR para Clientes
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Los clientes en las mesas pueden escanear este código con su celular para ver la carta y existencias en tiempo real.
            </p>

            {/* QR Code Image */}
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '20px', display: 'inline-block', marginBottom: '1.25rem', boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)' }}>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http://localhost:3000/menu" 
                alt="QR Menú Digital"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '1.25rem' }}>
              🌐 http://localhost:3000/menu
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => window.open('/menu', '_blank')}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass-hover)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                👁️ Probar Carta Digital
              </button>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['Todos', 'Bebidas', 'Comida', 'Snacks'].map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: filter === cat ? 'var(--accent)' : 'var(--bg-glass)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menú QR Button */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="glass-panel"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--accent)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            📱 Menú QR Mesas
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem', overflowY: 'auto', paddingRight: '1rem' }}>
          {displayedProducts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>No hay productos en esta categoría o negocio.</div>
          ) : (
            displayedProducts.map(product => (
              <div 
                key={product.id} 
                className={`glass-panel ${popId === product.id ? 'animate-pop' : ''}`}
                onClick={() => addToCart(product)}
                style={{ 
                  padding: '1.5rem', 
                  cursor: product.stock > 0 ? 'pointer' : 'not-allowed', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  transition: 'transform 0.1s, box-shadow 0.2s',
                  textAlign: 'center',
                  opacity: product.stock > 0 ? 1 : 0.5
                }}
                onMouseOver={(e) => { 
                  if (product.stock > 0) {
                    e.currentTarget.style.transform = 'translateY(-3px)'; 
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)'; 
                  }
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.transform = 'translateY(0)'; 
                  e.currentTarget.style.boxShadow = 'none'; 
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                  {product.category === 'Bebidas' ? '🥤' : product.category === 'Comida' ? '🥪' : '🍿'}
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.2rem' }}>{formatCurrency(product.price)}</div>
                <div style={{ fontSize: '0.8rem', color: product.stock <= 5 ? 'var(--danger)' : 'var(--text-muted)', marginTop: '0.5rem', fontWeight: product.stock <= 5 ? 700 : 400 }}>
                  Stock: {product.stock}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', height: '100%', overflowY: 'auto' }}>
        
        {/* Table / Order Destination Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
            🍽️ ASIGNAR MESA / DESTINO
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {['Para Llevar', 'Mesa 1', 'Mesa 2', 'Mesa 3', 'Barra 1', 'Barra 2'].map(t => (
              <button
                key={t}
                onClick={() => setTable(t)}
                style={{
                  padding: '0.4rem 0.2rem',
                  borderRadius: '6px',
                  border: table === t ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
                  background: table === t ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-dark-secondary)',
                  color: table === t ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: table === t ? 700 : 400
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
          Ticket de Venta
        </h2>
        
        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '120px' }}>
          {cart.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>El carrito está vacío</div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="animate-slide-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-dark-secondary)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.quantity} x {formatCurrency(item.product.price)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(item.quantity * item.product.price)}</div>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Adjustments & Totals Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
          
          {/* Discounts & Tip Options */}
          {cart.length > 0 && (
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-dark-secondary)', padding: '0.75rem', borderRadius: '10px' }}>
              
              {/* Discount Pills */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>🏷️ Descuento:</span>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {[0, 5, 10, 15].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-glass)',
                        background: discountPercent === pct ? 'var(--warning)' : 'transparent',
                        color: discountPercent === pct ? 'black' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: discountPercent === pct ? 700 : 400,
                        fontSize: '0.75rem'
                      }}
                    >
                      {pct === 0 ? 'Sin' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tip Switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>🤝 Propina Sugerida (10%):</span>
                <button
                  onClick={() => setTipEnabled(!tipEnabled)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-glass)',
                    background: tipEnabled ? 'var(--accent)' : 'transparent',
                    color: tipEnabled ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: tipEnabled ? 700 : 400,
                    fontSize: '0.75rem'
                  }}
                >
                  {tipEnabled ? '✓ Aplicada' : '+ Agregar'}
                </button>
              </div>
            </div>
          )}

          {/* Detailed Totals */}
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--warning)', marginBottom: '0.2rem' }}>
              <span>Descuento ({discountPercent}%):</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {tipAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '0.2rem' }}>
              <span>Propina (10%):</span>
              <span>+{formatCurrency(tipAmount)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', marginTop: '0.2rem' }}>
            <span>Total:</span>
            <span className="text-accent">
              <span key={finalTotal} className="animate-roll">{formatCurrency(finalTotal)}</span>
            </span>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleOpenPaymentModal}
            style={{ width: '100%', fontSize: '1.1rem', padding: '0.85rem' }}
            disabled={cart.length === 0}
          >
            Cobrar e Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}


