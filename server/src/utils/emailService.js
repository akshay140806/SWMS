import nodemailer from 'nodemailer';
import Settings from '../models/Settings.js';
import User from '../models/User.js';

let cachedTransporter = null;
let lastTransporterConfig = null;

/**
 * Resolves the active SMTP transporter based on DB settings or environment variables.
 */
async function getTransporter(forceConfig = null) {
  const settings = await Settings.findOne({ key: 'global' }).catch(() => null);

  const host = forceConfig?.smtpHost || settings?.smtpHost || process.env.SMTP_HOST;
  const port = Number(forceConfig?.smtpPort || settings?.smtpPort || process.env.SMTP_PORT || 587);
  const secure = forceConfig?.smtpSecure !== undefined ? forceConfig.smtpSecure : (settings?.smtpSecure || process.env.SMTP_SECURE === 'true' || port === 465);
  const user = (forceConfig?.smtpUser || settings?.smtpUser || process.env.SMTP_USER || '').trim();
  const pass = (forceConfig?.smtpPass || settings?.smtpPass || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');

  const configSignature = `${host}:${port}:${user}:${secure}`;

  if (cachedTransporter && lastTransporterConfig === configSignature && !forceConfig) {
    return { transporter: cachedTransporter, isConfigured: Boolean((host || process.env.SMTP_SERVICE) && user) };
  }

  if (user && pass && (host || process.env.SMTP_SERVICE || user.includes('@gmail.com'))) {
    const isGmail = host?.toLowerCase().includes('gmail') || process.env.SMTP_SERVICE === 'gmail' || user.includes('@gmail.com');
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass }
        }
      : {
          host: host || 'smtp.gmail.com',
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false }
        };

    const transporter = nodemailer.createTransport(transportConfig);
    cachedTransporter = transporter;
    lastTransporterConfig = configSignature;
    return { transporter, isConfigured: true };
  }

  // Fallback simulator transporter for development when SMTP isn't yet configured
  const fallbackTransporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
    buffer: true
  });
  return { transporter: fallbackTransporter, isConfigured: false };
}

/**
 * Resolves target recipient emails (configured alert email, SMTP user, or active admin emails)
 */
async function resolveRecipients(customTo = null) {
  if (customTo) return Array.isArray(customTo) ? customTo : [customTo];

  const settings = await Settings.findOne({ key: 'global' }).catch(() => null);
  if (settings?.notificationEmail && settings.notificationEmail.includes('@')) {
    return [settings.notificationEmail.trim()];
  }

  if (process.env.ALERT_EMAIL || process.env.NOTIFICATION_EMAIL) {
    return [(process.env.ALERT_EMAIL || process.env.NOTIFICATION_EMAIL).trim()];
  }

  const smtpUser = settings?.smtpUser || process.env.SMTP_USER;
  if (smtpUser && smtpUser.includes('@')) {
    return [smtpUser.trim()];
  }

  const admins = await User.find({ role: 'admin' }).select('email').catch(() => []);
  const emails = admins.map((a) => a.email).filter(Boolean);
  return emails.length > 0 ? emails : ['admin@warex-wms.local'];
}

/**
 * Returns a standardized, high-contrast corporate HTML email template.
 */
