'use client';
import { useState, useEffect } from 'react';
import { getSales, getProducts } from '@/lib/data';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
};

export default function InvoicePage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [singleSale, setSingleSale] = useState<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Hide sidebar for print layouts
    const style = document.createElement('style');
    style.innerHTML = `
      .sidebar { display: none !important; }
      .main-content { margin-left: 0 !important; padding: 0 !important; }
      body { background: white !important; color: black !important; }
      @media print {
        @page { margin: 8mm; }
        body { -webkit-print-color-adjust: exact; }
      }
    `;
    document.head.appendChild(style);

    const allSales = getSales();
    setSales(allSales);
    setProducts(getProducts());

    // Check for saleId query param
    const searchParams = new URLSearchParams(window.location.search);
    const saleIdParam = searchParams.get('saleId');
    if (saleIdParam) {
      const found = allSales.find((s: any) => s.id.toString() === saleIdParam);
      if (found) {
        setSingleSale(found);
      }
    }

    setIsLoaded(true);

    setTimeout(() => {
      window.print();
    }, 800);
  }, []);

  if (!isLoaded) return <div style={{ color: 'black', padding: '2rem' }}>Generando documento...</div>;

  // Single Sale Ticket View
  if (singleSale) {
    const isElectronic = singleSale.isElectronic;
    return (
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '1.5rem', fontFamily: isElectronic ? 'Arial, sans-serif' : "'Courier New', Courier, monospace", background: 'white', color: 'black' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '22px', fontWeight: 'bold' }}>PARADOR PRO S.A.S.</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>NIT: 900.876.543-1 • IVA Régimen Común</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '13px', fontWeight: 'bold' }}>
            {isElectronic ? 'FACTURA ELECTRÓNICA DE VENTA DIAN' : 'TICKET DE VENTA POS'}
          </p>
          <p style={{ margin: '0.1rem 0 0 0', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
            Nº {isElectronic ? 'FE' : 'VTA'}-{singleSale.id.toString().slice(-6)}
          </p>
        </div>

        {/* Sales / Customer Metadata */}
        <div style={{ fontSize: '11px', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.75rem', lineHeight: '1.5' }}>
          <div><strong>Fecha y Hora:</strong> {new Date(singleSale.date).toLocaleDateString('es-CO')} {new Date(singleSale.date).toLocaleTimeString('es-CO')}</div>
          <div><strong>Cajero Atendedor:</strong> {singleSale.cashier}</div>
          <div><strong>Mesa / Ubicación:</strong> {singleSale.table || 'Para Llevar'}</div>

          {/* Electronic Customer Details */}
          {isElectronic && (
            <div style={{ marginTop: '0.5rem', background: '#f5f5f5', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <div><strong>ADQUIRENTE / CLIENTE:</strong></div>
              <div>NIT / Cédula: <strong>{singleSale.customerDoc}</strong></div>
              <div>Razón Social: <strong>{singleSale.customerName}</strong></div>
              {singleSale.customerEmail && <div>Email: {singleSale.customerEmail}</div>}
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
              <th style={{ padding: '6px 0' }}>Cant.</th>
              <th style={{ padding: '6px 0' }}>Producto</th>
              <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {singleSale.items.map((item: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                <td style={{ padding: '6px 0', verticalAlign: 'top', fontWeight: 'bold' }}>{item.quantity}x</td>
                <td style={{ padding: '6px 0' }}>
                  <div>{item.product.name}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>{formatCurrency(item.product.price)} c/u</div>
                </td>
                <td style={{ padding: '6px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                  {formatCurrency(item.product.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Adjustments & Tax Breakdown */}
        <div style={{ fontSize: '11px', borderTop: '1px solid #000', paddingTop: '0.5rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
          {singleSale.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
              <span>Descuento Comercial ({singleSale.discountPercent}%):</span>
              <span>-{formatCurrency(singleSale.discountAmount)}</span>
            </div>
          )}
          {singleSale.tipAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
              <span>Propina Voluntaria (10%):</span>
              <span>+{formatCurrency(singleSale.tipAmount)}</span>
            </div>
          )}

          {isElectronic && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #ccc', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base Gravable Subtotal:</span>
                <span>{formatCurrency(singleSale.taxableBase || singleSale.total * 0.85)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>INC (Impuesto Consumo 8%):</span>
                <span>{formatCurrency(singleSale.incAmount || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA (19% Productos Tienda):</span>
                <span>{formatCurrency(singleSale.ivaAmount || 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Final Total */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
            <span>TOTAL A PAGAR:</span>
            <span>{formatCurrency(singleSale.total)}</span>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '11px', background: '#f8f8f8', padding: '0.5rem', borderRadius: '4px', border: '1px solid #eee' }}>
            <div><strong>Medio de Pago:</strong> <span style={{ textTransform: 'capitalize' }}>{singleSale.paymentMethod || 'Efectivo'}</span></div>
            {singleSale.paymentMethod === 'efectivo' && (
              <>
                <div><strong>Efectivo Recibido:</strong> {formatCurrency(singleSale.cashReceived || singleSale.total)}</div>
                <div><strong>Cambio / Devuelta:</strong> {formatCurrency(singleSale.changeGiven || 0)}</div>
              </>
            )}
            {singleSale.transactionRef && (
              <div><strong>Nº Comprobante:</strong> {singleSale.transactionRef}</div>
            )}
          </div>
        </div>

        {/* DIAN CUFE & QR CODE */}
        {isElectronic && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem', border: '1px solid #000', borderRadius: '6px', textAlign: 'center', background: '#fafafa' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '0.25rem' }}>CÓDIGO ÚNICO DE FACTURA ELECTRÓNICA (CUFE):</div>
            <div style={{ fontSize: '8px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#444', marginBottom: '0.75rem' }}>
              {singleSale.cufe || 'fe1790019dian9008765431paradorprovalido'}
            </div>

            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${singleSale.cufe || 'fe1790'}`}
              alt="QR DIAN"
              style={{ width: '100px', height: '100px', display: 'block', margin: '0 auto' }}
            />
            <div style={{ fontSize: '9px', color: '#555', marginTop: '0.25rem' }}>Representación Gráfica de Factura Electrónica DIAN</div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '11px', borderTop: '1px dashed #aaa', paddingTop: '0.75rem' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>¡Gracias por elegir Parador Pro!</p>
          <p style={{ margin: '3px 0 0 0', color: '#666' }}>Documento Expedido por Sistema Informático Registrado</p>
        </div>
      </div>
    );
  }

  // Daily Closing Invoice View (When NO saleId is provided)
  const activeSales = sales.filter((s: any) => s.status !== 'cancelled');
  const totalRevenue = activeSales.reduce((sum, sale) => sum + sale.total, 0);

  // Payment Breakdown
  const cashTotal = activeSales.filter(s => !s.paymentMethod || s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0);
  const nequiTotal = activeSales.filter(s => s.paymentMethod === 'nequi').reduce((sum, s) => sum + s.total, 0);
  const cardTotal = activeSales.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0);

  // Agrupar ventas por producto
  const productSales = activeSales.reduce((acc, sale) => {
    sale.items.forEach((item: any) => {
      const pid = item.product.id;
      if (!acc[pid]) {
        acc[pid] = { name: item.product.name, quantity: 0, revenue: 0 };
      }
      acc[pid].quantity += item.quantity;
      acc[pid].revenue += (item.product.price * item.quantity);
    });
    return acc;
  }, {} as Record<number, { name: string, quantity: number, revenue: number }>);

  const productList = Object.values(productSales);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'Arial, sans-serif', color: 'black' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '24px' }}>PARADOR PRO</h1>
        <p style={{ margin: 0, color: '#555' }}>Reporte General de Cierre de Caja Diario e Inventario</p>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>Fecha de Cierre: {new Date().toLocaleDateString('es-CO')} {new Date().toLocaleTimeString('es-CO')}</p>
      </div>

      {/* Financial Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Resumen Financiero del Día</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
          <span>Total Transacciones Válidas:</span>
          <strong>{activeSales.length}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#2a7a2a' }}>
          <span>Ingresos Brutos Recaudados:</span>
          <span>{formatCurrency(totalRevenue)}</span>
        </div>

        {/* Payment Methods Breakdown Table */}
        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1rem' }}>Desglose Arqueo por Medio de Pago</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd' }}>Medio de Pago</th>
              <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #ddd' }}>Transacciones</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #ddd' }}>Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', fontWeight: 'bold' }}>💵 Efectivo en Cajón Físico</td>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', textAlign: 'center' }}>{activeSales.filter(s => !s.paymentMethod || s.paymentMethod === 'efectivo').length}</td>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(cashTotal)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', fontWeight: 'bold' }}>📱 Nequi / Daviplata</td>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', textAlign: 'center' }}>{activeSales.filter(s => s.paymentMethod === 'nequi').length}</td>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(nequiTotal)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', fontWeight: 'bold' }}>💳 Tarjetas Débito / Crédito</td>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', textAlign: 'center' }}>{activeSales.filter(s => s.paymentMethod === 'tarjeta').length}</td>
              <td style={{ padding: '0.5rem', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(cardTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Detalle de Ventas por Cajero</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd' }}>#</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd' }}>Cajero</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd' }}>Mesa</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd' }}>Pago</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #ddd' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {activeSales.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>No hay ventas registradas el día de hoy</td></tr>
            ) : (
              activeSales.map((sale, idx) => (
                <tr key={sale.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#888' }}>{idx + 1}</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #ddd', fontWeight: 'bold' }}>{sale.cashier}</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #ddd', fontSize: '0.85rem' }}>{sale.table || 'Para Llevar'}</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #ddd', fontSize: '0.85rem', textTransform: 'capitalize' }}>{sale.paymentMethod || 'efectivo'}</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                    {formatCurrency(sale.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Desglose de Productos Vendidos Hoy</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd' }}>Producto</th>
              <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #ddd' }}>Cant. Vendida</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #ddd' }}>Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            {productList.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>No hay ventas registradas</td>
              </tr>
            ) : (
              productList.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: '0.5rem', border: '1px solid #ddd' }}>{p.name}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #ddd' }}>{p.quantity}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(p.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Estado del Inventario al Cierre</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd' }}>Producto</th>
              <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #ddd' }}>Stock Restante</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ padding: '0.5rem', border: '1px solid #ddd' }}>{p.name}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #ddd', color: p.stock <= 5 ? 'red' : 'black', fontWeight: p.stock <= 5 ? 'bold' : 'normal' }}>
                  {p.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.9rem', color: '#777' }}>
        Este documento es un comprobante oficial de Cierre Diario de Caja en Parador Pro.
      </div>
    </div>
  );
}


