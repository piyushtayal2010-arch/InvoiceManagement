function loadClientsForDropdown() {
  const raw = localStorage.getItem('invoiceClients');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function loadServicesForDropdown() {
  const raw = localStorage.getItem('invoiceServices');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function getSettings() {
  const raw = localStorage.getItem('invoiceSettings');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('invalid settings', e);
    return {};
  }
}

function populateClientDropdown() {
  const select = document.getElementById('clientSelect');
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>Choose client</option>';
  loadClientsForDropdown().forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.email;
    opt.text = `${c.name} (${c.email})`;
    select.appendChild(opt);
  });
  M.FormSelect.init(select);
}

function populateServiceDropdown() {
  const select = document.getElementById('serviceSelect');
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>Choose service</option>';
  loadServicesForDropdown().forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.text = s.name;
    select.appendChild(opt);
  });
  M.FormSelect.init(select);
}

function fillClientFields(email) {
  const c = loadClientsForDropdown().find((x) => x.email === email);
  if (!c) return;
  document.getElementById('clientName').value = c.name || '';
  document.getElementById('clientAddress').value = c.address || '';
  document.getElementById('clientEmail').value = c.email || '';
  document.getElementById('clientPhone').value = c.phone || '';
  document.getElementById('paymentTerms').value = c.terms || document.getElementById('paymentTerms').value;
  M.updateTextFields();
}

function fillServiceFields(name) {
  const s = loadServicesForDropdown().find((x) => x.name === name);
  if (!s) return;
  document.getElementById('serviceName').value = s.name || '';
  document.getElementById('hsn').value = s.hsn || '';
  document.getElementById('serviceDesc').value = s.desc || '';
  M.updateTextFields();
}

const invoiceItems = [];

function getCurrency() {
  return document.getElementById('currency')?.value || 'CAD';
}

function currencySymbol(code) {
  return { CAD: '$', USD: '$', EUR: '€', INR: '₹' }[code] || '$';
}

function formatMoney(amount) {
  return `${currencySymbol(getCurrency())} ${Number(amount || 0).toFixed(2)}`;
}

function readInput(id) {
  return document.getElementById(id).value.trim();
}

function buildDisplayInvoiceNo(prefix, invoiceNo) {
  return `${prefix ? `${prefix}` : ''}${invoiceNo || 'Draft'}`;
}

function renderInvoicePrefixInline(settings = getSettings()) {
  const prefixEl = document.getElementById('invoicePrefixInline');
  const groupEl = document.querySelector('.invoice-no-group');
  if (!prefixEl || !groupEl) return;

  const prefix = String(settings.invoicePrefix || '').trim();
  prefixEl.textContent = prefix;
  if (!prefix) {
    prefixEl.style.display = 'none';
    groupEl.style.setProperty('--invoice-prefix-offset', '0px');
    return;
  }

  prefixEl.style.display = 'block';
  const prefixWidth = Math.ceil(prefixEl.getBoundingClientRect().width);
  groupEl.style.setProperty('--invoice-prefix-offset', `${prefixWidth + 12}px`);
}

function collectCurrentItemFromForm() {
  const serviceName = readInput('serviceName');
  const hsn = readInput('hsn');
  const serviceDesc = readInput('serviceDesc');
  const period = readInput('period');
  const qty = Number(document.getElementById('qty').value) || 0;
  const rate = Number(document.getElementById('rate').value) || 0;
  const taxPct = Number(document.getElementById('itemTax').value) || 0;

  if (!serviceName) {
    M.toast({ html: 'Service name is required' });
    return null;
  }
  if (qty <= 0) {
    M.toast({ html: 'Quantity must be greater than 0' });
    return null;
  }
  if (rate < 0 || taxPct < 0) {
    M.toast({ html: 'Rate and tax cannot be negative' });
    return null;
  }

  return { serviceName, hsn, serviceDesc, period, qty, rate, taxPct, amount: qty * rate };
}