function buildEmailHtml({ title, subtitle, statusText, statusTone = 'blue', details = [], link = '', linkText = 'Open in WareX Dashboard' }) {
  const toneColors = {
    emerald: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', badge: '#10b981' },
    blue: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', badge: '#2563eb' },
    amber: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', badge: '#f59e0b' },
    red: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', badge: '#ef4444' },
    indigo: { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe', badge: '#6366f1' }
  };
  const tone = toneColors[statusTone] || toneColors.blue;
  const appUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const targetUrl = link ? (link.startsWith('http') ? link : `${appUrl}${link}`) : appUrl;
  const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0f19; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Brand Header -->
          <tr>
            <td style="background-color: #030712; padding: 20px 28px; border-bottom: 1px solid #1f2937;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">Ware<span style="color: #38bdf8;">X</span></span>
                    <span style="background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; margin-left: 8px; letter-spacing: 0.5px;">Enterprise WMS</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background-color: ${tone.bg}; color: ${tone.text}; border: 1px solid ${tone.border};">
                      ${statusText || 'Operational Alert'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner / Headline -->
          <tr>
            <td style="padding: 28px 28px 12px 28px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                ${title}
              </h1>
              ${subtitle ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">${subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- Key Details Card -->
          <tr>
            <td style="padding: 12px 28px 24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1f2937; border-radius: 12px; border: 1px solid #374151; overflow: hidden;">
                ${details.map(([label, value], idx) => `
                  <tr>
                    <td style="padding: 11px 16px; font-size: 12px; font-weight: 600; color: #94a3b8; width: 38%; ${idx !== details.length - 1 ? 'border-bottom: 1px solid #374151;' : ''}">
                      ${label}
                    </td>
                    <td style="padding: 11px 16px; font-size: 13px; font-weight: 700; color: #f8fafc; text-align: right; ${idx !== details.length - 1 ? 'border-bottom: 1px solid #374151;' : ''}">
                      ${value}
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- Call To Action -->
          <tr>
            <td align="center" style="padding: 0 28px 28px 28px;">
              <a href="${targetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                ${linkText} &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #030712; padding: 18px 28px; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                Automated event dispatched by WareX Central Supply Chain Ledger on ${formattedTime} IST.<br>
                This operational notification was triggered in response to an inventory lifecycle state change.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Base email dispatcher.
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const settings = await Settings.findOne({ key: 'global' }).catch(() => null);
    if (settings && settings.emailAlerts === false) {
      console.log(`[Email Service] Email alerts disabled in system settings. Skipped: "${subject}"`);
      return { sent: false, reason: 'disabled' };
    }

    const recipients = await resolveRecipients(to);
    if (!recipients || recipients.length === 0) {
      console.warn(`[Email Service] No recipient email found for: "${subject}"`);
      return { sent: false, reason: 'no_recipient' };
    }

    const { transporter, isConfigured } = await getTransporter();
    const smtpUser = settings?.smtpUser || process.env.SMTP_USER;
    let fromAddress = settings?.smtpFrom || process.env.SMTP_FROM;
    if (!fromAddress || fromAddress.includes('@warex-wms.local')) {
      fromAddress = smtpUser ? `"WareX Central WMS" <${smtpUser}>` : `"WareX Central WMS" <notifications@warex-wms.local>`;
    }

    const mailOptions = {
      from: fromAddress,
      to: recipients.join(', '),
      subject,
      text: text || subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    if (isConfigured) {
      console.log(`[Email Service: SMTP Sent] To: ${recipients.join(', ')} | Subject: "${subject}" | MessageId: ${info.messageId}`);
    } else {
      console.log(`[Email Service: Dev Simulated] To: ${recipients.join(', ')} | Subject: "${subject}" | (Configure SMTP in Settings for live delivery)`);
    }

    return { sent: true, isConfigured, messageId: info.messageId, recipients };
  } catch (err) {
    console.error(`[Email Service: Failed] Error sending email "${subject}":`, err.message);
    return { sent: false, error: err.message };
  }
}

// ============================================================================
// STAGE-SPECIFIC DISPATCHERS: ADDING STOCK TILL DISPATCH
// ============================================================================

/**
 * 1. Stock Inward (Stock Added)
 */
export async function sendStockInwardEmail({ product, qty, location, operator, note, reference }) {
  const title = `Stock Received: ${qty} ${product.unit || 'units'} of ${product.name}`;
  const subtitle = `Goods received and verified into rack storage location ${location}.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Stock Inward Completed',
    statusTone: 'emerald',
    details: [
      ['Product Name', product.name],
      ['Product SKU', product.sku],
      ['Quantity Added', `+${qty} ${product.unit || 'units'}`],
      ['Storage Location', location || 'Unassigned'],
      ['Reference / Invoice', reference || 'Direct Inward'],
      ['Received By', operator?.name || 'Warehouse Staff'],
      ['Notes / Remarks', note || 'None']
    ],
    link: `/products/${product._id || product.id}`,
    linkText: 'View Product Details'
  });

  return sendEmail({ subject: `[WareX Stock Inward] ${qty}x ${product.sku} added to ${location}`, html });
}

/**
 * 2. Purchase Order Received (GRN)
 */
export async function sendPurchaseReceivedEmail({ poNo, grnNo, vendorName, itemsCount, totalQty, operator }) {
  const title = `Purchase Goods Received: ${poNo}`;
  const subtitle = `Inward verification completed against supplier ${vendorName || 'Vendor'}.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'GRN Logged',
    statusTone: 'emerald',
    details: [
      ['Purchase Order No', poNo],
      ['GRN / Receiving No', grnNo || 'Direct Receipt'],
      ['Supplier / Vendor', vendorName || 'Authorized Vendor'],
      ['Line Items Count', `${itemsCount} item(s)`],
      ['Total Units Inwarded', `${totalQty} units`],
      ['Verified By', operator?.name || 'Inward Inspector']
    ],
    link: '/purchases',
    linkText: 'View Purchase Inward'
  });

  return sendEmail({ subject: `[WareX GRN Received] Purchase Order ${poNo} verified`, html });
}

/**
 * 3. Low Stock Warning
 */
export async function sendLowStockEmail({ product, available, reorderLevel }) {
  const title = `Low Stock Alert: ${product.name}`;
  const subtitle = `Available inventory has dropped to or below the reorder safety threshold.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Immediate Reorder Required',
    statusTone: 'amber',
    details: [
      ['Product SKU', product.sku],
      ['Product Name', product.name],
      ['Available Quantity', `${available} ${product.unit || 'units'}`],
      ['Reorder Level', `${reorderLevel} ${product.unit || 'units'}`],
      ['Default Storage Bin', product.defaultLocationId?.code || 'Bin Location'],
      ['Recommended Action', 'Create supplier PO or initiate warehouse transfer']
    ],
    link: `/products/${product._id || product.id}`,
    linkText: 'Reorder / Restock Now'
  });

  return sendEmail({ subject: `[WareX Low Stock Alert] ${product.sku} (${available} ${product.unit} remaining)`, html });
}

/**
 * 4. Stock Damage Alert
 */
export async function sendStockDamagedEmail({ product, qty, reason, location, operator }) {
  const title = `Stock Damage Flagged: ${qty} units of ${product.name}`;
  const subtitle = `Units removed from sellable stock and placed in quarantine hold.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Damaged Hold',
    statusTone: 'red',
    details: [
      ['Product SKU', product.sku],
      ['Product Name', product.name],
      ['Damaged Quantity', `${qty} ${product.unit || 'units'}`],
      ['Storage Location', location || 'Quarantine Zone'],
      ['Reason / Defect', reason || 'Inspection Flag'],
      ['Flagged By', operator?.name || 'Quality Control']
    ],
    link: '/movements',
    linkText: 'Inspect Inventory Ledger'
  });

  return sendEmail({ subject: `[WareX Damage Flag] ${qty}x ${product.sku} placed in damage hold`, html });
}

/**
 * 5. Stock Transfer
 */
export async function sendStockTransferEmail({ product, qty, fromLoc, toLoc, operator, note }) {
  const title = `Bin Transfer: ${qty} units of ${product.name}`;
  const subtitle = `Internal stock relocation between warehouse storage zones.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Bin Relocation',
    statusTone: 'indigo',
    details: [
      ['Product SKU', product.sku],
      ['Product Name', product.name],
      ['Quantity Transferred', `${qty} ${product.unit || 'units'}`],
      ['Source Location', fromLoc],
      ['Destination Location', toLoc],
      ['Transferred By', operator?.name || 'Warehouse Staff'],
      ['Transfer Note', note || 'Standard relocation']
    ],
    link: '/locations',
    linkText: 'View Warehouse Map'
  });

  return sendEmail({ subject: `[WareX Stock Transfer] ${product.sku} moved from ${fromLoc} to ${toLoc}`, html });
}

