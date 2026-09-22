import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount || 0);
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      saleId,
      customerEmail,
      customerName,
      customerDoc,
      total,
      subtotal,
      discountAmount,
      tipAmount,
      items,
      paymentMethod,
      table,
      date,
      isElectronic,
      cufe,
      taxableBase,
      incAmount,
      ivaAmount
    } = body;

    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Dirección de correo no válida' },
        { status: 400 }
      );
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    const fromName = process.env.SMTP_FROM_NAME || 'Parador Pro - Facturación';

    // Verificar si las credenciales SMTP están configuradas o si aún son los valores por defecto
    const isConfigured = 
      Boolean(user) && 
      Boolean(pass) && 
      pass !== 'tu_contrasena_de_aplicacion_aqui' && 
      user !== 'correoparadorpro@gmail.com';

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        isConfigured: false,
        message: 'Sistema listo. Falta configurar el usuario y contraseña SMTP oficiales del Parador en el archivo .env.local.'
      });
    }

    // Configurar transporte SMTP con nodemailer
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true para 465, false para otros puertos
      auth: {
        user,
        pass,
      },
    });

    // Construir tabla de productos HTML
    const itemsHtml = (items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #1e293b;">${item.product?.name || item.name || 'Producto'}</strong><br/>
            <span style="font-size: 12px; color: #64748b;">Cantidad: ${item.quantity} x ${formatCurrency(item.product?.price || item.price || 0)}</span>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">
            ${formatCurrency((item.product?.price || item.price || 0) * item.quantity)}
          </td>
        </tr>
      `
      )
      .join('');

    // Plantilla de correo HTML elegante con diseño profesional
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Comprobante de Pago - Parador Pro</title>
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Encabezado con degradado -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Parador Pro</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Comprobante Digital de Venta</p>
          </div>

          <!-- Cuerpo -->
          <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; color: #64748b;">
              <div>Recibo: <strong style="color: #0f172a;">#VTA-${String(saleId || Date.now()).slice(-6)}</strong></div>
              <div>Fecha: <strong style="color: #0f172a;">${new Date(date || Date.now()).toLocaleDateString('es-CO')} ${new Date(date || Date.now()).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</strong></div>
            </div>

            ${customerName ? `
              <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
                <div style="color: #64748b;">Cliente / Razón Social:</div>
                <strong style="color: #0f172a; font-size: 15px;">${customerName}</strong>
                ${customerDoc ? `<span style="color: #64748b; font-size: 13px;"> (${customerDoc})</span>` : ''}
              </div>
            ` : ''}

            <!-- Tabla de artículos -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
                  <th style="text-align: left; padding-bottom: 8px;">Descripción</th>
                  <th style="text-align: right; padding-bottom: 8px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Desglose de Totales -->
            <div style="margin-left: auto; max-width: 280px; font-size: 14px; display: flex; flex-direction: column; gap: 6px;">
              ${subtotal ? `<div style="display: flex; justify-content: space-between; color: #64748b;"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>` : ''}
              ${discountAmount ? `<div style="display: flex; justify-content: space-between; color: #d97706;"><span>Descuento:</span><span>-${formatCurrency(discountAmount)}</span></div>` : ''}
              ${tipAmount ? `<div style="display: flex; justify-content: space-between; color: #4f46e5;"><span>Propina Sugerida:</span><span>+${formatCurrency(tipAmount)}</span></div>` : ''}
              
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #10b981; border-top: 2px solid #e2e8f0; padding-top: 8px; margin-top: 4px;">
                <span>Total Pagado:</span>
                <span>${formatCurrency(total)}</span>
              </div>
            </div>

            <!-- Datos de Pago -->
            <div style="margin-top: 24px; padding: 12px; background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 10px; font-size: 13px; color: #6b21a8;">
              📍 <strong>Medio de Pago:</strong> ${String(paymentMethod || 'Efectivo').toUpperCase()} • Destino: <strong>${table || 'Para Llevar'}</strong>
            </div>

            ${isElectronic && cufe ? `
              <div style="margin-top: 16px; padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; font-size: 12px; color: #065f46; word-break: break-all;">
                <strong>🧾 Factura Electrónica DIAN</strong><br/>
                <span style="font-size: 11px; opacity: 0.85;">CUFE: ${cufe}</span>
              </div>
            ` : ''}
          </div>

          <!-- Pie de página -->
          <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            ¡Gracias por su compra en <strong>Parador Pro</strong>! Por favor conserve este comprobante digital.
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar correo
    const mailOptions = {
      from: `"${fromName}" <${user}>`,
      to: customerEmail,
      subject: `📄 Comprobante de Compra #VTA-${String(saleId || Date.now()).slice(-6)} - Parador Pro`,
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      isConfigured: true,
      messageId: info.messageId,
      message: `¡Correo enviado exitosamente a ${customerEmail}!`,
    });
  } catch (error: any) {
    console.error('Error al enviar correo SMTP:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al conectar con el servidor SMTP de correo',
      },
      { status: 500 }
    );
  }
}