function clearItemForm() {
  ['serviceName', 'hsn', 'serviceDesc', 'period', 'qty', 'rate'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('itemTax').value = document.getElementById('itemTax').value || '0';
  M.updateTextFields();
}

function addInvoiceItem() {
  const item = collectCurrentItemFromForm();
  if (!item) return;
  invoiceItems.push(item);
  clearItemForm();
  renderItemTable();
}

function removeInvoiceItem(index) {
  invoiceItems.splice(index, 1);
  renderItemTable();
}

function computeTotals() {
  const discount = Number(document.getElementById('discount').value) || 0;
  const shipping = Number(document.getElementById('shipping').value) || 0;
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const igstTax = invoiceItems.reduce((sum, item) => sum + (item.amount * item.taxPct) / 100, 0);
  return {
    subtotal,
    igstTax,
    discount,
    shipping,
    grandTotal: Math.max(0, subtotal + igstTax + shipping - discount)
  };
}

function renderSummary() {
  const totals = computeTotals();
  document.getElementById('summarySubtotal').textContent = formatMoney(totals.subtotal);
  document.getElementById('summaryTax').textContent = formatMoney(totals.igstTax);
  document.getElementById('summaryDiscount').textContent = formatMoney(totals.discount);
  document.getElementById('summaryShipping').textContent = formatMoney(totals.shipping);
  document.getElementById('summaryTotal').textContent = formatMoney(totals.grandTotal);
}

function renderItemTable() {
  const tbody = document.getElementById('itemTableBody');
  tbody.innerHTML = '';

  if (!invoiceItems.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="center-align grey-text">No line items added yet.</td></tr>';
    renderSummary();
    return;
  }

  invoiceItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${item.serviceName}</strong>${item.hsn ? `<br>HSN: ${item.hsn}` : ''}${item.serviceDesc ? `<br>${item.serviceDesc}` : ''}${item.period ? `<br>${item.period}` : ''}</td>
      <td>${item.qty}</td>
      <td>${formatMoney(item.rate)}</td>
      <td>${item.taxPct.toFixed(2)}%</td>
      <td>${formatMoney(item.amount)}</td>
      <td><button class="btn-flat red-text"><i class="material-icons">delete</i></button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => removeInvoiceItem(index));
    tbody.appendChild(tr);
  });

  renderSummary();
}

function validateInvoiceBeforeDownload() {
  const required = [
    ['invoiceNo', 'Invoice number is required'],
    ['invoiceDate', 'Invoice date is required'],
    ['clientName', 'Client name is required'],
    ['clientEmail', 'Client email is required'],
    ['clientAddress', 'Client address is required']
  ];

  for (const [id, message] of required) {
    if (!readInput(id)) {
      M.toast({ html: message });
      document.getElementById(id).focus();
      return false;
    }
  }

  if (!invoiceItems.length) {
    M.toast({ html: 'Add at least one line item' });
    return false;
  }

  return true;
}