/**
 * 6. Sales Order Created
 */
export async function sendOrderCreatedEmail({ order, customerName, items, totalUnits }) {
  const title = `New Sales Order Created: ${order.orderNo}`;
  const subtitle = `Order booked for ${customerName}. Stock reservation successfully held.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Order Placed & Reserved',
    statusTone: 'blue',
    details: [
      ['Sales Order No', order.orderNo],
      ['Customer Name', customerName],
      ['Customer Phone', order.customerPhone || 'N/A'],
      ['Delivery Address', order.deliveryAddress || 'Standard Delivery'],
      ['Line Items Count', `${items?.length || 0} product(s)`],
      ['Total Units Reserved', `${totalUnits || 0} units`],
      ['Next Operational Step', 'Generate picking list & assign warehouse picker']
    ],
    link: `/orders/${order._id}`,
    linkText: 'View Sales Order'
  });

  return sendEmail({ subject: `[WareX New Order] ${order.orderNo} created for ${customerName}`, html });
}

/**
 * 7. Order Picking List Generated
 */
export async function sendPickingGeneratedEmail({ order, pickerName, totalItems }) {
  const title = `Picking Slip Generated: ${order.orderNo}`;
  const subtitle = `Shortest-path bin route calculated for warehouse fulfillment operator.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Picking In Progress',
    statusTone: 'amber',
    details: [
      ['Sales Order No', order.orderNo],
      ['Customer Name', order.customerName],
      ['Items To Pick', `${totalItems} line items`],
      ['Assigned Picker', pickerName || 'Warehouse Dispatch Team'],
      ['Fulfillment Status', 'Picking from storage racks']
    ],
    link: `/picking`,
    linkText: 'Open Picking Route'
  });

  return sendEmail({ subject: `[WareX Picking Slip] Order ${order.orderNo} route generated`, html });
}

/**
 * 8. Package Created (Order Packed)
 */
