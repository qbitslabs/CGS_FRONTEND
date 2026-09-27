/* Builds printable clinic invoices and cloud-subscription receipts.
 * Used after a visit is completed and from the billing pages. */
import { CloudInvoice, Invoice } from '../types';

/**
 * Generates an official printable/downloadable HTML Tax Invoice.
 */
export function generateInvoiceHTML(invoice: Invoice): string {
  const clinicName = invoice.clinicName || 'Clinic';
  const clinicAddress = invoice.clinicAddress || '';
  const clinicPhone = invoice.clinicPhone || '';
  const clinicEmail = invoice.clinicEmail || '';
  const clinicGstin = invoice.clinicGstin || '';
  const itemsRows = (invoice.services || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">
          <strong>${idx + 1}. ${item.name}</strong>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #475569;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #475569;">
          ₹${item.unitPrice.toLocaleString('en-IN')}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 600; color: #0f172a;">
          ₹${item.total.toLocaleString('en-IN')}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 32px;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .clinic-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.02em;
    }
    .clinic-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .badge-paid { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .badge-pending { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-partially-paid { background-color: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
    .badge-cancelled { background-color: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background-color: #0f766e;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 10px 14px;
      text-align: left;
    }
    th.text-center { text-align: center; }
    th.text-right { text-align: right; }

    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .totals-row.grand-total {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      margin-top: 6px;
    }
    .totals-row.due {
      color: #e11d48;
      font-weight: 700;
    }
    .totals-row.paid {
      color: #059669;
      font-weight: 700;
    }

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    .stamp-box {
      border: 2px dashed #cbd5e1;
      border-radius: 6px;
      padding: 10px 18px;
      text-align: center;
      color: #0f766e;
      font-weight: 700;
      font-size: 12px;
      display: inline-block;
    }

    @media print {
      body { padding: 0; }
      .invoice-card { border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="clinic-name">${clinicName}</div>
        ${clinicAddress ? `<div class="clinic-sub">${clinicAddress}</div>` : ''}
        <div class="clinic-sub">${[clinicPhone && `Phone: ${clinicPhone}`, clinicEmail && `Email: ${clinicEmail}`].filter(Boolean).join(' | ')}</div>
        ${clinicGstin ? `<div class="clinic-sub"><strong>GSTIN: ${clinicGstin}</strong></div>` : ''}
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Tax Invoice</div>
        <div style="font-family: monospace; font-size: 15px; font-weight: 700; color: #0f766e; margin-top: 2px;">
          ${invoice.invoiceNumber}
        </div>
        <div>
          <span class="badge badge-${invoice.paymentStatus.toLowerCase().replace(/\s+/g, '-')}">
            ${invoice.paymentStatus}
          </span>
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Invoice Date: <strong>${invoice.date}</strong>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-label">Patient Details</div>
        <div class="meta-value">${invoice.patientName}</div>
        <div style="font-size: 13px; color: #475569; margin-top: 2px;">Phone: ${invoice.patientPhone}</div>
        ${invoice.patientEmail ? `<div style="font-size: 12px; color: #64748b;">Email: ${invoice.patientEmail}</div>` : ''}
      </div>
      <div>
        <div class="meta-label">Doctor & Payment</div>
        ${invoice.treatingDoctorName ? `<div class="meta-value">${invoice.treatingDoctorName}</div>` : ''}
        <div style="font-size: 13px; color: #475569; margin-top: 2px;">Service: ${invoice.service}</div>
        <div style="font-size: 13px; color: #475569; margin-top: 2px;">Mode: <strong>${invoice.paymentMethod}</strong></div>
        ${invoice.dueDate ? `<div style="font-size: 12px; color: #64748b;">Payment Due: ${invoice.dueDate}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Procedure / Treatment Description</th>
          <th class="text-center" style="width: 60px;">Qty</th>
          <th class="text-right" style="width: 120px;">Unit Price (₹)</th>
          <th class="text-right" style="width: 120px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals-container">
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>₹${invoice.subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${
          invoice.discount > 0
            ? `<div class="totals-row" style="color: #059669;">
                <span>Clinic Discount:</span>
                <span>-₹${invoice.discount.toLocaleString('en-IN')}</span>
              </div>`
            : ''
        }
        ${
          invoice.tax > 0
            ? `<div class="totals-row">
                <span>GST${invoice.taxPercent ? ` ${invoice.taxPercent}%` : ''}:</span>
                <span>₹${invoice.tax.toLocaleString('en-IN')}</span>
              </div>`
            : ''
        }
        <div class="totals-row grand-total">
          <span>Total Payable:</span>
          <span>₹${invoice.total.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-row paid">
          <span>Amount Paid:</span>
          <span>₹${invoice.paidAmount.toLocaleString('en-IN')}</span>
        </div>
        ${
          invoice.remainingAmount > 0
            ? `<div class="totals-row due">
                <span>Remaining Due:</span>
                <span>₹${invoice.remainingAmount.toLocaleString('en-IN')}</span>
              </div>`
            : ''
        }
      </div>
    </div>

    ${
      invoice.notes
        ? `<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 12px; color: #92400e; white-space: pre-line;">
            <strong>Audit & Clinical Remarks:</strong><br>${invoice.notes}
          </div>`
        : ''
    }

    <div class="footer">
      <div>
        <div>This is a computer-generated tax invoice verified by ${clinicName}.</div>
        <div>For appointments or post-procedure care, contact the clinic.</div>
      </div>
      <div class="stamp-box">
        ✓ DIGITAL RECORD VERIFIED<br>
        <span style="font-size: 10px; font-weight: 500; color: #475569;">${clinicName} Accounts</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates an official printable/downloadable SaaS Cloud API Receipt.
 */
export function generateCloudReceiptHTML(cloudInvoice: CloudInvoice): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SaaS Receipt - ${cloudInvoice.invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      padding: 24px;
      line-height: 1.5;
    }
    .card {
      max-width: 760px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 32px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .title { font-size: 22px; font-weight: 800; color: #0f766e; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #0f766e; color: #ffffff; padding: 10px; text-align: left; font-size: 12px; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .badge { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="title">Clinic Growth System (CGS)</div>
        <div style="font-size: 12px; color: #64748b;">Enterprise Healthcare SaaS & Cloud AI Platform</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: 800;">OFFICIAL RECEIPT</div>
        <div style="font-family: monospace; color: #0f766e; font-weight: 700;">${cloudInvoice.invoiceNumber}</div>
        <span class="badge">${cloudInvoice.status}</span>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 14px; border-radius: 6px; margin-bottom: 16px; font-size: 13px;">
      <div><strong>Billed To:</strong> Clinic subscription account</div>
      <div><strong>Billing Period:</strong> ${cloudInvoice.billingPeriod}</div>
      <div><strong>Payment Date:</strong> ${cloudInvoice.date}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service Item</th>
          <th style="text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Clinic Growth Enterprise SaaS Subscription (Unlimited Doctors & AI Concierge)</strong></td>
          <td style="text-align: right;">₹${cloudInvoice.planAmount.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td><strong>Meta WhatsApp Cloud API Usage & Webhook Deliverability</strong></td>
          <td style="text-align: right;">₹${cloudInvoice.whatsappUsageAmount.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td><strong>AI Receptionist LLM Token Consumption (Included in Tier)</strong></td>
          <td style="text-align: right;">₹${cloudInvoice.aiUsageAmount.toLocaleString('en-IN')}</td>
        </tr>
        <tr style="font-weight: 800; font-size: 15px; background: #f8fafc;">
          <td>Total Amount Paid</td>
          <td style="text-align: right; color: #0f766e;">₹${cloudInvoice.totalAmount.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div style="font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
      Thank you for subscribing to Clinic Growth System. For billing queries, contact billing@clinicgrowth.com.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers a direct file download of the HTML/PDF Tax Invoice file
 * and opens the native print dialog formatted for 1-click "Save as PDF".
 */
export function printInvoice(invoice: Invoice): void {
  const htmlContent = generateInvoiceHTML(invoice);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(htmlContent);
  doc.close();
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 400);
}

export function downloadInvoicePDF(invoice: Invoice): void {
  const htmlContent = generateInvoiceHTML(invoice);

  // 1. Trigger standalone file download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `Invoice-${invoice.invoiceNumber}-${invoice.patientName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);

  // 2. Open printable preview window for 1-click "Save as PDF"
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}

/**
 * Triggers download of the SaaS Cloud API Receipt.
 */
export function downloadCloudReceiptPDF(cloudInvoice: CloudInvoice): void {
  const htmlContent = generateCloudReceiptHTML(cloudInvoice);

  // 1. Trigger standalone file download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `Receipt-${cloudInvoice.invoiceNumber}.html`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);

  // 2. Open printable preview window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