function generatePDF(previewOnly = false) {
  try {
    if (!validateInvoiceBeforeDownload()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setLineHeightFactor(1.2);

    const invoiceNo = document.getElementById('invoiceNo').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const client = document.getElementById('clientName').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    const paymentTerms = document.getElementById('paymentTerms')?.value || '';
    const notes = document.getElementById('invoiceNotes')?.value || '';

    let dueDate = '';
    if (invoiceDate) {
      const inv = new Date(invoiceDate);
      const days = parseInt(paymentTerms, 10) || 0;
      inv.setDate(inv.getDate() + days);
      dueDate = inv.toISOString().slice(0, 10);
    }

    const settings = getSettings();
    const name = settings.companyName || 'Company Name';
    const address = settings.companyAddress || 'Company address not configured';
    const contact = (settings.companyPhone ? `${settings.companyPhone} | ` : '') + (settings.companyEmail || 'Email not configured');
    const gstin = settings.companyGstin ? `GSTIN : ${settings.companyGstin}` : '';
    const bankName = settings.bankName || 'Bank not configured';
    const bankAcct = settings.bankAccount || 'Account number not configured';
    const bankHolder = settings.bankHolder || 'Account holder not configured';
    const bankSwift = settings.bankSwift || 'Code not configured';
    const bankUpi = settings.bankUpi || 'Payment handle not configured';
    const payableTo = settings.payableTo || bankHolder;
    const displayInvoiceNo = buildDisplayInvoiceNo(settings.invoicePrefix, invoiceNo);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(name, 20, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let ay = 25;
    address.split('\n').forEach((line) => {
      doc.text(line, 20, ay);
      ay += 4;
    });
    doc.text(contact, 20, ay);
    ay += 4;
    if (gstin) {
      doc.text(gstin, 20, ay);
      ay += 4;
    }

    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 52, null, null, 'center');

    const invY = 60;
    const rightX = 190;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice # : ${displayInvoiceNo}`, rightX, invY - 2, null, null, 'right');
    doc.text(`Invoice Date : ${invoiceDate}`, rightX, invY + 2, null, null, 'right');
    doc.text(`Currency : ${getCurrency()}`, rightX, invY + 6, null, null, 'right');
    if (dueDate) {
      doc.text(`Due Date : ${dueDate}`, rightX, invY + 10, null, null, 'right');
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', 20, invY);
    doc.setFont('helvetica', 'normal');
    let billY = invY + 5;
    doc.text(client, 20, billY);
    billY += 5;
    clientAddress
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length)
      .forEach((line) => {
        doc.text(line, 20, billY);
        billY += 5;
      });
    doc.text(email, 20, billY);
    billY += 5;
    doc.text(phone, 20, billY);

    const tableBody = invoiceItems.map((item, index) => {
      const taxAmount = item.amount * (item.taxPct / 100);
      return [
        `${index + 1}`,
        `${item.serviceName}\nHSN: ${item.hsn || '-'}${item.serviceDesc ? `\n${item.serviceDesc}` : ''}${item.period ? `\n${item.period}` : ''}`,
        item.qty.toString(),
        item.rate.toFixed(2),
        { taxAmount: taxAmount.toFixed(2), taxPct: item.taxPct.toFixed(2) },
        item.amount.toFixed(2)
      ];
    });

    doc.autoTable({
      startY: billY + 8,
      margin: { left: 20, right: 20 },
      head: [[
        'Sr No.',
        'Product/Services',
        'Qty',
        'Rate',
        'Tax',
        'Amount'
      ]],
      body: tableBody,
      styles: { fontSize: 9, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 70, 136], textColor: 255 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 15 },
        1: { cellWidth: 69 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center', cellWidth: 23 },
        5: { halign: 'right', cellWidth: 26 }
      },
      didParseCell: (data) => {
        if (data.section === 'head' && [2, 3, 4, 5].includes(data.column.index)) {
          data.cell.styles.halign = 'right';
        }
        if (data.section === 'body' && data.column.index === 4 && data.cell.raw && typeof data.cell.raw === 'object') {
          data.cell.text = [''];
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 4 || !data.cell.raw || typeof data.cell.raw !== 'object') return;

        const pad = 1.5;
        const rightX = data.cell.x + data.cell.width - pad;
        const leftX = data.cell.x + pad;
        const maxW = Math.max(0, data.cell.width - pad * 2);
        const amountText = String(data.cell.raw.taxAmount);
        const igstText = `IGST:${data.cell.raw.taxPct}%`;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(amountText, rightX, data.cell.y + 5, { align: 'right', maxWidth: maxW });

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.text(igstText, rightX, data.cell.y + 8, { align: 'right', maxWidth: maxW });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      },
      theme: 'grid'
    });

    const totals = computeTotals();
    const finalY = doc.lastAutoTable.finalY + 6;
    const effectiveIgstRate = totals.subtotal > 0 ? (totals.igstTax / totals.subtotal) * 100 : 0;
    const totalBeforeGrand = Math.max(0, totals.subtotal + totals.igstTax);
    const hasShipping = totals.shipping > 0;
    const hasDiscount = totals.discount > 0;
    const labelLeftX = 128;
    const valueRightX = 190;
    doc.setFontSize(9);

    doc.text('Base Amount', labelLeftX, finalY);
    doc.text(formatMoney(totals.subtotal), valueRightX, finalY, null, null, 'right');
    doc.text(`(+) IGST: ${effectiveIgstRate.toFixed(2)}%`, labelLeftX, finalY + 6);
    doc.text(formatMoney(totals.igstTax), valueRightX, finalY + 6, null, null, 'right');
    doc.setFont('helvetica', 'bold');
    doc.text('Total', labelLeftX, finalY + 12);
    doc.text(formatMoney(totalBeforeGrand), valueRightX, finalY + 12, null, null, 'right');
    doc.setFont('helvetica', 'normal');

    let extraY = finalY + 18;
    if (hasShipping) {
      doc.text('(+) Shipping / Additional', labelLeftX, extraY);
      doc.text(formatMoney(totals.shipping), valueRightX, extraY, null, null, 'right');
      extraY += 6;
    }
    if (hasDiscount) {
      doc.text('(-) Discount (Flat)', labelLeftX, extraY);
      doc.text(formatMoney(totals.discount), valueRightX, extraY, null, null, 'right');
      extraY += 6;
    }

    const grandRectY = extraY - 4;
    const grandTextY = extraY;

    doc.setFillColor(0, 70, 136);
    doc.rect(labelLeftX, grandRectY, valueRightX - labelLeftX, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Grand Total', labelLeftX, grandTextY);
    doc.text(formatMoney(totals.grandTotal), valueRightX, grandTextY, null, null, 'right');
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(9);
    doc.text('Please Note', 20, finalY + 10);
    doc.setFontSize(8);
    const composedNotes = notes || settings.defaultNotes || 'Thank you for your business.';
    doc.text(composedNotes, 20, finalY + 15, { maxWidth: 110 });

    const boxY = grandTextY + 16;
    doc.rect(20, boxY, 85, 30);
    doc.rect(110, boxY, 85, 30);
    doc.setFontSize(9);
    doc.text('Payable To', 22, boxY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(payableTo, 22, boxY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text('Bank Details', 112, boxY + 5);
    doc.text(`BANK NAME: ${bankName}`, 112, boxY + 10);
    doc.text(`ACCOUNT HOLDER NAME: ${bankHolder}`, 112, boxY + 14);
    doc.text(`ACCOUNT NUMBER: ${bankAcct}`, 112, boxY + 18);
    doc.text(`SWIFT CODE: ${bankSwift}`, 112, boxY + 22);
    doc.text(`UPI ID: ${bankUpi}`, 112, boxY + 26);

    const signBoxY = boxY + 34;
    doc.text(`For ${name}`, 193, signBoxY + 10, null, null, 'right');
    doc.text(settings.signatoryName || 'Authorized Signatory', 193, signBoxY + 24, null, null, 'right');
    doc.text('(Authorised Signatory)', 193, signBoxY + 29, null, null, 'right');

    if (previewOnly) {
      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank');
      return;
    }

    doc.save(`Invoice_${displayInvoiceNo}.pdf`);
  } catch (err) {
    console.error('generatePDF error', err);
    alert(`Failed to generate PDF: ${err.message}`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  populateClientDropdown();
  populateServiceDropdown();

  const settings = getSettings();
  if (settings.defaultCurrency) document.getElementById('currency').value = settings.defaultCurrency;
  if (settings.defaultTaxPct !== undefined) document.getElementById('itemTax').value = settings.defaultTaxPct;
  if (settings.defaultPaymentTerms !== undefined) document.getElementById('paymentTerms').value = settings.defaultPaymentTerms;
  if (settings.defaultNotes) document.getElementById('invoiceNotes').value = settings.defaultNotes;
  renderInvoicePrefixInline(settings);

  document.getElementById('clientSelect')?.addEventListener('change', (e) => fillClientFields(e.target.value));
  document.getElementById('serviceSelect')?.addEventListener('change', (e) => fillServiceFields(e.target.value));
  document.getElementById('addItem').addEventListener('click', addInvoiceItem);
  window.addEventListener('resize', () => renderInvoicePrefixInline(settings));

  ['discount', 'shipping', 'currency'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderSummary);
  });

  M.FormSelect.init(document.querySelectorAll('select'));
  M.updateTextFields();
  renderItemTable();
});

function previewPDF() {
  generatePDF(true);
}

window.generatePDF = generatePDF;
window.previewPDF = previewPDF;