export async function sendPackageCreatedEmail({ packageNo, orderNo, weight, itemsCount, operator }) {
  const title = `Package Prepared: ${packageNo}`;
  const subtitle = `Items packed and labeled for Order ${orderNo}.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Packed & Weighed',
    statusTone: 'blue',
    details: [
      ['Package Slip No', packageNo],
      ['Associated Order', orderNo],
      ['Packed Items Count', `${itemsCount} item(s)`],
      ['Package Weight', weight ? `${weight} kg` : 'Standard Package'],
      ['Packed By Operator', operator?.name || 'Packaging Station']
    ],
    link: '/packages',
    linkText: 'View Package Queue'
  });

  return sendEmail({ subject: `[WareX Order Packed] ${packageNo} prepared for ${orderNo}`, html });
}

/**
 * 9. Shipment & Delivery Challan Created
 */
export async function sendShipmentCreatedEmail({ shipmentNo, orderNo, customerName, carrier, trackingNo, operator }) {
  const title = `Shipment & Challan Generated: ${shipmentNo}`;
  const subtitle = `Delivery challan issued for Order ${orderNo} with carrier assignment.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Shipment Ready',
    statusTone: 'indigo',
    details: [
      ['Shipment Number', shipmentNo],
      ['Associated Order', orderNo],
      ['Customer Name', customerName],
      ['Carrier / Logistics Partner', carrier || 'Local Warehouse Fleet'],
      ['Tracking Waybill No', trackingNo || 'Pending AWB'],
      ['Dispatched By', operator?.name || 'Fulfillment Lead']
    ],
    link: '/shipments',
    linkText: 'View Delivery Challan'
  });

  return sendEmail({ subject: `[WareX Shipment Created] ${shipmentNo} for Order ${orderNo}`, html });
}

/**
 * 10. Order Dispatched
 */
export async function sendOrderDispatchedEmail({ order, carrier, trackingNo, operator, dispatchNotes }) {
  const title = `Order Dispatched: ${order.orderNo}`;
  const subtitle = `Stock ledger reconciled. Consignment handed over to courier.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Dispatched & In Transit',
    statusTone: 'emerald',
    details: [
      ['Sales Order No', order.orderNo],
      ['Customer Name', order.customerName],
      ['Shipping Carrier', carrier || 'Express Fleet'],
      ['Tracking Airway Bill', trackingNo || 'Direct Handover'],
      ['Dispatch Notes', dispatchNotes || 'Verified & Sealed'],
      ['Dispatched By', operator?.name || 'Dispatch Staff']
    ],
    link: `/orders/${order._id}`,
    linkText: 'Track Order & Shipment'
  });

  return sendEmail({ subject: `[WareX Dispatched] Order ${order.orderNo} shipped via ${carrier || 'Express Fleet'}`, html });
}

/**
 * 11. Sales Return (Restocked)
 */
export async function sendSalesReturnEmail({ returnNo, customerName, itemsCount, reason, operator }) {
  const title = `Sales Return Processed: ${returnNo}`;
  const subtitle = `Returned items inspected and restocked back into inventory ledger.`;
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: 'Restocked Inward',
    statusTone: 'emerald',
    details: [
      ['Return Slip No', returnNo],
      ['Customer Name', customerName],
      ['Returned Line Items', `${itemsCount} item(s)`],
      ['Return Reason', reason || 'Customer Return'],
      ['Inspected & Restocked By', operator?.name || 'Warehouse Staff']
    ],
    link: '/returns',
    linkText: 'View Sales Return'
  });

  return sendEmail({ subject: `[WareX Return Restocked] ${returnNo} from ${customerName}`, html });
}

/**
 * 12. Test Email Verification
 */
export async function sendTestEmail({ to, smtpConfig = null }) {
  const { transporter, isConfigured } = await getTransporter(smtpConfig);
  const targetEmail = to || (await resolveRecipients())[0];

  const title = 'WareX Smart Warehouse SMTP Channel Test';
  const subtitle = 'Your operational email dispatch engine is configured and operational.';
  const html = buildEmailHtml({
    title,
    subtitle,
    statusText: isConfigured ? 'Live SMTP Connected' : 'Simulated Test Mode',
    statusTone: 'emerald',
    details: [
      ['Test Destination', targetEmail],
      ['Transport Engine', isConfigured ? 'Direct SMTP Server' : 'Local Stream Transport (Dev)'],
      ['Alert Coverage', 'Inward -> Low Stock -> Orders -> Picking -> Packaging -> Dispatch'],
      ['Server Timestamp', new Date().toISOString()]
    ],
    link: '/settings',
    linkText: 'View WMS Settings'
  });

  const mailOptions = {
    from: smtpConfig?.smtpFrom || process.env.SMTP_FROM || `"WareX Smart WMS" <notifications@warex-wms.local>`,
    to: targetEmail,
    subject: '[WareX Test] Warehouse Notification Channel Verification',
    text: 'This is a test notification confirming your WareX Smart WMS email engine is working.',
    html
  };

  const info = await transporter.sendMail(mailOptions);
  return { ok: true, isConfigured, messageId: info.messageId, recipient: targetEmail };
}
